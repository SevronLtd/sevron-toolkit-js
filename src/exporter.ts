/**
 * Export functionality for the Sevron Toolkit.
 */

import { ValidationRequiredError } from "./exceptions.js";
import { SDSRecord } from "./record.js";

export type ExportFormat = "dict" | "json";
export type BatchExportFormat = "dict" | "json" | "csv";

/**
 * Exports SDSRecord instances to various formats.
 */
export class RecordExporter {
  /**
   * Export a single record.
   * @param record - The SDSRecord to export.
   * @param format - Output format - "dict" or "json".
   * @returns The exported record as an object or JSON string.
   * @throws ValidationRequiredError if the record has not been validated.
   * @throws Error if the format is not supported.
   */
  export(
    record: SDSRecord,
    format: ExportFormat = "dict"
  ): Record<string, unknown> | string {
    if (!record.validated) {
      throw new ValidationRequiredError(
        "Record must be validated before export. " +
          "Call validator.validate(record) first."
      );
    }

    if (format !== "dict" && format !== "json") {
      throw new Error(`Unsupported format: ${format}. Use 'dict' or 'json'.`);
    }

    const data = record.toDict();

    if (format === "dict") {
      return data;
    } else {
      return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Export multiple records.
   * @param records - Array of SDSRecord instances to export.
   * @param format - Output format - "dict", "json", or "csv".
   * @returns The exported records as an array of objects, JSON string, or CSV string.
   * @throws ValidationRequiredError if any record has not been validated.
   * @throws Error if the format is not supported or records array is empty.
   */
  exportBatch(
    records: SDSRecord[],
    format: BatchExportFormat = "dict"
  ): Record<string, unknown>[] | string {
    if (records.length === 0) {
      throw new Error("Records array cannot be empty");
    }

    if (format !== "dict" && format !== "json" && format !== "csv") {
      throw new Error(
        `Unsupported format: ${format}. Use 'dict', 'json', or 'csv'.`
      );
    }

    // Check all records are validated
    for (let i = 0; i < records.length; i++) {
      if (!records[i].validated) {
        throw new ValidationRequiredError(
          `Record at index ${i} must be validated before export. ` +
            "Call validator.validate(record) first."
        );
      }
    }

    const data = records.map((record) => record.toDict());

    if (format === "dict") {
      return data;
    } else if (format === "json") {
      return JSON.stringify(data, null, 2);
    } else {
      return this.toCsv(data);
    }
  }

  private toCsv(records: Record<string, unknown>[]): string {
    const headers = [
      "title",
      "product_name",
      "product_code",
      "substances_cas",
      "substances_names",
      "hazard_codes",
      "hazard_statements",
      "hazard_pictograms",
      "precautionary_codes",
      "precautionary_statements",
      "manufacturer_name",
      "supplier_name",
      "revision_date",
      "version",
      "regulation_type",
      "language",
      "r_phrases",
      "s_phrases",
      "reach_registration_numbers",
    ];

    const escapeField = (field: string): string => {
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const lines: string[] = [headers.join(",")];

    for (const record of records) {
      const substances = (record.substances as Array<Record<string, string>>) || [];
      const hazards = (record.hazards as Record<string, string[]>) || {};
      const precautions = (record.precautions as Record<string, string[]>) || {};
      const manufacturer = (record.manufacturer as Record<string, string>) || {};
      const supplier = (record.supplier as Record<string, string>) || {};

      const row = [
        escapeField(String(record.title || "")),
        escapeField(String(record.product_name || "")),
        escapeField(String(record.product_code || "")),
        escapeField(substances.map((s) => s.cas_number || "").join("; ")),
        escapeField(substances.map((s) => s.name || "").join("; ")),
        escapeField((hazards.codes || []).join("; ")),
        escapeField((hazards.statements || []).join("; ")),
        escapeField((hazards.pictograms || []).join("; ")),
        escapeField((precautions.codes || []).join("; ")),
        escapeField((precautions.statements || []).join("; ")),
        escapeField(manufacturer.name || ""),
        escapeField(supplier.name || ""),
        escapeField(String(record.revision_date || "")),
        escapeField(String(record.version || "")),
        escapeField(String(record.regulation_type || "")),
        escapeField(String(record.language || "")),
        escapeField(((record.r_phrases as string[]) || []).join("; ")),
        escapeField(((record.s_phrases as string[]) || []).join("; ")),
        escapeField(((record.reach_registration_numbers as string[]) || []).join("; ")),
      ];

      lines.push(row.join(","));
    }

    return lines.join("\n") + "\n";
  }
}
