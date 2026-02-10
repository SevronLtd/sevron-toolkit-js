/**
 * Precautionary code handling for the Sevron Toolkit.
 */

import { createRequire } from "module";
import { InvalidPrecautionaryCodeError } from "./exceptions.js";

const require = createRequire(import.meta.url);

interface PCodeData {
  statement: string;
  type: string;
}

interface PCodesDatabase {
  [code: string]: PCodeData;
}

// Symbol for private constructor enforcement
const PRIVATE_CONSTRUCTOR = Symbol("PRIVATE_CONSTRUCTOR");

/**
 * Represents a group of GHS precautionary codes (P-codes).
 *
 * This class uses a private constructor pattern. Use `PrecautionaryGroup.fromCodes()`
 * to create instances.
 */
export class PrecautionaryGroup {
  private static pCodesData: PCodesDatabase | null = null;

  private readonly _codes: string[];
  private readonly _statements: string[];
  private readonly _types: string[];

  /**
   * Private constructor - use PrecautionaryGroup.fromCodes() instead.
   */
  constructor(
    codes: string[],
    statements: string[],
    types: string[],
    privateKey: symbol
  ) {
    if (privateKey !== PRIVATE_CONSTRUCTOR) {
      throw new InvalidPrecautionaryCodeError(
        "PrecautionaryGroup cannot be instantiated directly. " +
          "Use PrecautionaryGroup.fromCodes() instead."
      );
    }
    this._codes = codes;
    this._statements = statements;
    this._types = types;
  }

  private static loadPCodes(): PCodesDatabase {
    if (PrecautionaryGroup.pCodesData === null) {
      PrecautionaryGroup.pCodesData = require("./data/p_codes.json");
    }
    return PrecautionaryGroup.pCodesData!;
  }

  /**
   * Create a PrecautionaryGroup from a list of P-codes.
   * @param codes - List of P-codes (e.g., ["P280", "P305+P351+P338"]).
   * @returns A PrecautionaryGroup instance with derived statements and types.
   * @throws InvalidPrecautionaryCodeError if any code is invalid or not found.
   */
  static fromCodes(codes: string[]): PrecautionaryGroup {
    if (!Array.isArray(codes)) {
      throw new InvalidPrecautionaryCodeError(
        `codes must be an array, got ${typeof codes}`
      );
    }

    if (codes.length === 0) {
      throw new InvalidPrecautionaryCodeError("codes array cannot be empty");
    }

    const pCodesData = PrecautionaryGroup.loadPCodes();

    // Deduplicate while preserving order
    const seen = new Set<string>();
    const uniqueCodes: string[] = [];

    for (const rawCode of codes) {
      if (typeof rawCode !== "string") {
        throw new InvalidPrecautionaryCodeError(
          `Each code must be a string, got ${typeof rawCode}`
        );
      }

      const code = rawCode.trim().toUpperCase();

      if (!seen.has(code)) {
        seen.add(code);
        uniqueCodes.push(code);
      }
    }

    const statements: string[] = [];
    const types: string[] = [];

    for (const code of uniqueCodes) {
      if (!(code in pCodesData)) {
        throw new InvalidPrecautionaryCodeError(
          `Unknown precautionary code: '${code}'. ` +
            "Please verify the code is a valid GHS P-code."
        );
      }

      const data = pCodesData[code];
      statements.push(data.statement);
      types.push(data.type);
    }

    return new PrecautionaryGroup(
      uniqueCodes,
      statements,
      types,
      PRIVATE_CONSTRUCTOR
    );
  }

  /**
   * Get the list of P-codes.
   */
  get codes(): string[] {
    return [...this._codes];
  }

  /**
   * Get the list of precautionary statements.
   */
  get statements(): string[] {
    return [...this._statements];
  }

  /**
   * Get the list of precautionary types.
   */
  get types(): string[] {
    return [...this._types];
  }

  /**
   * Convert the precautionary group to a dictionary representation.
   */
  toDict(): {
    codes: string[];
    statements: string[];
    types: string[];
  } {
    return {
      codes: this._codes,
      statements: this._statements,
      types: this._types,
    };
  }

  toString(): string {
    return `PrecautionaryGroup(codes=${JSON.stringify(this._codes)})`;
  }
}
