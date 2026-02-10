/**
 * Custom exceptions for the Sevron Toolkit.
 */

/**
 * Base exception for all Sevron Toolkit errors.
 */
export class SevronToolkitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SevronToolkitError";
    Object.setPrototypeOf(this, SevronToolkitError.prototype);
  }
}

/**
 * Raised when SDSRecord construction fails due to invalid parameters.
 */
export class RecordConstructionError extends SevronToolkitError {
  constructor(message: string) {
    super(message);
    this.name = "RecordConstructionError";
    Object.setPrototypeOf(this, RecordConstructionError.prototype);
  }
}

/**
 * Raised when a CAS number is invalid or not found.
 */
export class InvalidCASError extends SevronToolkitError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCASError";
    Object.setPrototypeOf(this, InvalidCASError.prototype);
  }
}

/**
 * Raised when a hazard code (H-code) is invalid or not found.
 */
export class InvalidHazardCodeError extends SevronToolkitError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidHazardCodeError";
    Object.setPrototypeOf(this, InvalidHazardCodeError.prototype);
  }
}

/**
 * Raised when a precautionary code (P-code) is invalid or not found.
 */
export class InvalidPrecautionaryCodeError extends SevronToolkitError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPrecautionaryCodeError";
    Object.setPrototypeOf(this, InvalidPrecautionaryCodeError.prototype);
  }
}

/**
 * Raised when attempting to export a record that hasn't been validated.
 */
export class ValidationRequiredError extends SevronToolkitError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationRequiredError";
    Object.setPrototypeOf(this, ValidationRequiredError.prototype);
  }
}

/**
 * Raised when toolkit configuration is invalid.
 */
export class ConfigurationError extends SevronToolkitError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}
