import { Aggregate, BadRequest, ComparisonTarget, ComparisonValue, ExistsInCollection, Expression, Field, OrderBy, OrderByElement, PathElement, Query, Relationship } from "@hasura/ndc-sdk-typescript"
import { Configuration } from ".."
import { SingleStoreQuery } from "./SingleStoreQuery"
import { AliasGenerator } from "./AliasGenerator"

export class SingleStoreQueryBuilder {
    configuration: Configuration
    variables: { [k: string]: unknown }
    collection: string
    relationships: { [k: string]: Relationship }
    parent: string | null
    parentRelationship: Relationship | null
    aggregateRowsToObject = true
    defaultOrderByColumn: string | null = null
    aliasGenerator: AliasGenerator = new AliasGenerator()

    subqueries: { [k: string]: SingleStoreQuery } = {}
    orderByElementToSubqueryAlias: Map<OrderByElement, string> = new Map<OrderByElement, string>()
    comparisonTargetToSubqueryAlias: Map<ComparisonTarget, string> = new Map<ComparisonTarget, string>()
    sqlParts: string[] = []
    parameters: any[] = []

    constructor(configuration: Configuration,
        variables: { [k: string]: unknown },
        collection: string,
        relationships: { [k: string]: Relationship },
        parent: string | null = null,
        parentRelationship: Relationship | null = null,
        aggregateRowsToObject = true
    ) {
        this.configuration = configuration
        this.variables = variables
        this.collection = collection
        this.relationships = relationships
        this.parent = parent
        this.parentRelationship = parentRelationship
        this.aggregateRowsToObject = aggregateRowsToObject
    }

    private select(query: Query): SingleStoreQueryBuilder {
        if (query.aggregates) {
            this.defaultOrderByColumn = "data"
            this.aggregateRowsToObject = false
            this.sqlParts.push(this.selectAggregates(query.aggregates))
        } else if (query.fields) {
            if (this.aggregateRowsToObject) {
                this.defaultOrderByColumn = "row"
            }
            this.sqlParts.push(this.selectFields(query.fields))
        } else {
            throw new BadRequest("Neither aggregates nor fields are specified")
        }

        return this
    }

    private selectAggregates(aggregates: { [k: string]: Aggregate }): string {
        return `SELECT JSON_BUILD_OBJECT('aggregates', JSON_BUILD_OBJECT(${Object.entries(aggregates)
            .map(([aggregateName, aggregate]): string => {
                switch (aggregate.type) {
                    case 'star_count':
                        // TODO: escape
                        return `'${aggregateName}', COUNT(1)`
                    case 'column_count':
                        // TODO: escape
                        return `'${aggregateName}', COUNT(${aggregate.distinct ? "DISTINCT" : ""} ${aggregate.column})`
                    case 'single_column':
                        // TODO: escape
                        return `'${aggregateName}', ${this.mapAggregate(aggregate.function)}(${aggregate.column})`
                }
            }).join(", ")})) AS data`
    }

    private mapAggregate(aggregate: string): string {
        switch (aggregate) {
            case "any_value":
                return "ANY_VALUE"
            case "avg":
                return "AVG"
            case "count":
                return "COUNT"
            case "max":
                return "MAX"
            case "median":
                return "MEDIAN"
            case "min":
                return "MIN"
            case "std":
                return "STD"
            case "stddev":
                return "STDDEV"
            case "stddev_pop":
                return "STDDEV_POP"
            case "stddev_samp":
                return "STDDEV_SAMP"
            case "sum":
                return "SUM"
            case "variance":
                return "VARIANCE"
            case "var_samp":
                return "VAR_SAMP"
            case "group_concat":
                return "GROUP_CONCAT"
            default:
                throw new BadRequest("Unknown aggregate function operator");
        }
    }

    private selectFields(fields: { [k: string]: Field }): string {
        return `SELECT JSON_BUILD_OBJECT(${Object.entries(fields)
            .map(([fieldName, field]): string => {
                switch (field.type) {
                    case "column":
                        // TODO: escape
                        return `'${fieldName}', ${this.collection}.${field.column}`
                    case "relationship":
                        const tableName = this.aliasGenerator.newAlies()
                        const relationship = this.relationships[field.relationship]

                        this.subqueries[tableName] = new SingleStoreQueryBuilder(
                            this.configuration,
                            this.variables,
                            relationship.target_collection,
                            this.relationships,
                            this.collection,
                            relationship
                        ).build(field.query)

                        // TODO: escape
                        return `'${fieldName}', ${tableName}.data`
                }
            }).join(", ")}) AS row`
    }

    private subqueriesFromOrderBy(orderBy?: OrderBy | null) {
        orderBy?.elements.filter(element => element.target.path.length > 0)
            .forEach(element => {
                const rel: Relationship = this.relationships[element.target.path[0].relationship]
                const target = element.target

                var colName
                switch (target.type) {
                    case "column":
                        colName = target.name
                        break
                    case "single_column_aggregate":
                        colName = target.column
                        break
                    case "star_count_aggregate":
                        colName = "*"
                }
                const query: Query = this.pathToQuery(element.target.path, colName)
                var subquery = new SingleStoreQueryBuilder(
                    this.configuration,
                    this.variables,
                    rel.target_collection,
                    this.relationships,
                    this.collection,
                    rel,
                    false
                ).build(query)

                var tableName = this.aliasGenerator.newAlies()
                switch (target.type) {
                    case "column":
                        // TODO: escape
                        subquery = new SingleStoreQuery(
                            `SELECT ANY_VALUE(${tableName}.${target.name}) AS order_expr FROM ((${subquery.sql}) AS ${tableName})`,
                            subquery.parameters
                        )
                        break;
                    case "single_column_aggregate":
                        // TODO: escape
                        subquery = new SingleStoreQuery(
                            `SELECT ${this.mapAggregate(target.function)}(${tableName}.${target.column}) AS order_expr FROM ((${subquery}) AS ${tableName})`,
                            subquery.parameters
                        )
                        break;
                    case "star_count_aggregate":
                        // TODO: escape
                        subquery = new SingleStoreQuery(
                            `SELECT COUNT(*) AS order_expr FROM ((${subquery}) AS ${tableName})`,
                            subquery.parameters
                        )
                        break;
                }

                tableName = this.aliasGenerator.newAlies()
                this.subqueries[tableName] = subquery
                this.orderByElementToSubqueryAlias.set(element, tableName)
            })
    }

    private pathToQuery(path: PathElement[], fieldName: string): Query {
        var res: Query = {
            fields: {
                fieldName: {
                    type: "column",
                    column: fieldName
                }
            },
            predicate: path[path.length - 1].predicate
        }

        for (let i = path.length - 1; i >= 1; i--) {
            res = {
                fields: {
                    fieldName: {
                        type: "relationship",
                        query: res,
                        relationship: path[i].relationship,
                        arguments: {}
                    }
                },
                predicate: path[i - 1].predicate
            }
        }

        return res
    }

    private from() {
        // TODO: escape
        this.sqlParts.push(`FROM ${this.collection}`)
    }

    private join() {
        Object.keys(this.subqueries).forEach(alias => {
            const subquery = this.subqueries[alias]
            this.parameters.push(subquery.parameters)
            this.sqlParts.push(`LEFT OUTER JOIN LATERAL (
${subquery.sql}
) AS ${alias} ON TRUE`)
        });
    }

    private where(predicate?: Expression | null) {
        this.sqlParts.push(this.visitWhere(this.collection, predicate, this.parent, this.parentRelationship))
    }

    private visitWhere(collection: string, predicate: Expression | null | undefined, parent: string | null, parentRelationship: Relationship | null): string {
        if (predicate && parent != null) {
            return `WHERE (${this.visitExpression(collection, predicate)}) AND (${this.visitWhereParent(collection, parent, parentRelationship as Relationship)})`
        } else if (predicate) {
            return `WHERE ${this.visitExpression(collection, predicate)}`
        } else if (parent != null) {
            return `WHERE ${this.visitWhereParent(collection, parent, parentRelationship as Relationship)}`
        } else {
            return ""
        }
    }

    private visitExpression(collection: string, expression: Expression): string {
        switch (expression.type) {
            case "and":
                if (expression.expressions.length > 0) {
                    return expression.expressions
                        .map(e => `(${this.visitExpression(collection, e)})`)
                        .join(" AND ");
                } else {
                    return "TRUE";
                }
            case "or":
                if (expression.expressions.length > 0) {
                    return expression.expressions
                        .map(e => `(${this.visitExpression(collection, e)})`)
                        .join(" OR ");
                } else {
                    return "FALSE";
                }
            case "not":
                return `NOT (${this.visitExpression(collection, expression.expression)})`
            case "unary_comparison_operator":
                switch (expression.operator) {
                    case "is_null":
                        return `${this.visitComparisonTarget(collection, expression.column)} IS NULL`
                    default:
                        throw new BadRequest("Unknown comparison operator");
                }
            case "binary_comparison_operator":
                switch (expression.operator) {
                    case "equal":
                        return `${this.visitComparisonTarget(collection, expression.column)} = ${this.visitComparisonValue(collection, expression.value)} `
                    case "greater":
                        return `${this.visitComparisonTarget(collection, expression.column)} > ${this.visitComparisonValue(collection, expression.value)} `
                    case "less":
                        return `${this.visitComparisonTarget(collection, expression.column)} < ${this.visitComparisonValue(collection, expression.value)}`
                    case "greater_or_equal":
                        return `${this.visitComparisonTarget(collection, expression.column)} >= ${this.visitComparisonValue(collection, expression.value)} `
                    case "less_or_equal":
                        return `${this.visitComparisonTarget(collection, expression.column)} <= ${this.visitComparisonValue(collection, expression.value)} `
                    case "like":
                        return `${this.visitComparisonTarget(collection, expression.column)} LIKE ${this.visitComparisonValue(collection, expression.value)} `
                    default:
                        throw new BadRequest("Unknown comparison operator");
                }
            case "exists":
                const collectionInfo: ExistsInCollection = expression.in_collection
                switch (collectionInfo.type) {
                    case "related":
                        const relationship: Relationship = this.relationships[collectionInfo.relationship]

                        return `EXISTS (
SELECT 1 FROM ${relationship.target_collection} 
${this.visitWhere(relationship.target_collection, expression.predicate, collection, relationship)}
LIMIT 1
)`
                    case "unrelated":
                        return `EXISTS (
SELECT 1 FROM ${collectionInfo.collection} 
${this.visitWhere(collection, expression.predicate, null, null)}
LIMIT 1
)`
                    default:
                        throw new BadRequest("Unknown exists type");
                }
            default:
                throw new BadRequest("Unknown expression type");
        }
    }

    private visitComparisonTarget(collection: string, target: ComparisonTarget) {
        switch (target.type) {
            case "column":
                if (target.path.length > 0) {
                    // TODO: escape
                    return `${this.comparisonTargetToSubqueryAlias.get(target)}.comp_expr`
                } else {
                    // TODO: escape
                    return `${collection}.${target.name}`;
                }
            case 'root_collection_column':
                // TODO: escape
                return `${this.collection}.${target.name}`;
        }
    }

    private visitComparisonValue(collection: string, value: ComparisonValue) {
        switch (value.type) {
            case 'scalar':
                this.parameters.push(value.value);
                return "?";
            case 'column':
                return this.visitComparisonTarget(collection, value.column)
            case 'variable':
                this.parameters.push(this.variables[value.name]);
                return "?";
        }
    }

    private visitWhereParent(collection: string, parent: string, parentRelationship: Relationship): string {
        return Object.keys(parentRelationship.column_mapping)
            // TODO: escape
            .map(key => `${parent}.${key} = ${collection}.${parentRelationship.column_mapping[key]} `)
            .join(" AND ")
    }

    private subqueriesFromExpression(expression?: Expression | null) {
        if (expression) {
            switch (expression.type) {
                case "and":
                    expression.expressions.map(e => this.subqueriesFromExpression(e))
                    break
                case "or":
                    expression.expressions.map(e => this.subqueriesFromExpression(e))
                    break
                case "not":
                    this.subqueriesFromExpression(expression.expression)
                    break
                case "unary_comparison_operator":
                    this.subqueriesFromComparisonTarget(expression.column)
                    break
                case "binary_comparison_operator":
                    this.subqueriesFromComparisonTarget(expression.column)
                    this.subqueriesFromComparisonValue(expression.value)
                    break
                case "exists":
                    this.subqueriesFromExpression(expression.predicate)
                    break
            }
        }
    }

    private subqueriesFromComparisonTarget(target: ComparisonTarget) {
        if (target.type == "column" && target.path.length > 0) {
            const rel: Relationship = this.relationships[target.path[0].relationship]

            const query: Query = this.pathToQuery(target.path, target.name)
            var subquery = new SingleStoreQueryBuilder(
                this.configuration,
                this.variables,
                rel.target_collection,
                this.relationships,
                this.collection,
                rel,
                false
            ).build(query)

            var tableName = this.aliasGenerator.newAlies()
            subquery = new SingleStoreQuery(
                // TODO escape
                `SELECT ANY_VALUE(${tableName}.${target.name}) AS comp_expr FROM ((${subquery.sql}) AS ${tableName})`,
                subquery.parameters
            )

            tableName = this.aliasGenerator.newAlies()
            this.subqueries[tableName] = subquery
            this.comparisonTargetToSubqueryAlias.set(target, tableName)
        }
    }

    private subqueriesFromComparisonValue(value: ComparisonValue) {
        if (value.type == "column") {
            this.subqueriesFromComparisonTarget(value.column)
        }
    }

    private orderBy(orderBy?: OrderBy | null) {
        if (orderBy && orderBy.elements.length > 0) {
            this.sqlParts.push(`ORDER BY ${orderBy.elements.map(element => {
                const direction = element.order_direction === 'asc' ? 'ASC' : 'DESC';
                if (element.target.path.length > 0) {
                    // TODO escape
                    return `${this.orderByElementToSubqueryAlias.get(element)}.order_expr ${direction} `;
                } else {
                    switch (element.target.type) {
                        case 'column':
                            // TODO escape
                            return `${this.collection}.${element.target.name} ${direction} `;
                        case 'single_column_aggregate':
                            throw new BadRequest("Empty path for single_column_aggregate orderby element");
                        case 'star_count_aggregate':
                            throw new BadRequest("Empty path for star_column_aggregate orderby element");
                    }
                }
            }).join(", ")}`)
        } else if (this.defaultOrderByColumn) {
            this.sqlParts.push(`ORDER BY ${this.defaultOrderByColumn}`)
        }
    }

    private limit(limit?: number | null) {
        if (limit) {
            this.sqlParts.push(`LIMIT ${limit}`)
        } else {
            this.sqlParts.push(`LIMIT ${Number.MAX_SAFE_INTEGER}`)
        }
    }

    private offset(offset?: number | null) {
        if (offset) {
            this.sqlParts.push(`OFFSET ${offset}`)
        }
    }

    build(query: Query): SingleStoreQuery {
        this.select(query)
        this.subqueriesFromOrderBy(query.order_by)
        this.subqueriesFromExpression(query.predicate)
        this.from()
        this.join()
        this.where(query.predicate)
        this.orderBy(query.order_by)
        this.limit(query.limit)
        this.offset(query.offset)

        var sql = this.sqlParts.join('\n')

        if (this.aggregateRowsToObject) {
            sql = `SELECT JSON_BUILD_OBJECT('rows', JSON_AGG(row)) AS data 
FROM (
${sql}
)`
        }

        return {
            sql: sql,
            parameters: this.parameters
        }
    }
}