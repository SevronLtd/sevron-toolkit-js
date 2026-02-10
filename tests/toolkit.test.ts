/**
 * Tests for the Sevron Toolkit.
 */

import {
  CompanyInfo,
  companyInfoToDict,
  ConfigurationError,
  HazardGroup,
  InvalidCASError,
  InvalidHazardCodeError,
  InvalidPrecautionaryCodeError,
  PrecautionaryGroup,
  RecordConstructionError,
  RecordExporter,
  RecordValidator,
  SDSRecord,
  Substance,
  ToolkitConfig,
  ValidationRequiredError,
} from "../src/index.js";

describe("ToolkitConfig", () => {
  test("default mode", () => {
    const config = new ToolkitConfig();
    expect(config.mode).toBe("standard");
    expect(config.isStrict()).toBe(false);
  });

  test("strict mode", () => {
    const config = new ToolkitConfig("strict");
    expect(config.mode).toBe("strict");
    expect(config.isStrict()).toBe(true);
  });

  test("invalid mode throws ConfigurationError", () => {
    expect(() => new ToolkitConfig("invalid" as any)).toThrow(
      ConfigurationError
    );
  });

  test("mode setter", () => {
    const config = new ToolkitConfig();
    config.mode = "strict";
    expect(config.isStrict()).toBe(true);
  });

  test("mode setter invalid throws ConfigurationError", () => {
    const config = new ToolkitConfig();
    expect(() => {
      config.mode = "invalid" as any;
    }).toThrow(ConfigurationError);
  });
});

describe("Substance", () => {
  test("lookup valid CAS", () => {
    const substance = Substance.lookup("7681-52-9");
    expect(substance.casNumber).toBe("7681-52-9");
    expect(substance.name).toBe("Sodium hypochlorite");
    expect(substance.ecNumber).toBe("231-668-3");
  });

  test("lookup another valid CAS", () => {
    const substance = Substance.lookup("64-17-5");
    expect(substance.casNumber).toBe("64-17-5");
    expect(substance.name).toBe("Ethanol");
  });

  test("invalid CAS format throws error", () => {
    expect(() => Substance.lookup("invalid")).toThrow(InvalidCASError);
  });

  test("invalid CAS checksum throws error", () => {
    expect(() => Substance.lookup("7681-52-8")).toThrow(InvalidCASError);
  });

  test("CAS not in database throws error", () => {
    // 100-00-5 has valid checksum but is not in our database
    expect(() => Substance.lookup("100-00-5")).toThrow(InvalidCASError);
  });

  test("direct instantiation blocked", () => {
    expect(
      () => new Substance("7681-52-9", "Test", null, Symbol())
    ).toThrow(InvalidCASError);
  });

  test("toDict conversion", () => {
    const substance = Substance.lookup("7681-52-9");
    const d = substance.toDict();
    expect(d.cas_number).toBe("7681-52-9");
    expect(d.name).toBe("Sodium hypochlorite");
    expect(d.ec_number).toBe("231-668-3");
  });
});

describe("HazardGroup", () => {
  test("fromCodes valid", () => {
    const hazards = HazardGroup.fromCodes(["H314", "H335"]);
    expect(hazards.codes).toEqual(["H314", "H335"]);
    expect(hazards.statements.length).toBe(2);
    expect(hazards.statements).toContain(
      "Causes severe skin burns and eye damage"
    );
  });

  test("fromCodes with pictograms", () => {
    const hazards = HazardGroup.fromCodes(["H314", "H335"]);
    expect(hazards.pictograms).toContain("GHS05");
    expect(hazards.pictograms).toContain("GHS07");
    // Pictograms should be sorted
    expect(hazards.pictograms).toEqual([...hazards.pictograms].sort());
  });

  test("fromCodes deduplication", () => {
    const hazards = HazardGroup.fromCodes(["H314", "H314", "H335"]);
    expect(hazards.codes).toEqual(["H314", "H335"]);
  });

  test("fromCodes invalid code throws error", () => {
    expect(() => HazardGroup.fromCodes(["H999"])).toThrow(InvalidHazardCodeError);
  });

  test("fromCodes empty array throws error", () => {
    expect(() => HazardGroup.fromCodes([])).toThrow(InvalidHazardCodeError);
  });

  test("fromCodes not array throws error", () => {
    expect(() => HazardGroup.fromCodes("H314" as any)).toThrow(
      InvalidHazardCodeError
    );
  });

  test("fromCodes non-string element throws error", () => {
    expect(() => HazardGroup.fromCodes(["H314", 123 as any])).toThrow(
      InvalidHazardCodeError
    );
  });

  test("direct instantiation blocked", () => {
    expect(() => new HazardGroup([], [], [], [], Symbol())).toThrow(
      InvalidHazardCodeError
    );
  });

  test("combined codes work", () => {
    const hazards = HazardGroup.fromCodes(["H300+H310"]);
    expect(hazards.codes).toEqual(["H300+H310"]);
    expect(hazards.statements).toContain(
      "Fatal if swallowed or in contact with skin"
    );
  });
});

describe("PrecautionaryGroup", () => {
  test("fromCodes valid", () => {
    const precautions = PrecautionaryGroup.fromCodes([
      "P280",
      "P305+P351+P338",
    ]);
    expect(precautions.codes).toEqual(["P280", "P305+P351+P338"]);
    expect(precautions.statements.length).toBe(2);
    expect(precautions.types).toContain("prevention");
    expect(precautions.types).toContain("response");
  });

  test("fromCodes deduplication", () => {
    const precautions = PrecautionaryGroup.fromCodes(["P280", "P280", "P310"]);
    expect(precautions.codes).toEqual(["P280", "P310"]);
  });

  test("fromCodes invalid code throws error", () => {
    expect(() => PrecautionaryGroup.fromCodes(["P999"])).toThrow(
      InvalidPrecautionaryCodeError
    );
  });

  test("fromCodes empty array throws error", () => {
    expect(() => PrecautionaryGroup.fromCodes([])).toThrow(
      InvalidPrecautionaryCodeError
    );
  });

  test("direct instantiation blocked", () => {
    expect(() => new PrecautionaryGroup([], [], [], Symbol())).toThrow(
      InvalidPrecautionaryCodeError
    );
  });
});

describe("SDSRecord", () => {
  test("create valid record", () => {
    const record = SDSRecord.create({
      title: "Test SDS",
      productName: "Test Product",
      substances: [Substance.lookup("7681-52-9")],
      hazards: HazardGroup.fromCodes(["H314"]),
      precautions: PrecautionaryGroup.fromCodes(["P280", "P305+P351+P338"]),
    });
    expect(record.title).toBe("Test SDS");
    expect(record.productName).toBe("Test Product");
    expect(record.substances.length).toBe(1);
    expect(record.validated).toBe(false);
  });

  test("create with company info", () => {
    const manufacturer: CompanyInfo = {
      name: "Test Manufacturer",
      address: "123 Test St",
      phone: "555-1234",
      email: "test@example.com",
    };
    const record = SDSRecord.create({
      title: "Test SDS",
      productName: "Test Product",
      substances: [Substance.lookup("7681-52-9")],
      hazards: HazardGroup.fromCodes(["H314"]),
      precautions: PrecautionaryGroup.fromCodes(["P280"]),
      manufacturer,
    });
    expect(record.manufacturer?.name).toBe("Test Manufacturer");
  });

  test("create with meta", () => {
    const record = SDSRecord.create({
      title: "Test SDS",
      productName: "Test Product",
      substances: [Substance.lookup("7681-52-9")],
      hazards: HazardGroup.fromCodes(["H314"]),
      precautions: PrecautionaryGroup.fromCodes(["P280"]),
      meta: { source: "extraction", confidence: 0.95 },
    });
    expect(record.meta.source).toBe("extraction");
    expect(record.meta.confidence).toBe(0.95);
  });

  test("direct instantiation blocked", () => {
    expect(
      () =>
        new SDSRecord(
          {
            title: "Test",
            productName: "Test",
            substances: [],
            hazards: HazardGroup.fromCodes(["H314"]),
            precautions: PrecautionaryGroup.fromCodes(["P280"]),
          },
          Symbol()
        )
    ).toThrow(RecordConstructionError);
  });

  test("type enforcement substances string", () => {
    expect(() =>
      SDSRecord.create({
        title: "Test SDS",
        productName: "Test Product",
        substances: ["7681-52-9"] as any, // Wrong! Should be Substance objects
        hazards: HazardGroup.fromCodes(["H314"]),
        precautions: PrecautionaryGroup.fromCodes(["P280"]),
      })
    ).toThrow(RecordConstructionError);
  });

  test("type enforcement hazards array", () => {
    expect(() =>
      SDSRecord.create({
        title: "Test SDS",
        productName: "Test Product",
        substances: [Substance.lookup("7681-52-9")],
        hazards: ["H314"] as any, // Wrong! Should be HazardGroup
        precautions: PrecautionaryGroup.fromCodes(["P280"]),
      })
    ).toThrow(RecordConstructionError);
  });

  test("type enforcement precautions array", () => {
    expect(() =>
      SDSRecord.create({
        title: "Test SDS",
        productName: "Test Product",
        substances: [Substance.lookup("7681-52-9")],
        hazards: HazardGroup.fromCodes(["H314"]),
        precautions: ["P280"] as any, // Wrong! Should be PrecautionaryGroup
      })
    ).toThrow(RecordConstructionError);
  });

  test("empty title fails", () => {
    expect(() =>
      SDSRecord.create({
        title: "",
        productName: "Test Product",
        substances: [Substance.lookup("7681-52-9")],
        hazards: HazardGroup.fromCodes(["H314"]),
        precautions: PrecautionaryGroup.fromCodes(["P280"]),
      })
    ).toThrow(RecordConstructionError);
  });

  test("empty substances fails", () => {
    expect(() =>
      SDSRecord.create({
        title: "Test SDS",
        productName: "Test Product",
        substances: [],
        hazards: HazardGroup.fromCodes(["H314"]),
        precautions: PrecautionaryGroup.fromCodes(["P280"]),
      })
    ).toThrow(RecordConstructionError);
  });
});

describe("RecordValidator", () => {
  const createTestRecord = (
    overrides: Partial<Parameters<typeof SDSRecord.create>[0]> = {}
  ) => {
    const defaults = {
      title: "Test SDS",
      productName: "Test Product",
      substances: [Substance.lookup("7681-52-9")],
      hazards: HazardGroup.fromCodes(["H314"]),
      precautions: PrecautionaryGroup.fromCodes(["P280", "P305+P351+P338"]),
    };
    return SDSRecord.create({ ...defaults, ...overrides });
  };

  test("validate valid record", () => {
    const record = createTestRecord({
      manufacturer: { name: "Test Co" },
      revisionDate: new Date("2024-01-15"),
      version: "1.0",
    });
    const validator = new RecordValidator();
    const result = validator.validate(record);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(record.validated).toBe(true);
  });

  test("validate missing company warning", () => {
    const record = createTestRecord();
    const validator = new RecordValidator();
    const result = validator.validate(record);
    expect(result.valid).toBe(true);
    const warningCodes = result.warnings.map((w) => w.code);
    expect(warningCodes).toContain("NO_COMPANY_INFO");
  });

  test("validate missing revision date warning", () => {
    const record = createTestRecord();
    const validator = new RecordValidator();
    const result = validator.validate(record);
    const warningCodes = result.warnings.map((w) => w.code);
    expect(warningCodes).toContain("NO_REVISION_DATE");
  });

  test("strict mode treats warnings as errors", () => {
    const record = createTestRecord();
    const config = new ToolkitConfig("strict");
    const validator = new RecordValidator(config);
    const result = validator.validate(record);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBe(0);
  });

  test("title too long", () => {
    const record = createTestRecord({ title: "A".repeat(201) });
    const validator = new RecordValidator();
    const result = validator.validate(record);
    expect(result.valid).toBe(false);
    const errorCodes = result.errors.map((e) => e.code);
    expect(errorCodes).toContain("TITLE_TOO_LONG");
  });
});

describe("RecordExporter", () => {
  const createValidatedRecord = (
    overrides: Partial<Parameters<typeof SDSRecord.create>[0]> = {}
  ) => {
    const defaults = {
      title: "Test SDS",
      productName: "Test Product",
      substances: [Substance.lookup("7681-52-9")],
      hazards: HazardGroup.fromCodes(["H314"]),
      precautions: PrecautionaryGroup.fromCodes(["P280", "P305+P351+P338"]),
      manufacturer: { name: "Test Co" },
      revisionDate: new Date("2024-01-15"),
      version: "1.0",
    };
    const record = SDSRecord.create({ ...defaults, ...overrides });
    const validator = new RecordValidator();
    validator.validate(record);
    return record;
  };

  test("export without validation fails", () => {
    const record = SDSRecord.create({
      title: "Test SDS",
      productName: "Test Product",
      substances: [Substance.lookup("7681-52-9")],
      hazards: HazardGroup.fromCodes(["H314"]),
      precautions: PrecautionaryGroup.fromCodes(["P280"]),
    });
    const exporter = new RecordExporter();
    expect(() => exporter.export(record)).toThrow(ValidationRequiredError);
  });

  test("export dict", () => {
    const record = createValidatedRecord();
    const exporter = new RecordExporter();
    const result = exporter.export(record, "dict") as Record<string, unknown>;
    expect(typeof result).toBe("object");
    expect(result.title).toBe("Test SDS");
  });

  test("export json", () => {
    const record = createValidatedRecord();
    const exporter = new RecordExporter();
    const result = exporter.export(record, "json") as string;
    expect(typeof result).toBe("string");
    const parsed = JSON.parse(result);
    expect(parsed.title).toBe("Test SDS");
  });

  test("export batch dict", () => {
    const records = [createValidatedRecord(), createValidatedRecord()];
    const exporter = new RecordExporter();
    const result = exporter.exportBatch(records, "dict") as Record<
      string,
      unknown
    >[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  test("export batch json", () => {
    const records = [createValidatedRecord()];
    const exporter = new RecordExporter();
    const result = exporter.exportBatch(records, "json") as string;
    expect(typeof result).toBe("string");
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
  });

  test("export batch csv", () => {
    const records = [createValidatedRecord()];
    const exporter = new RecordExporter();
    const result = exporter.exportBatch(records, "csv") as string;
    expect(typeof result).toBe("string");
    expect(result).toContain("title,product_name");
  });

  test("export batch empty fails", () => {
    const exporter = new RecordExporter();
    expect(() => exporter.exportBatch([], "dict")).toThrow();
  });

  test("export invalid format", () => {
    const record = createValidatedRecord();
    const exporter = new RecordExporter();
    expect(() => exporter.export(record, "xml" as any)).toThrow();
  });
});

describe("Pipeline Order", () => {
  test("full pipeline", () => {
    // Step 1: Look up substances
    const sodiumHypochlorite = Substance.lookup("7681-52-9");

    // Step 2: Create hazard and precautionary groups
    const hazards = HazardGroup.fromCodes(["H314", "H400", "H411"]);
    const precautions = PrecautionaryGroup.fromCodes([
      "P260",
      "P280",
      "P301+P330+P331",
      "P305+P351+P338",
      "P310",
    ]);

    // Step 3: Create the record
    const record = SDSRecord.create({
      title: "Sodium Hypochlorite Solution SDS",
      productName: "Bleach Solution",
      substances: [sodiumHypochlorite],
      hazards,
      precautions,
      manufacturer: {
        name: "Chemical Corp",
        address: "123 Industrial Way",
        phone: "555-0100",
      },
      revisionDate: new Date("2024-01-15"),
      version: "2.1",
      meta: { extraction_confidence: 0.98 },
    });

    // Record should not be validated yet
    expect(record.validated).toBe(false);

    // Step 4: Validate the record
    const validator = new RecordValidator();
    const result = validator.validate(record);
    expect(result.valid).toBe(true);
    expect(record.validated).toBe(true);

    // Step 5: Export the record
    const exporter = new RecordExporter();
    const output = exporter.export(record, "json") as string;
    expect(typeof output).toBe("string");
    const parsed = JSON.parse(output);
    expect(parsed.title).toBe("Sodium Hypochlorite Solution SDS");
    expect(parsed.meta.extraction_confidence).toBe(0.98);
  });
});

describe("CAS Check Digit Algorithm", () => {
  // Access private method for testing
  const validateCasChecksum = (cas: string): boolean => {
    const digitsOnly = cas.replace(/-/g, "");
    const checkDigit = parseInt(digitsOnly[digitsOnly.length - 1], 10);
    const validateDigits = digitsOnly.slice(0, -1);
    let total = 0;
    let position = 1;
    for (let i = validateDigits.length - 1; i >= 0; i--) {
      total += parseInt(validateDigits[i], 10) * position;
      position++;
    }
    return total % 10 === checkDigit;
  };

  test("sodium hypochlorite checksum", () => {
    // CAS 7681-52-9
    // Digits (excluding check): 7, 6, 8, 1, 5, 2
    // Positions from right: 6, 5, 4, 3, 2, 1
    // Sum: 7×6 + 6×5 + 8×4 + 1×3 + 5×2 + 2×1
    //    = 42 + 30 + 32 + 3 + 10 + 2 = 119
    // Check digit: 119 mod 10 = 9 ✓
    expect(validateCasChecksum("7681-52-9")).toBe(true);
    expect(validateCasChecksum("7681-52-8")).toBe(false);
    expect(validateCasChecksum("7681-52-0")).toBe(false);
  });

  test("ethanol checksum", () => {
    expect(validateCasChecksum("64-17-5")).toBe(true);
  });

  test("water checksum", () => {
    expect(validateCasChecksum("7732-18-5")).toBe(true);
  });
});

describe("New Assessment Fields", () => {
  const createBaseRecord = (
    overrides: Partial<Parameters<typeof SDSRecord.create>[0]> = {}
  ) => {
    const defaults = {
      title: "Test SDS",
      productName: "Test Product",
      substances: [Substance.lookup("7681-52-9")],
      hazards: HazardGroup.fromCodes(["H314"]),
      precautions: PrecautionaryGroup.fromCodes(["P280", "P305+P351+P338"]),
    };
    return SDSRecord.create({ ...defaults, ...overrides });
  };

  const createValidatedRecord = (
    overrides: Partial<Parameters<typeof SDSRecord.create>[0]> = {}
  ) => {
    const record = createBaseRecord(overrides);
    const validator = new RecordValidator();
    validator.validate(record);
    return record;
  };

  // --- Creation tests ---

  test("create with productCode", () => {
    const record = createBaseRecord({ productCode: "PC-12345" });
    expect(record.productCode).toBe("PC-12345");
  });

  test("create with regulationType", () => {
    const record = createBaseRecord({ regulationType: "REACH" });
    expect(record.regulationType).toBe("REACH");
  });

  test("create with language", () => {
    const record = createBaseRecord({ language: "EN" });
    expect(record.language).toBe("EN");
  });

  test("create with rPhrases", () => {
    const record = createBaseRecord({ rPhrases: ["R20", "R36/37/38"] });
    expect(record.rPhrases).toEqual(["R20", "R36/37/38"]);
  });

  test("create with sPhrases", () => {
    const record = createBaseRecord({ sPhrases: ["S2", "S26"] });
    expect(record.sPhrases).toEqual(["S2", "S26"]);
  });

  test("create with reachRegistrationNumbers", () => {
    const record = createBaseRecord({
      reachRegistrationNumbers: ["01-2119457558-25-0000"],
    });
    expect(record.reachRegistrationNumbers).toEqual([
      "01-2119457558-25-0000",
    ]);
  });

  // --- Default values ---

  test("default values are null", () => {
    const record = createBaseRecord();
    expect(record.productCode).toBeNull();
    expect(record.regulationType).toBeNull();
    expect(record.language).toBeNull();
    expect(record.rPhrases).toBeNull();
    expect(record.sPhrases).toBeNull();
    expect(record.reachRegistrationNumbers).toBeNull();
  });

  // --- CompanyInfo website ---

  test("CompanyInfo with website in companyInfoToDict", () => {
    const company: CompanyInfo = {
      name: "Test Co",
      website: "https://example.com",
    };
    const d = companyInfoToDict(company);
    expect(d.website).toBe("https://example.com");
  });

  test("CompanyInfo without website omits it from dict", () => {
    const company: CompanyInfo = { name: "Test Co" };
    const d = companyInfoToDict(company);
    expect(d.website).toBeUndefined();
  });

  // --- Type enforcement ---

  test("productCode type enforcement", () => {
    expect(() =>
      createBaseRecord({ productCode: 12345 as any })
    ).toThrow(RecordConstructionError);
  });

  test("regulationType type enforcement", () => {
    expect(() =>
      createBaseRecord({ regulationType: 123 as any })
    ).toThrow(RecordConstructionError);
  });

  test("language type enforcement", () => {
    expect(() =>
      createBaseRecord({ language: 42 as any })
    ).toThrow(RecordConstructionError);
  });

  test("rPhrases type enforcement", () => {
    expect(() =>
      createBaseRecord({ rPhrases: "R20" as any })
    ).toThrow(RecordConstructionError);
  });

  test("rPhrases element type enforcement", () => {
    expect(() =>
      createBaseRecord({ rPhrases: ["R20", 123 as any] })
    ).toThrow(RecordConstructionError);
  });

  test("sPhrases type enforcement", () => {
    expect(() =>
      createBaseRecord({ sPhrases: "S2" as any })
    ).toThrow(RecordConstructionError);
  });

  test("reachRegistrationNumbers type enforcement", () => {
    expect(() =>
      createBaseRecord({ reachRegistrationNumbers: "01-123" as any })
    ).toThrow(RecordConstructionError);
  });

  // --- Validation ---

  test("productCode too long validation", () => {
    const record = createBaseRecord({ productCode: "A".repeat(101) });
    const validator = new RecordValidator();
    const result = validator.validate(record);
    expect(result.valid).toBe(false);
    const errorCodes = result.errors.map((e) => e.code);
    expect(errorCodes).toContain("PRODUCT_CODE_TOO_LONG");
  });

  // --- toDict / export ---

  test("new fields in toDict", () => {
    const record = createBaseRecord({
      productCode: "PC-001",
      regulationType: "CLP",
      language: "DE",
      rPhrases: ["R20", "R36"],
      sPhrases: ["S2"],
      reachRegistrationNumbers: ["01-2119457558-25-0000"],
    });
    const d = record.toDict();
    expect(d.product_code).toBe("PC-001");
    expect(d.regulation_type).toBe("CLP");
    expect(d.language).toBe("DE");
    expect(d.r_phrases).toEqual(["R20", "R36"]);
    expect(d.s_phrases).toEqual(["S2"]);
    expect(d.reach_registration_numbers).toEqual(["01-2119457558-25-0000"]);
  });

  test("new fields absent when null", () => {
    const record = createBaseRecord();
    const d = record.toDict();
    expect(d.product_code).toBeUndefined();
    expect(d.regulation_type).toBeUndefined();
    expect(d.language).toBeUndefined();
    expect(d.r_phrases).toBeUndefined();
    expect(d.s_phrases).toBeUndefined();
    expect(d.reach_registration_numbers).toBeUndefined();
  });

  test("new fields in JSON export", () => {
    const record = createValidatedRecord({
      productCode: "PC-001",
      rPhrases: ["R20"],
    });
    const exporter = new RecordExporter();
    const result = exporter.export(record, "json") as string;
    const parsed = JSON.parse(result);
    expect(parsed.product_code).toBe("PC-001");
    expect(parsed.r_phrases).toEqual(["R20"]);
  });

  test("new fields in CSV export", () => {
    const record = createValidatedRecord({
      productCode: "PC-001",
      regulationType: "CLP",
      language: "EN",
      rPhrases: ["R20", "R36"],
      sPhrases: ["S2", "S26"],
      reachRegistrationNumbers: ["01-2119457558-25-0000"],
    });
    const exporter = new RecordExporter();
    const result = exporter.exportBatch([record], "csv") as string;
    expect(result).toContain("product_code");
    expect(result).toContain("regulation_type");
    expect(result).toContain("r_phrases");
    expect(result).toContain("PC-001");
    expect(result).toContain("R20; R36");
  });

  // --- String stripping ---

  test("productCode is stripped", () => {
    const record = createBaseRecord({ productCode: "  PC-001  " });
    expect(record.productCode).toBe("PC-001");
  });

  // --- Full pipeline ---

  test("full pipeline with new fields", () => {
    const record = SDSRecord.create({
      title: "Full Pipeline SDS",
      productName: "Test Chemical",
      substances: [Substance.lookup("7681-52-9")],
      hazards: HazardGroup.fromCodes(["H314"]),
      precautions: PrecautionaryGroup.fromCodes(["P280", "P305+P351+P338"]),
      manufacturer: {
        name: "Chemical Corp",
        website: "https://chemcorp.example.com",
      },
      revisionDate: new Date("2024-06-01"),
      version: "3.0",
      productCode: "BLEACH-500",
      regulationType: "CLP",
      language: "EN",
      rPhrases: ["R34", "R50"],
      sPhrases: ["S26", "S45"],
      reachRegistrationNumbers: ["01-2119457558-25-0000"],
    });
    expect(record.validated).toBe(false);

    const validator = new RecordValidator();
    const result = validator.validate(record);
    expect(result.valid).toBe(true);
    expect(record.validated).toBe(true);

    const exporter = new RecordExporter();
    const output = exporter.export(record, "json") as string;
    const parsed = JSON.parse(output);
    expect(parsed.product_code).toBe("BLEACH-500");
    expect(parsed.regulation_type).toBe("CLP");
    expect(parsed.language).toBe("EN");
    expect(parsed.r_phrases).toEqual(["R34", "R50"]);
    expect(parsed.s_phrases).toEqual(["S26", "S45"]);
    expect(parsed.reach_registration_numbers).toEqual([
      "01-2119457558-25-0000",
    ]);
    expect((parsed.manufacturer as Record<string, string>).website).toBe(
      "https://chemcorp.example.com"
    );
  });
});
