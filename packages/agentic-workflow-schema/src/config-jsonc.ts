/**
 * JSON5 — the config dialect (issue #427 S3, widened by #740 S1).
 *
 * Bun parses JSONC natively; Node does not, and this package is dependency-free
 * by contract, so the parser lives here and both consumers read the same bytes.
 * A real tokenizer (not a comment-stripper) is what makes an error point at the
 * line and column the operator wrote instead of "invalid JSON somewhere".
 *
 * The dialect is JSON5 over the JSONC subset #427 shipped: ES5 identifier keys,
 * single-quoted strings with the ES5 escapes (`\x`, `\u`, the line continuation),
 * hex and leading/trailing-dot numbers, a leading `+`, and `Infinity`/`NaN`.
 * Writes stay standard JSON (`stringifyJsoncValue`), so a non-finite value has no
 * faithful round trip — the validator refuses it instead of letting the writer
 * turn it into `null` (#740 S5). The strict end-of-input check is what keeps a
 * concatenated file from failing open (#521 D1) and stays the acceptance
 * boundary.
 */

export interface JsoncError {
  message: string;
  offset: number;
  line: number;
  column: number;
}

export type JsoncResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: JsoncError };

class ParseFailure extends Error {
  readonly offset: number;
  readonly line: number;
  readonly column: number;

  constructor(message: string, offset: number, line: number, column: number) {
    super(message);
    this.offset = offset;
    this.line = line;
    this.column = column;
  }
}

const WHITESPACE = /\s/u;
const IDENTIFIER_START = /[$_\p{ID_Start}]/u;
const IDENTIFIER_PART = /[$_\u200C\u200D\p{ID_Continue}]/u;
const LINE_TERMINATOR = /[\n\r\u2028\u2029]/u;
const HEX_DIGIT = /[0-9a-fA-F]/u;
const DECIMAL_DIGIT = /[0-9]/u;

class Reader {
  private index = 0;
  private line = 1;
  private column = 1;
  private previous = "";

  constructor(private readonly text: string) {}

  get done(): boolean {
    return this.index >= this.text.length;
  }

  peek(offset = 0): string {
    return this.text[this.index + offset] ?? "";
  }

  fail(message: string): never {
    throw new ParseFailure(message, this.index, this.line, this.column);
  }

  advance(): string {
    const char = this.text[this.index] ?? "";
    this.index += 1;
    if (LINE_TERMINATOR.test(char)) {
      // CRLF is one line break, and a lone CR or U+2028/U+2029 is one too.
      if (char !== "\n" || this.previous !== "\r") this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }
    this.previous = char;
    return char;
  }

  /** Consume `count` characters known to be present. */
  skip(count: number): void {
    for (let offset = 0; offset < count; offset += 1) this.advance();
  }

  skipSpace(): void {
    for (;;) {
      const char = this.peek();
      if (WHITESPACE.test(char)) {
        this.advance();
        continue;
      }
      if (char === "/" && this.peek(1) === "/") {
        while (!this.done && !LINE_TERMINATOR.test(this.peek())) this.advance();
        continue;
      }
      if (char === "/" && this.peek(1) === "*") {
        this.advance();
        this.advance();
        while (!this.done && !(this.peek() === "*" && this.peek(1) === "/")) this.advance();
        if (this.done) this.fail("unterminated block comment");
        this.advance();
        this.advance();
        continue;
      }
      return;
    }
  }

  parseValue(): unknown {
    this.skipSpace();
    const char = this.peek();
    if (char === "{") return this.parseObject();
    if (char === "[") return this.parseArray();
    if (char === '"' || char === "'") return this.parseString();
    if (char === "+" || char === "-" || char === "." || DECIMAL_DIGIT.test(char)) return this.parseNumber();
    if (IDENTIFIER_START.test(char)) return this.parseKeyword();
    if (this.done) this.fail("unexpected end of input; expected a value");
    return this.fail(`unexpected character ${JSON.stringify(char)}; expected a value`);
  }

  /** Read an ES5 IdentifierName, decoding a `\uXXXX` escape into its character. */
  readIdentifier(): string {
    let out = "";
    if (this.peek() === "\\") out += this.readUnicodeEscape();
    else if (IDENTIFIER_START.test(this.peek())) out += this.advance();
    else this.fail("expected an identifier");

    for (;;) {
      if (this.peek() === "\\") {
        const escaped = this.readUnicodeEscape();
        if (!IDENTIFIER_PART.test(escaped)) this.fail(`invalid identifier escape ${JSON.stringify(escaped)}`);
        out += escaped;
        continue;
      }
      if (!IDENTIFIER_PART.test(this.peek())) return out;
      out += this.advance();
    }
  }

  /** `\uXXXX` — consumed whole, decoded to one character. */
  readUnicodeEscape(): string {
    this.advance();
    if (this.peek() !== "u") this.fail("invalid identifier escape; expected \\u");
    this.advance();
    return this.readHex(4, "unicode");
  }

  readHex(count: number, label: string): string {
    let digits = "";
    for (let offset = 0; offset < count; offset += 1) {
      if (!HEX_DIGIT.test(this.peek())) this.fail(`invalid ${label} escape; expected a hexadecimal digit`);
      digits += this.advance();
    }
    return String.fromCharCode(Number.parseInt(digits, 16));
  }

  parseKeyword(): unknown {
    const word = this.readIdentifier();
    if (word === "true") return true;
    if (word === "false") return false;
    if (word === "null") return null;
    if (word === "Infinity") return Number.POSITIVE_INFINITY;
    if (word === "NaN") return Number.NaN;
    return this.fail(`unexpected identifier ${JSON.stringify(word)}; expected a value`);
  }

  parseObject(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    this.advance();
    this.skipSpace();
    if (this.peek() === "}") {
      this.advance();
      return result;
    }
    for (;;) {
      this.skipSpace();
      const key = this.parsePropertyName();
      this.skipSpace();
      if (this.peek() !== ":") this.fail("expected ':' after the property name");
      this.advance();
      result[key] = this.parseValue();
      this.skipSpace();
      const next = this.peek();
      if (next === ",") {
        this.advance();
        this.skipSpace();
        if (this.peek() === "}") {
          this.advance();
          return result;
        }
        continue;
      }
      if (next === "}") {
        this.advance();
        return result;
      }
      this.fail("expected ',' or '}' after a property value");
    }
  }

  /** A quoted string or an unquoted ES5 identifier (a reserved word is legal). */
  parsePropertyName(): string {
    const char = this.peek();
    if (char === '"' || char === "'") return this.parseString();
    if (char === "\\" || IDENTIFIER_START.test(char)) return this.readIdentifier();
    return this.fail("expected a property name");
  }

  parseArray(): unknown[] {
    const result: unknown[] = [];
    this.advance();
    this.skipSpace();
    if (this.peek() === "]") {
      this.advance();
      return result;
    }
    for (;;) {
      result.push(this.parseValue());
      this.skipSpace();
      const next = this.peek();
      if (next === ",") {
        this.advance();
        this.skipSpace();
        if (this.peek() === "]") {
          this.advance();
          return result;
        }
        continue;
      }
      if (next === "]") {
        this.advance();
        return result;
      }
      this.fail("expected ',' or ']' after an array element");
    }
  }

  parseString(): string {
    const quote = this.peek();
    this.advance();
    let out = "";
    for (;;) {
      const char = this.peek();
      if (char === "") this.fail("unterminated string");
      if (char === quote) {
        this.advance();
        return out;
      }
      if (LINE_TERMINATOR.test(char)) this.fail("unescaped line break in a string");
      if (char === "\\") {
        this.advance();
        out += this.parseEscape();
        continue;
      }
      out += this.advance();
    }
  }

  /** The character(s) one escape stands for; the backslash is already consumed. */
  parseEscape(): string {
    const char = this.peek();
    this.advance();
    switch (char) {
      case "'":
        return "'";
      case '"':
        return '"';
      case "\\":
        return "\\";
      case "b":
        return "\b";
      case "f":
        return "\f";
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "v":
        return "\v";
      case "0":
        if (DECIMAL_DIGIT.test(this.peek())) this.fail("octal escapes are not part of the dialect");
        return "\0";
      case "x":
        return this.readHex(2, "hexadecimal");
      case "u":
        return this.readHex(4, "unicode");
      case "\r":
        if (this.peek() === "\n") this.advance();
        return "";
      case "\n":
      case "\u2028":
      case "\u2029":
        return "";
      case "":
        return this.fail("unterminated escape sequence");
      // `\/` and any other escaped character stand for themselves (JSON5's
      // NonEscapeCharacter). Unlike JSON, that is not an error.
      default:
        return char;
    }
  }

  parseNumber(): number {
    let sign = 1;
    if (this.peek() === "+") this.advance();
    else if (this.peek() === "-") {
      this.advance();
      sign = -1;
    }

    if (this.text.startsWith("Infinity", this.index)) {
      this.skip(8);
      if (IDENTIFIER_PART.test(this.peek())) this.fail("invalid number");
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    }
    if (this.text.startsWith("NaN", this.index)) {
      this.skip(3);
      if (IDENTIFIER_PART.test(this.peek())) this.fail("invalid number");
      return sign === 1 ? Number.NaN : -Number.NaN;
    }

    if (this.peek() === "0" && (this.peek(1) === "x" || this.peek(1) === "X")) {
      this.skip(2);
      const start = this.index;
      while (HEX_DIGIT.test(this.peek())) this.advance();
      if (this.index === start) this.fail("invalid number; expected a hexadecimal digit");
      if (IDENTIFIER_PART.test(this.peek())) this.fail("invalid number");
      return sign * Number.parseInt(this.text.slice(start, this.index), 16);
    }

    const start = this.index;
    let digits = 0;
    while (DECIMAL_DIGIT.test(this.peek())) {
      digits += 1;
      this.advance();
    }
    if (this.peek() === ".") {
      this.advance();
      while (DECIMAL_DIGIT.test(this.peek())) {
        digits += 1;
        this.advance();
      }
    }
    if (digits === 0) this.fail("invalid number; expected a digit");
    const integer = this.text.slice(start, this.index).split(".")[0];
    if (integer.length > 1 && integer.startsWith("0")) this.fail("invalid number; a leading zero is not allowed");
    if (this.peek() === "e" || this.peek() === "E") {
      this.advance();
      if (this.peek() === "+" || this.peek() === "-") this.advance();
      const exponentStart = this.index;
      while (DECIMAL_DIGIT.test(this.peek())) this.advance();
      if (this.index === exponentStart) this.fail("invalid number; expected an exponent digit");
    }
    if (IDENTIFIER_PART.test(this.peek())) this.fail("invalid number");
    return sign * Number(this.text.slice(start, this.index));
  }
}

export function parseJsonc(text: string): JsoncResult {
  const source = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const reader = new Reader(source);
  try {
    reader.skipSpace();
    if (reader.done) return { ok: true, value: {} };
    const value = reader.parseValue();
    reader.skipSpace();
    if (!reader.done) reader.fail("unexpected content after the root value");
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {
        ok: false,
        error: { message: "the config root must be a JSON object", offset: 0, line: 1, column: 1 },
      };
    }
    return { ok: true, value: value as Record<string, unknown> };
  } catch (error) {
    if (error instanceof ParseFailure) {
      return {
        ok: false,
        error: { message: error.message, offset: error.offset, line: error.line, column: error.column },
      };
    }
    return {
      ok: false,
      error: { message: (error as Error).message, offset: 0, line: 1, column: 1 },
    };
  }
}

/** The writer's stable form: pretty JSON, insertion order kept, one final newline. */
export function stringifyJsoncValue(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
