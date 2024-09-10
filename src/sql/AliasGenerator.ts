abstract class AliasGenerator {
    private aliasCounter: number = 0
    protected abstract prefix: string

    newAlias() {
        return `${this.prefix}_${++this.aliasCounter}`;
    }
}

export class RowsetAliasGenerator extends AliasGenerator {
    prefix = "rowset"
}

export class ColumnAliasGenerator extends AliasGenerator {
    prefix = "column"
}
