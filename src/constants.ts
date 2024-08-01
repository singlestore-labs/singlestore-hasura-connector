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

export enum DataTypeClass {
    INTEGER = "INTEGER",
    REAL = "REAL",
    STRING = "STRING",
    BLOB = "BLOB",
    DATETIME = "DATETIME",
    OTHER = "OTHER"
}

export const SCALAR_TYPES: { [key: string]: ScalarType } = {
    INTEGER: {
        aggregate_functions: {
            "any_value": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "avg": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "count": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "max": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "median": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "min": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "std": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "stddev": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "stddev_pop": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "stddev_samp": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "sum": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "variance": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "var_samp": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            }
        },
        comparison_operators: {
            "equal": {
                type: "equal"
            },
            "greater": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "less": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "greater_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "less_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "INTEGER"
                }
            }
        }
    },
    REAL: {
        aggregate_functions: {
            "any_value": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "avg": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "count": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "max": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "median": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "min": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "std": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "stddev": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "stddev_pop": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "stddev_samp": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "sum": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "variance": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "var_samp": {
                result_type: {
                    type: "named",
                    name: "REAL"
                }
            }
        },
        comparison_operators: {
            "equal": {
                type: "equal"
            },
            "greater": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "less": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "greater_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "REAL"
                }
            },
            "less_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "REAL"
                }
            }
        }
    },
    STRING: {
        aggregate_functions: {
            "any_value": {
                result_type: {
                    type: "named",
                    name: "STRING"
                }
            },
            "count": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "group_concat": {
                result_type: {
                    type: "named",
                    name: "STRING"
                }
            },
            "max": {
                result_type: {
                    type: "named",
                    name: "STRING"
                }
            },
            "min": {
                result_type: {
                    type: "named",
                    name: "STRING"
                }
            },
        },
        comparison_operators: {
            "equal": {
                type: "equal"
            },
            "greater": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "STRING"
                }
            },
            "less": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "STRING"
                }
            },
            "greater_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "STRING"
                }
            },
            "less_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "STRING"
                }
            },
            "like": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "STRING"
                }
            },
        }
    },
    "BLOB": {
        aggregate_functions: {
            "any_value": {
                result_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
            "count": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "group_concat": {
                result_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
            "max": {
                result_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
            "min": {
                result_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
        },
        comparison_operators: {
            "equal": {
                type: "equal"
            },
            "greater": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
            "less": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
            "greater_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
            "less_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
            "like": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "BLOB"
                }
            },
        }
    },
    DATETIME: {
        aggregate_functions: {
            "any_value": {
                result_type: {
                    type: "named",
                    name: "DATETIME"
                }
            },
            "count": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
            "max": {
                result_type: {
                    type: "named",
                    name: "DATETIME"
                }
            },
            "min": {
                result_type: {
                    type: "named",
                    name: "DATETIME"
                }
            },
        },
        comparison_operators: {
            "equal": {
                type: "equal"
            },
            "greater": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "DATETIME"
                }
            },
            "less": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "DATETIME"
                }
            },
            "greater_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "DATETIME"
                }
            },
            "less_or_equal": {
                type: "custom",
                argument_type: {
                    type: "named",
                    name: "DATETIME"
                }
            }
        }
    },
    OTHER: {
        aggregate_functions: {
            "any_value": {
                result_type: {
                    type: "named",
                    name: "OTHER"
                }
            },
            "count": {
                result_type: {
                    type: "named",
                    name: "INTEGER"
                }
            },
        },
        comparison_operators: {
            "equal": {
                type: "equal"
            },
        }
    },
}