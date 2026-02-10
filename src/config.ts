/**
 * Configuration for the Sevron Toolkit.
 */

import { ConfigurationError } from "./exceptions.js";

export type ValidationMode = "standard" | "strict";

const VALID_MODES: readonly ValidationMode[] = ["standard", "strict"];

/**
 * Configuration class for the Sevron Toolkit.
 */
export class ToolkitConfig {
  private _mode: ValidationMode;

  /**
   * Initialize the toolkit configuration.
   * @param mode - Validation mode - "standard" or "strict".
   * @throws ConfigurationError if mode is not valid.
   */
  constructor(mode: ValidationMode = "standard") {
    if (!VALID_MODES.includes(mode)) {
      throw new ConfigurationError(
        `Invalid mode '${mode}'. Must be one of: ${VALID_MODES.join(", ")}`
      );
    }
    this._mode = mode;
  }

  /**
   * Get the current validation mode.
   */
  get mode(): ValidationMode {
    return this._mode;
  }

  /**
   * Set the validation mode.
   * @param value - The new mode value.
   * @throws ConfigurationError if mode is not valid.
   */
  set mode(value: ValidationMode) {
    if (!VALID_MODES.includes(value)) {
      throw new ConfigurationError(
        `Invalid mode '${value}'. Must be one of: ${VALID_MODES.join(", ")}`
      );
    }
    this._mode = value;
  }

  /**
   * Check if the toolkit is in strict mode.
   */
  isStrict(): boolean {
    return this._mode === "strict";
  }
}
