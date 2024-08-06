export class AliasGenerator {
    private aliasCounter: number = 0

    newAlias() {
        return `table_${++this.aliasCounter}`;
    }
}
