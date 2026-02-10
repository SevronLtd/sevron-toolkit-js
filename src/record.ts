/**
 * SDS Record handling for the Sevron Toolkit.
 */

import { RecordConstructionError } from "./exceptions.js";
import { HazardGroup } from "./hazards.js";
import { PrecautionaryGroup } from "./precautions.js";
import { Substance } from "./substance.js";

// Symbol for private constructor enforcement
const PRIVATE_CONSTRUCTOR = Symbol("PRIVATE_CONSTRUCTOR");

/**
 * Company information for the SDS record.
 */
export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

/**
 * Convert CompanyInfo to dictionary representation.
 */
export function companyInfoToDict(
  info: CompanyInfo
): Record<string, string> {
  const result: Record<string, string> = { name: info.name };
  if (info.address) result.address = info.address;
  if (info.phone) result.phone = info.phone;
  if (info.email) result.email = info.email;
  return result;
}

export interface SDSRecordCreateParams {
  title: string;
  productName: string;
  substances: Substance[];
  hazards: HazardGroup;
  precautions: PrecautionaryGroup;
  manufacturer?: CompanyInfo;
  supplier?: CompanyInfo;
  revisionDate?: Date;
  version?: string;
  meta?: Record<string, unknown>;
}

/**
 * Represents a Safety Data Sheet record.
 *
 * This class uses a blocked constructor pattern. Use `SDSRecord.create()`
 * to create instances.
 */
export class SDSRecord {
  private readonly _title: string;
  private readonly _productName: string;
  private readonly _substances: Substance[];
  private readonly _hazards: HazardGroup;
  private readonly _precautions: PrecautionaryGroup;
  private readonly _manufacturer: CompanyInfo | null;
  private readonly _supplier: CompanyInfo | null;
  private readonly _revisionDate: Date | null;
  private readonly _version: string | null;
  private readonly _meta: Record<string, unknown>;
  private _validated: boolean = false;

  /**
   * Blocked constructor - use SDSRecord.create() instead.
   */
  constructor(params: SDSRecordCreateParams, privateKey: symbol) {
    if (privateKey !== PRIVATE_CONSTRUCTOR) {
      throw new RecordConstructionError(
        "SDSRecord cannot be instantiated directly. " +
          "Use SDSRecord.create() instead."
      );
    }
    this._title = params.title;
    this._productName = params.productName;
    this._substances = params.substances;
    this._hazards = params.hazards;
    this._precautions = params.precautions;
    this._manufacturer = params.manufacturer ?? null;
    this._supplier = params.supplier ?? null;
    this._revisionDate = params.revisionDate ?? null;
    this._version = params.version ?? null;
    this._meta = params.meta ?? {};
  }

  /**
   * Create a new SDSRecord with strict type checking.
   * @throws RecordConstructionError if any parameter has an invalid type.
   */
  static create(params: SDSRecordCreateParams): SDSRecord {
    const {
      title,
      productName,
      substances,
      hazards,
      precautions,
      manufacturer,
      supplier,
      revisionDate,
      version,
      meta,
    } = params;

    // Validate title
    if (typeof title !== "string") {
      throw new RecordConstructionError(
        `title must be a string, got ${typeof title}`
      );
    }
    if (!title.trim()) {
      throw new RecordConstructionError("title cannot be empty");
    }

    // Validate productName
    if (typeof productName !== "string") {
      throw new RecordConstructionError(
        `productName must be a string, got ${typeof productName}`
      );
    }
    if (!productName.trim()) {
      throw new RecordConstructionError("productName cannot be empty");
    }

    // Validate substances - must be an array of Substance objects
    if (!Array.isArray(substances)) {
      throw new RecordConstructionError(
        `substances must be an array, got ${typeof substances}`
      );
    }
    if (substances.length === 0) {
      throw new RecordConstructionError("substances array cannot be empty");
    }
    for (let i = 0; i < substances.length; i++) {
      if (!(substances[i] instanceof Substance)) {
        throw new RecordConstructionError(
          `substances[${i}] must be a Substance object, got ${typeof substances[i]}. ` +
            "Use Substance.lookup() to create Substance objects from CAS numbers."
        );
      }
    }

    // Validate hazards - must be a HazardGroup
    if (!(hazards instanceof HazardGroup)) {
      throw new RecordConstructionError(
        `hazards must be a HazardGroup object, got ${typeof hazards}. ` +
          "Use HazardGroup.fromCodes() to create HazardGroup objects from H-codes."
      );
    }

    // Validate precautions - must be a PrecautionaryGroup
    if (!(precautions instanceof PrecautionaryGroup)) {
      throw new RecordConstructionError(
        `precautions must be a PrecautionaryGroup object, got ${typeof precautions}. ` +
          "Use PrecautionaryGroup.fromCodes() to create PrecautionaryGroup objects from P-codes."
      );
    }

    // Validate optional manufacturer
    if (
      manufacturer !== undefined &&
      (typeof manufacturer !== "object" || manufacturer === null)
    ) {
      throw new RecordConstructionError(
        `manufacturer must be a CompanyInfo object or undefined, got ${typeof manufacturer}`
      );
    }

    // Validate optional supplier
    if (
      supplier !== undefined &&
      (typeof supplier !== "object" || supplier === null)
    ) {
      throw new RecordConstructionError(
        `supplier must be a CompanyInfo object or undefined, got ${typeof supplier}`
      );
    }

    // Validate optional revisionDate
    if (revisionDate !== undefined && !(revisionDate instanceof Date)) {
      throw new RecordConstructionError(
        `revisionDate must be a Date object or undefined, got ${typeof revisionDate}`
      );
    }

    // Validate optional version
    if (version !== undefined && typeof version !== "string") {
      throw new RecordConstructionError(
        `version must be a string or undefined, got ${typeof version}`
      );
    }

    // Validate optional meta
    if (
      meta !== undefined &&
      (typeof meta !== "object" || meta === null || Array.isArray(meta))
    ) {
      throw new RecordConstructionError(
        `meta must be an object or undefined, got ${typeof meta}`
      );
    }

    return new SDSRecord(
      {
        title: title.trim(),
        productName: productName.trim(),
        substances,
        hazards,
        precautions,
        manufacturer,
        supplier,
        revisionDate,
        version,
        meta,
      },
      PRIVATE_CONSTRUCTOR
    );
  }

  get title(): string {
    return this._title;
  }

  get productName(): string {
    return this._productName;
  }

  get substances(): Substance[] {
    return [...this._substances];
  }

  get hazards(): HazardGroup {
    return this._hazards;
  }

  get precautions(): PrecautionaryGroup {
    return this._precautions;
  }

  get manufacturer(): CompanyInfo | null {
    return this._manufacturer;
  }

  get supplier(): CompanyInfo | null {
    return this._supplier;
  }

  get revisionDate(): Date | null {
    return this._revisionDate;
  }

  get version(): string | null {
    return this._version;
  }

  get meta(): Record<string, unknown> {
    return { ...this._meta };
  }

  get validated(): boolean {
    return this._validated;
  }

  /**
   * Mark the record as validated (internal use only).
   */
  _markValidated(): void {
    this._validated = true;
  }

  /**
   * Convert the record to a dictionary representation.
   */
  toDict(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      title: this._title,
      product_name: this._productName,
      substances: this._substances.map((s) => s.toDict()),
      hazards: this._hazards.toDict(),
      precautions: this._precautions.toDict(),
    };

    if (this._manufacturer) {
      result.manufacturer = companyInfoToDict(this._manufacturer);
    }
    if (this._supplier) {
      result.supplier = companyInfoToDict(this._supplier);
    }
    if (this._revisionDate) {
      result.revision_date = this._revisionDate.toISOString().split("T")[0];
    }
    if (this._version) {
      result.version = this._version;
    }
    if (Object.keys(this._meta).length > 0) {
      result.meta = this._meta;
    }

    return result;
  }

  toString(): string {
    return `SDSRecord(title='${this._title}', productName='${this._productName}')`;
  }
}
