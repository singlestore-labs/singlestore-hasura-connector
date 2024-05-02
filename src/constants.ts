import { CapabilitiesResponse, ScalarType } from "@hasura/ndc-sdk-typescript";

export const CAPABILITIES_RESPONSE: CapabilitiesResponse = {
    version: "0.1.2",
    capabilities: {
        query: {
            aggregates: {},
            variables: {},
            explain: {}
        },
        mutation: {
            transactional: {},
            explain: {}
        },
        relationships: {
            order_by_aggregate: {},
            relation_comparisons: {}
        }
    },
};

export const SCALAR_TYPES: { [key: string]: ScalarType } = {
}