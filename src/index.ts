import { CapabilitiesResponse, Connector, ExplainResponse, Forbidden, MutationRequest, MutationResponse, NotSupported, QueryRequest, QueryResponse, SchemaResponse, start } from "@hasura/ndc-sdk-typescript";
import mysql, { Pool } from 'mysql2/promise';
import { readFileSync } from "fs";
import { CAPABILITIES_RESPONSE } from "./constants";
import { do_get_schema } from "./handlers/schema";

export type Configuration = {
    host: string
    port: number
    user: string
    password: string
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
        let filePath = `${configurationDir}/config.json`;
        if (configurationDir.length === 0) {
            filePath = "config.json";
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
        const pool = mysql.createPool({
            user: configuration.user,
            port: configuration.port,
            host: configuration.host,
            password: configuration.password,
        })

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
        throw new Error("Function not implemented.");
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
    healthCheck(configuration: Configuration, state: State): Promise<undefined> {
        throw new Error("Function not implemented.");
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
        return Promise.resolve(do_get_schema(configuration));
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
        throw new Error("Function not implemented.");
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
        throw new Error("Function not implemented.");
    },
}

start(connector)
