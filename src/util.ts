import mysql, { Pool } from 'mysql2/promise';
import { readFileSync } from 'fs'
import { SINGLESTORE_DATABASE, SINGLESTORE_HOST, SINGLESTORE_PASSWORD, SINGLESTORE_PORT, SINGLESTORE_SSL_CA, SINGLESTORE_SSL_CERT, SINGLESTORE_SSL_CIPHERS, SINGLESTORE_SSL_KEY, SINGLESTORE_SSL_PASSPHRASE, SINGLESTORE_SSL_REJECT_UNAUTHORIZED, SINGLESTORE_URL, SINGLESTORE_USER } from ".";

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