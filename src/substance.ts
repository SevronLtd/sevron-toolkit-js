/**
 * Substance handling for the Sevron Toolkit.
 */

import { createRequire } from "module";
import { InvalidCASError } from "./exceptions.js";

const _require = createRequire(import.meta.url);

interface SubstanceData {
  name: string;
  ec_number?: string;
}

interface SubstancesDatabase {
  [casNumber: string]: SubstanceData;
}

// Symbol for private constructor enforcement
const PRIVATE_CONSTRUCTOR = Symbol("PRIVATE_CONSTRUCTOR");

/**
 * Represents a chemical substance identified by CAS number.
 *
 * This class uses a private constructor pattern. Use `Substance.lookup()`
 * to create instances.
 */
export class Substance {
  private static substancesData: SubstancesDatabase | null = null;

  private readonly _casNumber: string;
  private readonly _name: string;
  private readonly _ecNumber: string | null;

  /**
   * Private constructor - use Substance.lookup() instead.
   */
  constructor(
    casNumber: string,
    name: string,
    ecNumber: string | null,
    privateKey: symbol
  ) {
    if (privateKey !== PRIVATE_CONSTRUCTOR) {
      throw new InvalidCASError(
        "Substance cannot be instantiated directly. Use Substance.lookup() instead."
      );
    }
    this._casNumber = casNumber;
    this._name = name;
    this._ecNumber = ecNumber;
  }

  private static loadSubstances(): SubstancesDatabase {
    if (Substance.substancesData === null) {
      Substance.substancesData = _require("./data/substances.json");
    }
    return Substance.substancesData!;
  }

  private static validateCasFormat(casNumber: string): boolean {
    const pattern = /^\d{1,7}-\d{2}-\d$/;
    return pattern.test(casNumber);
  }

  private static validateCasChecksum(casNumber: string): boolean {
    // Remove hyphens
    const digitsOnly = casNumber.replace(/-/g, "");

    // Get check digit (last digit)
    const checkDigit = parseInt(digitsOnly[digitsOnly.length - 1], 10);

    // Get the digits to validate (all but last)
    const validateDigits = digitsOnly.slice(0, -1);

    // Calculate checksum
    let total = 0;
    let position = 1;
    for (let i = validateDigits.length - 1; i >= 0; i--) {
      total += parseInt(validateDigits[i], 10) * position;
      position++;
    }

    return total % 10 === checkDigit;
  }

  /**
   * Look up a substance by CAS number.
   * @param casNumber - The CAS registry number to look up.
   * @returns A Substance instance with the looked-up data.
   * @throws InvalidCASError if the CAS number is invalid or not found.
   */
  static lookup(casNumber: string): Substance {
    // Normalize input
    casNumber = casNumber.trim();

    // Validate format
    if (!Substance.validateCasFormat(casNumber)) {
      throw new InvalidCASError(
        `Invalid CAS number format: '${casNumber}'. ` +
          "Expected format: XXXXXXX-XX-X (e.g., 7681-52-9)"
      );
    }

    // Validate checksum
    if (!Substance.validateCasChecksum(casNumber)) {
      throw new InvalidCASError(
        `Invalid CAS number check digit: '${casNumber}'. ` +
          "The check digit does not match the calculated value."
      );
    }

    // Look up in database
    const substances = Substance.loadSubstances();
    if (!(casNumber in substances)) {
      throw new InvalidCASError(
        `CAS number not found in database: '${casNumber}'. ` +
          "The substance may not be in our registry."
      );
    }

    const data = substances[casNumber];
    return new Substance(
      casNumber,
      data.name,
      data.ec_number ?? null,
      PRIVATE_CONSTRUCTOR
    );
  }

  /**
   * Get the CAS registry number.
   */
  get casNumber(): string {
    return this._casNumber;
  }

  /**
   * Get the substance name.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the EC (EINECS) number, if available.
   */
  get ecNumber(): string | null {
    return this._ecNumber;
  }

  /**
   * Convert the substance to a dictionary representation.
   */
  toDict(): Record<string, string> {
    const result: Record<string, string> = {
      cas_number: this._casNumber,
      name: this._name,
    };
    if (this._ecNumber) {
      result.ec_number = this._ecNumber;
    }
    return result;
  }

  toString(): string {
    return `Substance(casNumber='${this._casNumber}', name='${this._name}')`;
  }
}
