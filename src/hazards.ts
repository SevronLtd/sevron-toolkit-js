/**
 * Hazard code handling for the Sevron Toolkit.
 */

import { createRequire } from "module";
import { InvalidHazardCodeError } from "./exceptions.js";

const require = createRequire(import.meta.url);

interface HCodeData {
  statement: string;
  category: string;
  pictogram: string | null;
}

interface HCodesDatabase {
  [code: string]: HCodeData;
}

// Symbol for private constructor enforcement
const PRIVATE_CONSTRUCTOR = Symbol("PRIVATE_CONSTRUCTOR");

/**
 * Represents a group of GHS hazard codes (H-codes).
 *
 * This class uses a private constructor pattern. Use `HazardGroup.fromCodes()`
 * to create instances.
 */
export class HazardGroup {
  private static hCodesData: HCodesDatabase | null = null;

  private readonly _codes: string[];
  private readonly _statements: string[];
  private readonly _categories: string[];
  private readonly _pictograms: string[];

  /**
   * Private constructor - use HazardGroup.fromCodes() instead.
   */
  constructor(
    codes: string[],
    statements: string[],
    categories: string[],
    pictograms: string[],
    privateKey: symbol
  ) {
    if (privateKey !== PRIVATE_CONSTRUCTOR) {
      throw new InvalidHazardCodeError(
        "HazardGroup cannot be instantiated directly. " +
          "Use HazardGroup.fromCodes() instead."
      );
    }
    this._codes = codes;
    this._statements = statements;
    this._categories = categories;
    this._pictograms = pictograms;
  }

  private static loadHCodes(): HCodesDatabase {
    if (HazardGroup.hCodesData === null) {
      HazardGroup.hCodesData = require("./data/h_codes.json");
    }
    return HazardGroup.hCodesData!;
  }

  /**
   * Create a HazardGroup from a list of H-codes.
   * @param codes - List of H-codes (e.g., ["H314", "H335"]).
   * @returns A HazardGroup instance with derived statements, categories, and pictograms.
   * @throws InvalidHazardCodeError if any code is invalid or not found.
   */
  static fromCodes(codes: string[]): HazardGroup {
    if (!Array.isArray(codes)) {
      throw new InvalidHazardCodeError(
        `codes must be an array, got ${typeof codes}`
      );
    }

    if (codes.length === 0) {
      throw new InvalidHazardCodeError("codes array cannot be empty");
    }

    const hCodesData = HazardGroup.loadHCodes();

    // Deduplicate while preserving order
    const seen = new Set<string>();
    const uniqueCodes: string[] = [];

    for (const rawCode of codes) {
      if (typeof rawCode !== "string") {
        throw new InvalidHazardCodeError(
          `Each code must be a string, got ${typeof rawCode}`
        );
      }

      let code = rawCode.trim().toUpperCase();

      // Handle lowercase variants like H350i
      if (code.endsWith("I")) {
        code = code.slice(0, -1) + "i";
      }

      // Handle variants like H360D, H360F, H361d, H361f
      const suffixes = ["D", "F", "FD", "Fd", "Df", "fd"];
      for (const suffix of suffixes) {
        if (code.endsWith(suffix.toUpperCase())) {
          code = code.slice(0, -suffix.length) + suffix;
          break;
        }
      }

      if (!seen.has(code)) {
        seen.add(code);
        uniqueCodes.push(code);
      }
    }

    const statements: string[] = [];
    const categories: string[] = [];
    const pictogramsSet = new Set<string>();

    for (const code of uniqueCodes) {
      if (!(code in hCodesData)) {
        throw new InvalidHazardCodeError(
          `Unknown hazard code: '${code}'. ` +
            "Please verify the code is a valid GHS H-code."
        );
      }

      const data = hCodesData[code];
      statements.push(data.statement);
      categories.push(data.category);
      if (data.pictogram) {
        pictogramsSet.add(data.pictogram);
      }
    }

    // Sort pictograms alphabetically for deterministic output
    const pictograms = Array.from(pictogramsSet).sort();

    return new HazardGroup(
      uniqueCodes,
      statements,
      categories,
      pictograms,
      PRIVATE_CONSTRUCTOR
    );
  }

  /**
   * Get the list of H-codes.
   */
  get codes(): string[] {
    return [...this._codes];
  }

  /**
   * Get the list of hazard statements.
   */
  get statements(): string[] {
    return [...this._statements];
  }

  /**
   * Get the list of hazard categories.
   */
  get categories(): string[] {
    return [...this._categories];
  }

  /**
   * Get the list of GHS pictogram codes (sorted alphabetically).
   */
  get pictograms(): string[] {
    return [...this._pictograms];
  }

  /**
   * Convert the hazard group to a dictionary representation.
   */
  toDict(): {
    codes: string[];
    statements: string[];
    categories: string[];
    pictograms: string[];
  } {
    return {
      codes: this._codes,
      statements: this._statements,
      categories: this._categories,
      pictograms: this._pictograms,
    };
  }

  toString(): string {
    return `HazardGroup(codes=${JSON.stringify(this._codes)})`;
  }
}
