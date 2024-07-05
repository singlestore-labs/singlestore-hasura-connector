export class AliasGenerator {
    private aliasCounter: number = 0

    newAlies() {
        return `table_${++this.aliasCounter}`;
    }
}