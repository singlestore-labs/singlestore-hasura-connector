import fs from "fs";
import { Configuration } from "./src";
import { getTableObjectType, showDatabases, showTables } from "./src/utils";
import mysql, { Connection } from "mysql2/promise";

let HASURA_CONFIGURATION_DIRECTORY = process.env["HASURA_CONFIGURATION_DIRECTORY"] as string | undefined;
if (HASURA_CONFIGURATION_DIRECTORY === undefined || HASURA_CONFIGURATION_DIRECTORY.length === 0) {
    HASURA_CONFIGURATION_DIRECTORY = ".";
}

const SINGLESTORE_HOST = process.env["SINGLESTORE_HOST"] as string;
const SINGLESTORE_PORT = process.env["SINGLESTORE_PORT"] as string;
const SINGLESTORE_USER = process.env["SINGLESTORE_USER"] as string;
const SINGLESTORE_PASSWORD = process.env["SINGLESTORE_PASSWORD"] as string;

function updateFile(filePath: string, data: string) {
    try {
        const existingData = fs.readFileSync(filePath, 'utf8');
        if (existingData !== data) {
            fs.writeFileSync(filePath, data);
            console.log('File updated.');
        } else {
            console.log('No changes detected. File not updated.');
        }
    } catch (error) {
        fs.writeFileSync(filePath, data);
        console.log('New file written.');
    }
}

async function main() {
    const conn: Connection = await mysql.createConnection({
        host: SINGLESTORE_HOST,
        port: Number(SINGLESTORE_PORT),
        user: SINGLESTORE_USER,
        password: SINGLESTORE_PASSWORD
    })

    const tableNames: string[] = []
    const objectTypes: Record<string, any> = {};

    for (let database of await showDatabases(conn)) {
        for (let table of await showTables(conn, database)) {
            tableNames.push(table)
            objectTypes[table] = await getTableObjectType(conn, table)
        }
    }

    const res: Configuration = {
        config: {
            tableNames: tableNames,
            objectTypes: objectTypes
        },
    };

    const jsonString = JSON.stringify(res, null, 4);
    let filePath = `${HASURA_CONFIGURATION_DIRECTORY}/config.json`;
    updateFile(filePath, jsonString)
}

main()
