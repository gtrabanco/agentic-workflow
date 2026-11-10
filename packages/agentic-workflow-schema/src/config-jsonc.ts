/**
 * JSONC — JSON with comments (issue #427 S3).
 *
 * Bun parses JSONC natively; Node does not, and this package is dependency-free
 * by contract, so the parser lives here and both consumers read the same bytes.
 * A real tokenizer (not a comment-stripper) is what makes an error point at the
 * line and column the operator wrote instead of "invalid JSON somewhere".
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

class Reader {
  private index = 0;
  private line = 1;
  private column = 1;

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
    if (char === "\n") {
      this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }
    return char;
  }

  skipSpace(): void {
    for (;;) {
      const char = this.peek();
      if (char === " " || char === "\t" || char === "\n" || char === "\r") {
        this.advance();
        continue;
      }
      if (char === "/" && this.peek(1) === "/") {
        while (!this.done && this.peek() !== "\n") this.advance();
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
    if (char === '"') return this.parseString();
    if (char === "-" || (char >= "0" && char <= "9")) return this.parseNumber();
    if (this.text.startsWith("true", this.index)) {
      for (let index = 0; index < 4; index += 1) this.advance();
      return true;
    }
    if (this.text.startsWith("false", this.index)) {
      for (let index = 0; index < 5; index += 1) this.advance();
      return false;
    }
    if (this.text.startsWith("null", this.index)) {
      for (let index = 0; index < 4; index += 1) this.advance();
      return null;
    }
    if (this.done) this.fail("unexpected end of input; expected a value");
    return this.fail(`unexpected character ${JSON.stringify(char)}; expected a value`);
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
      if (this.peek() !== '"') this.fail("expected a quoted property name");
      const key = this.parseString();
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
    const start = this.index;
    this.advance();
    for (;;) {
      const char = this.peek();
      if (char === "") this.fail("unterminated string");
      if (char === "\\") {
        this.advance();
        if (this.done) this.fail("unterminated escape sequence");
        this.advance();
        continue;
      }
      this.advance();
      if (char === '"') break;
    }
    try {
      return JSON.parse(this.text.slice(start, this.index)) as string;
    } catch {
      return this.fail("invalid string escape");
    }
  }

  parseNumber(): number {
    const start = this.index;
    if (this.peek() === "-") this.advance();
    while (this.peek() >= "0" && this.peek() <= "9") this.advance();
    if (this.peek() === ".") {
      this.advance();
      while (this.peek() >= "0" && this.peek() <= "9") this.advance();
    }
    if (this.peek() === "e" || this.peek() === "E") {
      this.advance();
      if (this.peek() === "+" || this.peek() === "-") this.advance();
      while (this.peek() >= "0" && this.peek() <= "9") this.advance();
    }
    const token = this.text.slice(start, this.index);
    const value = Number(token);
    if (!Number.isFinite(value)) this.fail(`invalid number ${JSON.stringify(token)}`);
    return value;
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
