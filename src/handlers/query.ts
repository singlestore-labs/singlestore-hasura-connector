import { Configuration, State } from "..";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { SingleStoreQuery } from "../sql/SingleStoreQuery";
import { Field, Query, QueryRequest, QueryResponse, RowSet } from "@hasura/ndc-sdk-typescript";

export async function doQuery(
    configuration: Configuration,
    state: State,
    query: QueryRequest
): Promise<QueryResponse> {
    let queries = generateQueries(configuration, query);
    return performQueries(state, queries, query);
}

function performQueries(state: State, queries: SingleStoreQuery[], request: QueryRequest): Promise<QueryResponse> {
    var results: Promise<RowSet>[] = []
    for (const query of queries) {
        console.log(query)
        const res = state.connPool.execute<RowDataPacket[]>(query.sql, query.parameters)
            .then(([res, fields]: [RowDataPacket[], FieldPacket[]]): any => {
                let rowSet = res[0].data as RowSet;
                fixNullRowSets(rowSet, request.query)
                return rowSet;
            })
        results.push(res)
    }

    return Promise.all(results)
}

function fixNullRowSets(rowSet: RowSet, query: Query) {
    if (query.fields) {
        if (rowSet.rows == null) {
            rowSet.rows = []
        }

        const fields: {
            [k: string]: Field;
        } = query.fields;

        Object.keys(fields).forEach(fieldName => {
            const field: Field = fields[fieldName]
            if (field.type == "relationship" && field.query.fields) {
                rowSet.rows?.forEach(row => {
                    if (row[fieldName] == null) {
                        row[fieldName] = {
                            rows: []
                        }
                    } else {
                        fixNullRowSets(row[fieldName] as RowSet, field.query)
                    }
                })
            }
        })
    }
}

export function generateQueries(configuration: Configuration, query: QueryRequest): SingleStoreQuery[] {
    if (query.variables) {
        return query.variables.map(variables => SingleStoreQuery.build(configuration, query, variables))
    } else {
        return [SingleStoreQuery.build(configuration, query, {})]
    }
}