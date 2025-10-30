export namespace Utility {
  export type Stringable = string | number;

  export type Join<
    T extends Stringable[],
    Separator extends Stringable
  > = T extends [infer Head, ...infer Tail]
    ? Tail extends []
      ? Head
      : Head extends Stringable
      ? Tail extends Stringable[]
        ? `${Head}${Separator}${Join<Tail, Separator>}`
        : ""
      : ""
    : "";

  export type Split<
    Query extends string,
    Delimeter extends string
  > = string extends Query
    ? string[]
    : Query extends ""
    ? []
    : Query extends `${infer FirstMatch}${Delimeter}${infer Rest}`
    ? [FirstMatch, ...Split<Rest, Delimeter>]
    : [Query];

  export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

  export type ExpandRecursively<T> = T extends object
    ? T extends infer O
      ? { [K in keyof O]: ExpandRecursively<O[K]> }
      : never
    : T;

  export type WrapEachElement<
    T extends Stringable[],
    Before extends Stringable,
    After extends Stringable = Before
  > = T extends [infer Head, ...infer Tail]
    ? Head extends Stringable
      ? Tail extends []
        ? [`${Before}${Head}${After}`]
        : Tail extends Stringable[]
        ? [`${Before}${Head}${After}`, ...WrapEachElement<Tail, Before, After>]
        : never
      : never
    : [];
}

export namespace Common {
  export namespace Label {
    export type Make<
      Label extends Utility.Stringable,
      Value extends Utility.Stringable
    > = `${Label}: ${Value}`;
    export type Parse<T extends string> = T extends Make<
      infer Label,
      infer Value
    >
      ? { label: Label; value: Value }
      : never;
  }

  export namespace InternalIdentifier {
    export type Make<T extends string> = `_${T}\$`;
    export type Parse<T extends string> = T extends Make<infer Content>
      ? Content
      : T;
  }

  export namespace Parameterize {
    export type ArgsDelimeter = ", ";
    export type Make<
      Prefix extends string,
      Args extends (string | number)[]
    > = `${Prefix}(${Utility.Join<Args, ArgsDelimeter>})`;
    export type Parse<T extends string> =
      T extends `${infer Prefix}(${infer Args})`
        ? { prefix: Prefix; args: Utility.Split<Args, ArgsDelimeter> }
        : never;
  }

  export namespace Verbose {
    export type ColumnType<
      TypeString extends string,
      TypeDefinition extends string
    > = {
      column: TypeString;
      definition: TypeDefinition;
    };
  }
}

export namespace Postgres {
  export namespace Numeric {
    export namespace SmallInt {
      export type Type = Record<"smallint", number>;
      export type SQL<T extends Type> = keyof T;
    }
    export type SmallInt = SmallInt.Type;

    export namespace Integer {
      export type Type = Record<"integer", number>;
      export type SQL<T extends Type> = keyof T;
    }
    export type Integer = Integer.Type;

    export namespace Decimal {
      export type Type<Precision extends number, Scale extends number> = Record<
        Common.Parameterize.Make<"decimal", [Precision, Scale]>,
        number
      >;
      export type Constraint = Type<number, number>;
      export type SQL<T extends Constraint> = keyof T;
      export type Parameters<T extends Constraint> = T extends Type<
        infer Precision,
        infer Scale
      >
        ? { precision: Precision; scale: Scale }
        : never;
    }
    export type Decimal<
      Precision extends number,
      Scale extends number
    > = Decimal.Type<Precision, Scale>;
  }

  export type Numerics =
    | Numeric.SmallInt
    | Numeric.Integer
    | Numeric.Decimal<any, any>;

  export namespace Character {
    export namespace Varchar {
      export type Type<Length extends number> = Record<
        Common.Parameterize.Make<"varchar", [Length]>,
        string
      >;
      export type Constraint = Type<number>;
      export type SQL<T extends Constraint> = keyof T;
      export type Parameters<T extends Constraint> = T extends Type<
        infer Length
      >
        ? { length: Length }
        : never;
    }
    export type Varchar<Length extends number> = Varchar.Type<Length>;

    export namespace Text {
      export type Type = Record<"text", string>;
      export type SQL<T extends Type> = keyof T;
    }
    export type Text = Text.Type;
  }

  export type Characters = Character.Varchar<any> | Character.Text;

  export namespace Enumerated {
    export namespace Enum {
      export type Type<
        Name extends Utility.Stringable,
        Options extends Utility.Stringable[]
      > = Record<
        Common.Label.Make<Name, Common.Parameterize.Make<"enum", Options>>,
        Options[number]
      >;
      export type Constraint = Type<Utility.Stringable, Utility.Stringable[]>;
      export type SQL<T extends Constraint> = keyof T extends Common.Label.Make<
        infer Name,
        infer TypeString
      >
        ? Name extends string
          ? TypeString extends string
            ? Common.Verbose.ColumnType<
                Name,
                `CREATE TYPE ${Name} AS ENUM${Common.Parameterize.Make<
                  "",
                  Utility.WrapEachElement<
                    Common.Parameterize.Parse<TypeString>["args"],
                    "'"
                  >
                >};`
              >
            : never
          : never
        : never;
    }
    export type Enum<
      Name extends Utility.Stringable,
      Options extends Utility.Stringable[]
    > = Enum.Type<Name, Options>;
  }

  export type Enumerations = Enumerated.Enum<any, any[]>;

  export type ColumnTypeConstraint =
    | string
    | number
    | boolean
    | Numerics
    | Characters
    | Enumerations;

  export namespace ColumnModifier {
    export namespace Collate {
      export type Type<Collation extends string> = { collate: Collation };
      export type SQL<T extends Type<string>> = `COLLATE "${T["collate"]}"`;
    }
    export type Collate<Collation extends string> = Collate.Type<Collation>;

    export namespace GeneratedAsIdentity {
      export type Condition = "always" | "by default";
      export type Type<TCondition extends Condition> = {
        "generated as identity": TCondition;
      };
      export type Shorthand<T extends Condition = Condition> = `identity ${T}`;

      export type SQL<T extends Type<Condition> | Shorthand<Condition>> =
        T extends string
          ? T extends Shorthand<infer C>
            ? SQL<Type<C>>
            : never
          : T[keyof T] extends string
          ? `GENERATED ${Uppercase<T[keyof T]>} AS IDENTITY`
          : never;
    }
    export type GeneratedAsIdentity<T extends GeneratedAsIdentity.Condition> =
      GeneratedAsIdentity.Type<T>;

    type Z = GeneratedAsIdentity.SQL<"identity always">;

    export namespace Default {
      export type Type<Constrant, T extends Constrant> = { default: T };
    }
    export type Default<Constrant, T extends Constrant> = Default.Type<
      Constrant,
      T
    >;

    export namespace Nullable {
      export type Type<T extends boolean> = { nullable: T };
      export type SQL<T extends Type<boolean>> = T["nullable"] extends true
        ? "NULL"
        : "NOT NULL";
    }
    export type Nullable<T extends boolean> = Nullable.Type<T>;

    export namespace Uniqueness {}

    export type Ordering = [
      Collate<any>,
      GeneratedAsIdentity<any>,
      Default<any, any>,
      Nullable<any>
    ];
  }

  export type ColumnModifiers<T extends ColumnTypeConstraint> =
    ColumnModifier.GeneratedAsIdentity.Shorthand;

  export type Column<
    T extends ColumnTypeConstraint,
    Modifiers extends ColumnModifiers<T>[] = []
  > = T & { modifiers: Modifiers };

  export type DefaultIDType = Column<Numeric.Integer, ["identity always"]>;

  export type Table<
    Name extends string,
    T,
    DefaultID extends { id: any } = { id: DefaultIDType }
  > = {
    tablename: Name;
    model: "id" extends keyof T
      ? Utility.ExpandRecursively<T>
      : Utility.ExpandRecursively<DefaultID & T>;
    row: {};
  };
}
