import { ExplainResponse, QueryRequest } from "@hasura/ndc-sdk-typescript";
import { Configuration, State } from "..";
import { generateQueries } from "./query";

export function doQueryExplain(
    configuration: Configuration,
    state: State,
    request: QueryRequest): Promise<ExplainResponse> {
    const queries = generateQueries(configuration, request)
    return Promise.resolve({
        details: {
            queries: JSON.stringify(queries)
        }
    })
}
