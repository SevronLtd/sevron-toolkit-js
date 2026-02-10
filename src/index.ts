/**
 * Sevron Toolkit - A library for validating and structuring SDS extracted data.
 */

// Config
export { ToolkitConfig, ValidationMode } from "./config.js";

// Exceptions
export {
  SevronToolkitError,
  RecordConstructionError,
  InvalidCASError,
  InvalidHazardCodeError,
  InvalidPrecautionaryCodeError,
  ValidationRequiredError,
  ConfigurationError,
} from "./exceptions.js";

// Core classes
export { Substance } from "./substance.js";
export { HazardGroup } from "./hazards.js";
export { PrecautionaryGroup } from "./precautions.js";
export {
  SDSRecord,
  CompanyInfo,
  SDSRecordCreateParams,
  companyInfoToDict,
} from "./record.js";

// Validation
export {
  RecordValidator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "./validator.js";

// Export
export {
  RecordExporter,
  ExportFormat,
  BatchExportFormat,
} from "./exporter.js";

export const VERSION = "1.0.0";
