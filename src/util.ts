import mysql, { Pool } from 'mysql2/promise';
import { readFileSync } from 'fs'
import { ForeignKeyConstraint, UniquenessConstraint } from '@hasura/ndc-sdk-typescript';

// URL with credentials and options needed to establish connection to the SingleStore database
// The format is mysql://[<user>][:<password>][@<host>]/[<database>][?<key1>=<value1>[&<key2>=<value2>]]
// Connection options https://www.npmjs.com/package/mysql#connection-options
// Pool options https://www.npmjs.com/package/mysql#pool-options
//
// Example: "mysql://user:pass@host/db?debug=true"
const SINGLESTORE_URL = process.env["SINGLESTORE_URL"] as string | undefined;

const SINGLESTORE_HOST = process.env["SINGLESTORE_HOST"] as string | undefined;
const SINGLESTORE_PORT = process.env["SINGLESTORE_PORT"] as string | undefined;
const SINGLESTORE_USER = process.env["SINGLESTORE_USER"] as string | undefined;
const SINGLESTORE_PASSWORD = process.env["SINGLESTORE_PASSWORD"] as string | undefined;
const SINGLESTORE_DATABASE = process.env["SINGLESTORE_DATABASE"] as string | undefined;
const SINGLESTORE_SSL_CA = process.env["SINGLESTORE_SSL_CA"] as string | undefined;
const SINGLESTORE_SSL_CERT = process.env["SINGLESTORE_SSL_CERT"] as string | undefined;
const SINGLESTORE_SSL_KEY = process.env["SINGLESTORE_SSL_KEY"] as string | undefined;
const SINGLESTORE_SSL_CIPHERS = process.env["SINGLESTORE_SSL_CIPHERS"] as string | undefined;
const SINGLESTORE_SSL_PASSPHRASE = process.env["SINGLESTORE_SSL_PASSPHRASE"] as string | undefined;
const SINGLESTORE_SSL_REJECT_UNAUTHORIZED = process.env["SINGLESTORE_SSL_REJECT_UNAUTHORIZED"] as string | undefined;

export function createPool(): Pool {
    if (SINGLESTORE_URL) {
        return mysql.createPool(SINGLESTORE_URL)
    } else {
        return mysql.createPool({
            host: SINGLESTORE_HOST,
            port: Number(SINGLESTORE_PORT) || 3306,
            user: SINGLESTORE_USER,
            password: SINGLESTORE_PASSWORD,
            database: SINGLESTORE_DATABASE,
            ssl: (SINGLESTORE_SSL_CA || SINGLESTORE_SSL_CERT || SINGLESTORE_SSL_CIPHERS || SINGLESTORE_SSL_KEY || SINGLESTORE_SSL_PASSPHRASE || SINGLESTORE_SSL_REJECT_UNAUTHORIZED) ? {
                ca: SINGLESTORE_SSL_CA ? readFileSync(SINGLESTORE_SSL_CA) : undefined,
                cert: SINGLESTORE_SSL_CERT ? readFileSync(SINGLESTORE_SSL_CERT) : undefined,
                key: SINGLESTORE_SSL_KEY ? readFileSync(SINGLESTORE_SSL_KEY) : undefined,
                ciphers: SINGLESTORE_SSL_CIPHERS,
                passphrase: SINGLESTORE_SSL_PASSPHRASE,
                rejectUnauthorized: Boolean(SINGLESTORE_SSL_REJECT_UNAUTHORIZED)
            } : undefined
        })
    }
}

export enum TableType {
    Table,
    View
}

export type ColumnSchema = {
    name: string
    description: string | null
    type: string
    numeric_scale: number | null
    nullable: boolean
    auto_increment: boolean
}

export type TableSchema = {
    tableName: string;
    tableType: TableType;
    description: string | null;
    columns: ColumnSchema[];
    uniquenessConstraints: {
        [k: string]: UniquenessConstraint;
    };
    foreignKeys: {
        [k: string]: ForeignKeyConstraint;
    }
}

export type Configuration = {
    tables: TableSchema[];
};
