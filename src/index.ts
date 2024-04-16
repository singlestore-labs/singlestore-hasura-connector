import { CapabilitiesResponse, Connector, ExplainResponse, MutationRequest, MutationResponse, QueryRequest, QueryResponse, SchemaResponse, start } from "@hasura/ndc-sdk-typescript";
import { Pool } from "mysql2";

async function parseConfiguration(configurationDir: string): Promise<Configuration> {

    throw new Error("Function not implemented.");
}

async function fetchMetrics(configuration: Configuration, state: State): Promise<undefined> {
    throw new Error("Function not implemented.");
}

async function healthCheck(configuration: Configuration, state: State): Promise<undefined> {
    throw new Error("Function not implemented.");
}

async function explain(configuration: Configuration, state: State, request: QueryRequest): Promise<ExplainResponse> {
    throw new Error("Function not implemented.");
}

async function mutation(configuration: Configuration, state: State, request: MutationRequest): Promise<MutationResponse> {
    throw new Error("Function not implemented.");
}

async function tryInitState(configuration: Configuration, metrics: unknown): Promise<State> {
    throw new Error("Function not implemented.");
}

function getCapabilities(configuration: Configuration): CapabilitiesResponse {
    throw new Error("Function not implemented.");
}

async function getSchema(configuration: Configuration): Promise<SchemaResponse> {
    throw new Error("Function not implemented.");
}

async function query(configuration: Configuration, state: State, request: QueryRequest): Promise<QueryResponse> {
    throw new Error("Function not implemented.");
}

async function queryExplain(configuration: Configuration, state: State, request: QueryRequest): Promise<ExplainResponse> {
    throw new Error("Function not implemented.");
}

async function mutationExplain(configuration: Configuration, state: State, request: MutationRequest): Promise<ExplainResponse> {
    throw new Error("Function not implemented.");
}

const connector: Connector<Configuration, State> = {
    parseConfiguration,
    tryInitState,
    fetchMetrics,
    healthCheck,
    getCapabilities,
    getSchema,
    queryExplain,
    mutationExplain,
    mutation,
    query
}

type Configuration = {
    tables: TableConfiguration[];
};

type TableConfiguration = {
    tableName: string;
    columns: { [k: string]: Column };
};

type Column = {};

type State = {
    connPool: Pool;
};

start(connector)
