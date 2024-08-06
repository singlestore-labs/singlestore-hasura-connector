import { QueryRequest } from "@hasura/ndc-sdk-typescript"
import { Configuration } from ".."
import { SingleStoreQueryBuilder } from "./SingleStoreQueryBuilder"

export class SingleStoreQuery {
    sql: string
    parameters: any[]

    constructor(sql: string, parameters: any[]) {
        this.sql = sql
        this.parameters = parameters
    }

    static build(configuration: Configuration, query: QueryRequest, variables: { [k: string]: unknown }): SingleStoreQuery {
        return new SingleStoreQueryBuilder(
            configuration,
            variables,
            query.collection,
            query.collection_relationships
        ).build(query.query)
    }
}
