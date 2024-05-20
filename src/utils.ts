import { ObjectType, Type } from "@hasura/ndc-sdk-typescript"
import { Connection, QueryResult, RowDataPacket } from "mysql2/promise"

const SYSTEM_DATABASES = ["cluster", "information_schema", "memsql"]

export async function showDatabases(conn: Connection): Promise<string[]> {
    const [rows, _] = await conn.query<RowDataPacket[]>("SHOW DATABASES")

    return rows.map(row => row['Database']).filter(database => !SYSTEM_DATABASES.includes(database))
}

export async function showTables(conn: Connection, database: string): Promise<string[]> {
    const [rows, _] = await conn.query<RowDataPacket[]>(`SHOW TABLES IN ${escapeIdentifier(database)}`)

    return rows.map(row => escapeTableName(database, String(Object.values(row)[0])))
}

export async function getTableObjectType(conn: Connection, table: string): Promise<ObjectType> {
    const [rows, _] = await conn.query<RowDataPacket[]>(`SHOW COLUMNS FROM ${table}`)

    return Promise.resolve({ fields: Object.fromEntries(rows.map(row => [getNameFromRow(row), { type: getTypeFromRow(row) }])) })
}

function getNameFromRow(row: RowDataPacket): string {
    return row['Field']
}

function formatTypeString(type: string): string {
    const indexOfBracket = type.indexOf("(")
    if (indexOfBracket != -1) {
        type = type.substring(0, indexOfBracket)
    }
    return type.toUpperCase()
}

function mapStringToType(type: string): Type {
    switch (type) {
        case "TINYINT":
        case "SMALLINT":
        case "MEDIUMINT":
        case "INT":
        case "BIGINT":
            return { type: "named", name: "Int" };
        case "FLOAT":
        case "DOUBLE":
        case "DECIMAL":
            return { type: "named", name: "Float" };
        case "DATE":
        case "TIME":
        case "DATETIME":
        case "TIMESTAMP":
        case "YEAR":
            // TODO: handle differently
            return { type: "named", name: "String" };
        case "CHAR":
        case "VARCHAR":
        case "TINYTEXT":
        case "MEDIUMTEXT":
        case "TEXT":
        case "LONGTEXT":
            return { type: "named", name: "String" };
        case "BIT":
        case "BINARY":
        case "VARBINARY":
        case "TINYBLOB":
        case "MEDIUMBLOB":
        case "BLOB":
        case "LONGBLOB":
            // TODO: handle differently
            return { type: "named", name: "String" };
        case "JSON":
        case "GEOGRAPHY":
        case "GEOGRAPHYPOINT":
        case "ENUM":
        case "SET":
        case "VECTOR":
            // TODO: handle differently
            return { type: "named", name: "String" };
        default:
            throw new Error(`Data type ${type} is not supported`);
    }
}

function makeTypeNullable(type: Type): Type {
    return { type: "nullable", underlying_type: type }
}

function getTypeFromRow(row: RowDataPacket): Type {
    const typeString: string = formatTypeString(row['Type'])
    var type: Type = mapStringToType(typeString)

    if (row['Null'] == 'YES') {
        type = makeTypeNullable(type)
    }

    return type
}

function escapeIdentifier(identifier: string): string {
    return "`" + identifier.replace("`", "``") + "`"
}

function escapeTableName(database: string, table: string): string {
    return escapeIdentifier(database) + "." + escapeIdentifier(table)
}
