import * as fs from "fs";
import { promisify } from "util";
import { ColumnSchema, Configuration, createPool, TableType } from "./src/util";
import { RowDataPacket, PoolOptions, ConnectionConfig } from "mysql2";
import { UniquenessConstraint } from "@hasura/ndc-sdk-typescript";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

let HASURA_CONFIGURATION_DIRECTORY = process.env["HASURA_CONFIGURATION_DIRECTORY"] as string | undefined;
if (HASURA_CONFIGURATION_DIRECTORY === undefined || HASURA_CONFIGURATION_DIRECTORY.length === 0) {
    HASURA_CONFIGURATION_DIRECTORY = ".";
}

let pool = createPool();

function escapeStringLiteral(str: string): string {
    return "'" + str.replace("'", "\\'").replace("\\", "\\\\") + "'";
}

interface SingleStorePoolOptions extends PoolOptions {
    connectionConfig: ConnectionConfig
}

interface UniqueKey {
    name: string
    columns: string[]
}

async function main() {
    const database = (pool.pool.config as SingleStorePoolOptions).connectionConfig.database

    const tables = await pool.execute<RowDataPacket[]>(`SELECT
            CONCAT(tables.TABLE_SCHEMA, '.', tables.TABLE_NAME) AS TABLE_NAME,
            tables.TABLE_TYPE,
            tables.table_COMMENT as DESCRIPTION,
            cols.COLUMNS,
            uc.UNIQUE_CONSTRAINTS
        FROM (
            SELECT *
            FROM INFORMATION_SCHEMA.TABLES tables
            WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
            ${database ?
            `AND tables.TABLE_SCHEMA IN (${escapeStringLiteral(database)})` :
            "AND tables.TABLE_SCHEMA NOT IN ('cluster', 'information_schema', 'memsql')"}
        ) tables
        LEFT OUTER JOIN (
            SELECT
                columns.TABLE_SCHEMA,
                columns.TABLE_NAME,
                JSON_AGG(JSON_BUILD_OBJECT(
                    'name', columns.column_name,
                    'description', columns.column_comment,
                    'type', columns.data_type,
                    'numeric_scale', columns.numeric_scale,
                    'nullable', if (columns.is_nullable = 'yes', true, false),
                    'auto_increment', if(columns.extra = 'auto_increment', true, false)
                )) as COLUMNS
            FROM INFORMATION_SCHEMA.COLUMNS columns
            GROUP BY columns.TABLE_SCHEMA, columns.TABLE_NAME
        ) AS cols ON cols.TABLE_SCHEMA = tables.TABLE_SCHEMA AND cols.TABLE_NAME = tables.TABLE_NAME
        LEFT OUTER JOIN (
            SELECT 
                CONSTRAINT_SCHEMA,
                TABLE_NAME,
                JSON_AGG(UNIQUE_CONSTRAINT) as UNIQUE_CONSTRAINTS
            FROM (
                SELECT 
                    tc.CONSTRAINT_SCHEMA, 
                    tc.TABLE_NAME, 
                    JSON_BUILD_OBJECT("name", tc.CONSTRAINT_NAME, "columns", JSON_AGG(kcu.COLUMN_NAME ORDER BY kcu.ORDINAL_POSITION))  as UNIQUE_CONSTRAINT
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
                ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA AND tc.TABLE_NAME = kcu.TABLE_NAME AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
                WHERE tc.CONSTRAINT_TYPE = 'UNIQUE'
                GROUP BY tc.CONSTRAINT_SCHEMA, tc.TABLE_NAME, tc.CONSTRAINT_NAME
            )
            GROUP BY CONSTRAINT_SCHEMA, TABLE_NAME                
        ) AS uc ON uc.CONSTRAINT_SCHEMA = tables.TABLE_SCHEMA AND uc.TABLE_NAME = tables.TABLE_NAME
    `);

    const configuration: Configuration = {
        tables: tables[0].map(table => {
            const constraints: { [k: string]: UniquenessConstraint } = {};
            if (table["UNIQUE_CONSTRAINTS"]) {
                (table["UNIQUE_CONSTRAINTS"] as UniqueKey[]).forEach(key => {
                    constraints[key.name] = { unique_columns: key.columns }
                })
            }

            return {
                tableName: table["TABLE_NAME"],
                description: table["DESCRIPTION"],
                tableType: table["TABLE_TYPE"] == "BASE TABLE" ? TableType.Table : TableType.View,
                columns: table["COLUMNS"] as ColumnSchema[],
                uniquenessConstraints: constraints,
                foreignKeys: {}
            }
        })
    }

    const jsonString = JSON.stringify(configuration, null, 4);
    let filePath = `${HASURA_CONFIGURATION_DIRECTORY}/configuration.json`;
    try {
        const existingData = await readFile(filePath, 'utf8');
        if (existingData !== jsonString) {
            await writeFile(filePath, jsonString);
            console.log('File updated.');
        } else {
            console.log('No changes detected. File not updated.');
        }
    } catch (error) {
        await writeFile(filePath, jsonString);
        console.log('New file written.');
    }
}

main()
    .then(() => pool.end());
