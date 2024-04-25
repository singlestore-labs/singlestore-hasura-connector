import { Configuration } from ".";
import mysql, { Connection, RowDataPacket } from "mysql2"

export function getConnection(configuration: Configuration): Connection {
    return mysql.createConnection({
        host: configuration.host,
        port: configuration.port,
        user: configuration.user,
        password: configuration.password
    })
}

export function getDatabases(conn: Connection): string[] {
    const databases: string[] = []

    conn.query<RowDataPacket[]>("SHOW DATABASES", (err, fields) => {
        if (err) throw err

        for (const row of fields) {
            if (!isSpecialDatabase(row['Database'])) {
                databases.push(row['Database'])
            }
        }
    })

    return databases
}

export function getTables(conn: Connection, database: string): string[] {
    const tables: string[] = []

    conn.query<RowDataPacket[]>(`SHOW TABLES FROM ${escapeIdentifier(database)}`, (err, fields) => {
        if (err) throw err

        for (const row of fields) {
            tables.push(row[0])
        }
    })

    return tables
}

function escapeIdentifier(ident: string): string {
    return "`" + ident.replace("`", "``") + "`";
}

function isSpecialDatabase(database: string): boolean {
    return database === "cluster" || database === "information_schema" || database == "memsql"
}