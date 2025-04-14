import { Conflict, Forbidden, MutationOperation, MutationOperationResults, MutationRequest, MutationResponse, NestedField } from "@hasura/ndc-sdk-typescript";
import { Configuration, State } from "..";
import { ResultSetHeader } from "mysql2";

function buildInsertSql(
    table: string,
    data: any[]): [string, any[]] {
    if (data.length === 0) {
        return ["", []];
    }

    const columns = Object.keys(data[0]).map(col => `"${col}"`).join(", ");
    const placeholders = "(" + Object.keys(data[0]).map(() => "?").join(", ") + ")";
    const valuesTuple = Array(data.length).fill(placeholders).join(", ");
    const sql = `INSERT INTO "${table}" (${columns}) VALUES ${valuesTuple}`;
    const values: any[] = data.reduce((acc, item) => acc.concat(Object.values(item)), []);

    return [sql, values];
}

export async function do_mutation(configuration: Configuration, state: State, mutation: MutationRequest): Promise<MutationResponse> {
    let procedures: MutationOperation[] = [];
    let operation_results: MutationOperationResults[] = [];
    for (let op of mutation.operations) {
        if (op.type !== "procedure") {
            throw new Forbidden("Not implemented yet.", {});
        } else {
            procedures.push(op);
        }
    }

    for (let procedure of procedures) {
        if (procedure.type !== "procedure") {
            throw new Forbidden("Not implemented yet.", {});
        }

        if (procedure.name.startsWith("insert_") && procedure.name.endsWith("_one")) {
            const table: string = procedure.name.slice("insert_".length, -"_one".length);
            const data = [procedure.arguments.object];
            const [sql, values] = buildInsertSql(table, data);

            if (sql) {
                try {
                    const [res, _] = await state.connPool.execute<ResultSetHeader>(sql, values)
                    operation_results.push({
                        type: "procedure",
                        result: res.affectedRows
                    });
                } catch (error) {
                    console.error("Error executing insert operation:", error);
                    throw new Conflict("Failed to execute insert operation.", { error: `${error}` });
                }
            } else {
                console.log("No SQL statement generated for insert operation.");
                throw new Forbidden("No data provided for insert operation.", {});
            }
        } else {
            console.log("NOT COVERED");
            throw new Forbidden("Not implemented yet.", {});
        }
    }

    return {
        operation_results: operation_results
    };
}