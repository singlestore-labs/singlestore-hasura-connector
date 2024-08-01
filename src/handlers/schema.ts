import { CollectionInfo, ObjectField, ObjectType, SchemaResponse, Type, UnprocessableContent } from "@hasura/ndc-sdk-typescript";
import { ColumnSchema, Configuration } from "..";
import { DataTypeClass, SCALAR_TYPES } from "../constants";

export function doGetSchema(configuration: Configuration): SchemaResponse {
    let collectionInfos: CollectionInfo[] = [];
    let object_types: { [k: string]: ObjectType } = {};

    for (const table of configuration.tables) {
        object_types[table.tableName] = {
            description: table.description,
            fields: convertColumnsToFields(table.columns)
        }

        collectionInfos.push({
            name: table.tableName,
            description: table.description,
            arguments: {},
            type: table.tableName,
            uniqueness_constraints: table.uniquenessConstraints,
            foreign_keys: table.foreignKeys
        })
    }

    const schemaResponse: SchemaResponse = {
        scalar_types: SCALAR_TYPES,
        object_types: object_types,
        collections: collectionInfos,
        functions: [],
        procedures: []
    };
    return schemaResponse;
};

function convertColumnsToFields(columns: ColumnSchema[]): { [k: string]: ObjectField } {
    let res: { [k: string]: ObjectField } = {}
    for (const column of columns) {
        res[column.name] = {
            description: column.description,
            type: columnToType(column)
        }
    }

    return res
}

function columnToType(column: ColumnSchema): Type {
    let t: Type = {
        type: "named",
        name: mapSingleStoreType(column.type)
    }

    if (column.nullable) {
        return wrapNullable(t)
    } else {
        return t
    }
}

function wrapNullable(t: Type): Type {
    return {
        type: "nullable",
        underlying_type: t
    }
}

function mapSingleStoreType(type: string): DataTypeClass {
    switch (type.toUpperCase()) {
        case "TINYINT":
        case "SMALLINT":
        case "MEDIUMINT":
        case "INT":
        case "BIGINT":
            return DataTypeClass.INTEGER
        case "FLOAT":
        case "DOUBLE":
        case "DECIMAL":
            return DataTypeClass.REAL
        case "DATE":
        case "TIME":
        case "DATETIME":
        case "TIMESTAMP":
        case "YEAR":
            return DataTypeClass.DATETIME
        case "CHAR":
        case "VARCHAR":
        case "TINYTEXT":
        case "MEDIUMTEXT":
        case "TEXT":
        case "LONGTEXT":
            return DataTypeClass.STRING
        case "BIT":
        case "BINARY":
        case "VARBINARY":
        case "TINYBLOB":
        case "MEDIUMBLOB":
        case "BLOB":
        case "LONGBLOB":
            return DataTypeClass.BLOB
        case "JSON":
        case "GEOGRAPHY":
        case "GEOGRAPHYPOINT":
        case "ENUM":
        case "SET":
        case "VECTOR":
            return DataTypeClass.OTHER;
        default:
            throw new Error(`Data type ${type} is not supported`);

    }
}
