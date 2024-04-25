import { SchemaResponse } from "@hasura/ndc-sdk-typescript";
import { Configuration } from "..";
import { getConnection, getDatabases, getTables } from "../utils";

export function do_get_schema(configuration: Configuration): SchemaResponse {
    const conn = getConnection(configuration)

    const databases = getDatabases(conn)
    for (const database of databases) {
        const tables = getTables(conn, database)
        for (const table in tables) {
            
        }
    }

    return {
        scalar_types: {},
        object_types: {},
        collections: [],
        functions: [],
        procedures: [],
    }
};