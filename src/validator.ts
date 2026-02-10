/**
 * Validation for the Sevron Toolkit.
 */

import { ToolkitConfig } from "./config.js";
import { SDSRecord } from "./record.js";

/**
 * Represents a validation error.
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Represents a validation warning.
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * Result of validating an SDSRecord.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validates SDSRecord instances according to GHS requirements.
 */
export class RecordValidator {
  private readonly _config: ToolkitConfig;

  /**
   * Initialize the validator.
   * @param config - Optional toolkit configuration. Defaults to standard mode.
   */
  constructor(config?: ToolkitConfig) {
    this._config = config ?? new ToolkitConfig();
  }

  /**
   * Get the current configuration.
   */
  get config(): ToolkitConfig {
    return this._config;
  }

  /**
   * Validate an SDSRecord.
   * @param record - The SDSRecord to validate.
   * @returns A ValidationResult with any errors and warnings.
   */
  validate(record: SDSRecord): ValidationResult {
    const errors: ValidationError[] = [];
    let warnings: ValidationWarning[] = [];

    // Validate title length
    if (record.title.length > 200) {
      errors.push({
        field: "title",
        message: "Title exceeds maximum length of 200 characters",
        code: "TITLE_TOO_LONG",
      });
    }

    // Validate product name length
    if (record.productName.length > 200) {
      errors.push({
        field: "productName",
        message: "Product name exceeds maximum length of 200 characters",
        code: "PRODUCT_NAME_TOO_LONG",
      });
    }

    // Warn about missing manufacturer and supplier
    if (record.manufacturer === null && record.supplier === null) {
      warnings.push({
        field: "manufacturer/supplier",
        message: "Neither manufacturer nor supplier information provided",
        code: "NO_COMPANY_INFO",
      });
    }

    // Warn about missing revision date
    if (record.revisionDate === null) {
      warnings.push({
        field: "revisionDate",
        message: "No revision date provided",
        code: "NO_REVISION_DATE",
      });
    }

    // Warn about missing version
    if (record.version === null) {
      warnings.push({
        field: "version",
        message: "No version information provided",
        code: "NO_VERSION",
      });
    }

    // Check for potentially incomplete hazard information
    const hCodes = record.hazards.codes;
    if (hCodes.some((code) => code.startsWith("H3"))) {
      // Health hazards - should have appropriate P-codes
      const pCodes = record.precautions.codes;
      const hasResponseCode = pCodes.some(
        (code) => code.startsWith("P3") || (code.includes("+") && code.includes("P3"))
      );
      if (!hasResponseCode) {
        warnings.push({
          field: "precautions",
          message:
            "Health hazard codes present but no response P-codes found",
          code: "MISSING_RESPONSE_CODES",
        });
      }
    }

    // In strict mode, treat warnings as errors
    if (this._config.isStrict()) {
      for (const warning of warnings) {
        errors.push({
          field: warning.field,
          message: warning.message,
          code: warning.code,
        });
      }
      warnings = [];
    }

    // Determine validity
    const valid = errors.length === 0;

    // Mark the record as validated if valid
    if (valid) {
      record._markValidated();
    }

    return {
      valid,
      errors,
      warnings,
    };
  }
}
