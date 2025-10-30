import { describe, test, expectTypeOf } from "vitest";
import type { Utility, Common, Postgres } from "../dist";

describe("utility types", () => {
  test("join", () => {
    type Joined = Utility.Join<["a", "b", "c"], "-">;
    expectTypeOf<Joined>().toEqualTypeOf<"a-b-c">();
  });

  test("split", () => {
    type SplitResult = Utility.Split<"a-b-c", "-">;
    expectTypeOf<SplitResult>().toEqualTypeOf<["a", "b", "c"]>();
  });

  test("map", () => {
    type Mapped = Utility.WrapEachElement<["1", "2", "3"], "<", ">">;
    expectTypeOf<Mapped>().toEqualTypeOf<["<1>", "<2>", "<3>"]>();
  });
});

describe("common types", () => {
  test("label", () => {
    type Labelled = Common.Label.Make<"Age", 30>;
    expectTypeOf<Labelled>().toEqualTypeOf<"Age: 30">();

    type ParsedLabel = Common.Label.Parse<"Age: 30">;
    expectTypeOf<ParsedLabel>().toEqualTypeOf<{ label: "Age"; value: "30" }>();
  });

  test("internal identifier", () => {
    type Identifier = Common.InternalIdentifier.Make<"UserID">;
    expectTypeOf<Identifier>().toEqualTypeOf<"_UserID$">();

    type ParsedIdentifier = Common.InternalIdentifier.Parse<"_UserID$">;
    expectTypeOf<ParsedIdentifier>().toEqualTypeOf<"UserID">();
  });

  test("parameterize", () => {
    type Parameterized = Common.Parameterize.Make<"func", [1, "test", 3]>;
    expectTypeOf<Parameterized>().toEqualTypeOf<"func(1, test, 3)">();

    type ParsedParams = Common.Parameterize.Parse<"func(1, test, 3)">;
    expectTypeOf<ParsedParams>().toEqualTypeOf<{
      prefix: "func";
      args: ["1", "test", "3"];
    }>();
  });
});

describe("postgres types", () => {
  describe("numerics", () => {
    test("smallint", () => {
      type SmallIntType = Postgres.Numeric.SmallInt;
      expectTypeOf<SmallIntType>().toEqualTypeOf<{ smallint: number }>();

      type SmallIntSQL = Postgres.Numeric.SmallInt.SQL<SmallIntType>;
      expectTypeOf<SmallIntSQL>().toEqualTypeOf<"smallint">();

      type IntegerType = Postgres.Numeric.Integer;
      expectTypeOf<IntegerType>().toEqualTypeOf<{ integer: number }>();

      type IntegerSQL = Postgres.Numeric.Integer.SQL<IntegerType>;
      expectTypeOf<IntegerSQL>().toEqualTypeOf<"integer">();
    });
  });

  describe("characters", () => {
    test("varchar", () => {
      type VarcharType = Postgres.Character.Varchar<50>;
      expectTypeOf<VarcharType>().toEqualTypeOf<{ ["varchar(50)"]: string }>();

      type VarcharSQL = Postgres.Character.Varchar.SQL<VarcharType>;
      expectTypeOf<VarcharSQL>().toEqualTypeOf<"varchar(50)">();
    });

    test("text", () => {
      type TextType = Postgres.Character.Text;
      expectTypeOf<TextType>().toEqualTypeOf<{ text: string }>();

      type TextSQL = Postgres.Character.Text.SQL<TextType>;
      expectTypeOf<TextSQL>().toEqualTypeOf<"text">();
    });
  });

  describe("enumerations", () => {
    test("enum", () => {
      type EnumType = Postgres.Enumerated.Enum<
        "color",
        ["red", "green", "blue"]
      >;
      expectTypeOf<EnumType>().toEqualTypeOf<{
        ["color: enum(red, green, blue)"]: "red" | "green" | "blue";
      }>();
      type EnumSQL = Postgres.Enumerated.Enum.SQL<EnumType>;
      expectTypeOf<EnumSQL["column"]>().toEqualTypeOf<"color">();

      expectTypeOf<
        EnumSQL["definition"]
      >().toEqualTypeOf<`CREATE TYPE color AS ENUM('red', 'green', 'blue');`>();
    });
  });
});
