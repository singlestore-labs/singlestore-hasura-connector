import { BadGateway, CapabilitiesResponse, Connector, ExplainResponse, Forbidden, ForeignKeyConstraint, MutationRequest, MutationResponse, NotSupported, ObjectType, QueryRequest, QueryResponse, SchemaResponse, UniquenessConstraint, start } from "@hasura/ndc-sdk-typescript";
import mysql, { Pool } from 'mysql2/promise';
import { readFileSync } from "fs";
import { CAPABILITIES_RESPONSE } from "./constants";
import { doGetSchema } from "./handlers/schema";
import { doQuery } from "./handlers/query";
import { doQueryExplain } from "./handlers/queryExplain";
import { createPool } from "./util";

// URL with credentials and options needed to establish connection to the SingleStore database
// The format is mysql://[<user>][:<password>][@<host>]/[<database>][?<key1>=<value1>[&<key2>=<value2>]]
// Connection options https://www.npmjs.com/package/mysql#connection-options
// Pool options https://www.npmjs.com/package/mysql#pool-options
//
// Example: "mysql://user:pass@host/db?debug=true"
export const SINGLESTORE_URL = process.env["SINGLESTORE_URL"] as string | undefined;

export const SINGLESTORE_HOST = process.env["SINGLESTORE_HOST"] as string | undefined;
export const SINGLESTORE_PORT = process.env["SINGLESTORE_PORT"] as string | undefined;
export const SINGLESTORE_USER = process.env["SINGLESTORE_USER"] as string | undefined;
export const SINGLESTORE_PASSWORD = process.env["SINGLESTORE_PASSWORD"] as string | undefined;
export const SINGLESTORE_DATABASE = process.env["SINGLESTORE_DATABASE"] as string | undefined;
export const SINGLESTORE_SSL_CA = process.env["SINGLESTORE_SSL_CA"] as string | undefined;
export const SINGLESTORE_SSL_CERT = process.env["SINGLESTORE_SSL_CERT"] as string | undefined;
export const SINGLESTORE_SSL_KEY = process.env["SINGLESTORE_SSL_KEY"] as string | undefined;
export const SINGLESTORE_SSL_CIPHERS = process.env["SINGLESTORE_SSL_CIPHERS"] as string | undefined;
export const SINGLESTORE_SSL_PASSPHRASE = process.env["SINGLESTORE_SSL_PASSPHRASE"] as string | undefined;
export const SINGLESTORE_SSL_REJECT_UNAUTHORIZED = process.env["SINGLESTORE_SSL_REJECT_UNAUTHORIZED"] as string | undefined;

enum TableType {
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

type TableSchema = {
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
    jdbcUrl: string;
    tables: TableSchema[];
};

export type State = {
    connPool: Pool;
};

const connector: Connector<Configuration, State> = {
    /**
     * Validate the configuration files provided by the user, returning a validated 'Configuration',
     * or throwing an 'Error'. Throwing an error prevents Connector startup.
     * @param configuration
     */
    parseConfiguration(
        configurationDir: string
    ): Promise<Configuration> {
        let filePath = `${configurationDir}/configuration.json`;
        if (configurationDir.length === 0) {
            filePath = "configuration.json";
        }
        try {
            const fileContent = readFileSync(filePath, 'utf8');
            const configObject: Configuration = JSON.parse(fileContent);
            return Promise.resolve(configObject);
        } catch (error) {
            console.error("Failed to parse configuration:", error);
            throw new Forbidden(
                "Internal Server Error, server configuration is invalid",
                {}
            );
        }
    },

    /**
     * Initialize the connector's in-memory state.
     *
     * For example, any connection pools, prepared queries,
     * or other managed resources would be allocated here.
     *
     * In addition, this function should register any
     * connector-specific metrics with the metrics registry.
     * @param configuration
     * @param metrics
     */
    tryInitState(
        configuration: Configuration,
        metrics: unknown
    ): Promise<State> {
        const pool = createPool()

        return Promise.resolve({ connPool: pool })
    },

    /**
     *
     * Update any metrics from the state
     *
     * Note: some metrics can be updated directly, and do not
     * need to be updated here. This function can be useful to
     * query metrics which cannot be updated directly, e.g.
     * the number of idle connections in a connection pool
     * can be polled but not updated directly.
     * @param configuration
     * @param state
     */
    fetchMetrics(configuration: Configuration, state: State): Promise<undefined> {
        return Promise.resolve(undefined);
    },
    /**
     * Check the health of the connector.
     *
     * For example, this function should check that the connector
     * is able to reach its data source over the network.
     *
     * Should throw if the check fails, else resolve
     * @param configuration
     * @param state
     */
    async healthCheck(configuration: Configuration, state: State): Promise<undefined> {
        try {
            await state.connPool.execute("SELECT 1")
        } catch (x) {
            throw new BadGateway("Service Unavailable");
        }
    },

    /**
     * Get the connector's capabilities.
     *
     * This function implements the [capabilities endpoint](https://hasura.github.io/ndc-spec/specification/capabilities.html)
     * from the NDC specification.
     *
     * This function should be syncronous
     * @param configuration
     */
    getCapabilities(configuration: Configuration): CapabilitiesResponse {
        return CAPABILITIES_RESPONSE;
    },

    /**
     * Get the connector's schema.
     *
     * This function implements the [schema endpoint](https://hasura.github.io/ndc-spec/specification/schema/index.html)
     * from the NDC specification.
     * @param configuration
     */
    getSchema(configuration: Configuration): Promise<SchemaResponse> {
        return Promise.resolve(doGetSchema(configuration));
    },

    /**
     * Explain a query by creating an execution plan
     *
     * This function implements the [explain endpoint](https://hasura.github.io/ndc-spec/specification/explain.html)
     * from the NDC specification.
     * @param configuration
     * @param state
     * @param request
     */
    queryExplain(
        configuration: Configuration,
        state: State,
        request: QueryRequest
    ): Promise<ExplainResponse> {
        return doQueryExplain(configuration, state, request)
    },

    /**
     * Explain a mutation by creating an execution plan
     *
     * This function implements the [explain endpoint](https://hasura.github.io/ndc-spec/specification/explain.html)
     * from the NDC specification.
     * @param configuration
     * @param state
     * @param request
     */
    mutationExplain(
        configuration: Configuration,
        state: State,
        request: MutationRequest
    ): Promise<ExplainResponse> {
        throw new Error("Function not implemented.");
    },

    /**
     * Execute a mutation
     *
     * This function implements the [mutation endpoint](https://hasura.github.io/ndc-spec/specification/mutations/index.html)
     * from the NDC specification.
     * @param configuration
     * @param state
     * @param request
     */
    mutation(
        configuration: Configuration,
        state: State,
        request: MutationRequest
    ): Promise<MutationResponse> {
        throw new Error("Function not implemented.");
    },

    /**
     * Execute a query
     *
     * This function implements the [query endpoint](https://hasura.github.io/ndc-spec/specification/queries/index.html)
     * from the NDC specification.
     * @param configuration
     * @param state
     * @param request
     */
    query(
        configuration: Configuration,
        state: State,
        request: QueryRequest
    ): Promise<QueryResponse> {
        return doQuery(configuration, state, request)
    },
}

start(connector)
