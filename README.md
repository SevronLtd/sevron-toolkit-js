# Sevron Toolkit (TypeScript/JavaScript)

A TypeScript/JavaScript library for validating and structuring Safety Data Sheet (SDS) extracted data according to GHS (Globally Harmonized System) requirements.

## Installation

```bash
npm install sevron-toolkit
```

## Quick Start

```typescript
import {
  Substance,
  HazardGroup,
  PrecautionaryGroup,
  SDSRecord,
  CompanyInfo,
  RecordValidator,
  RecordExporter,
  ToolkitConfig,
} from "sevron-toolkit";

// Step 1: Look up substances by CAS number
const sodiumHypochlorite = Substance.lookup("7681-52-9");
console.log(`Found: ${sodiumHypochlorite.name}`); // "Sodium hypochlorite"

// Step 2: Create hazard and precautionary groups
const hazards = HazardGroup.fromCodes(["H314", "H400", "H411"]);
const precautions = PrecautionaryGroup.fromCodes([
  "P260",
  "P280",
  "P301+P330+P331",
  "P305+P351+P338",
  "P310",
]);

// Step 3: Create the SDS record
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
  productCode: "BLEACH-500",
  regulationType: "CLP",
  language: "EN",
  rPhrases: ["R34", "R50"],
  sPhrases: ["S26", "S45"],
  reachRegistrationNumbers: ["01-2119457558-25-0000"],
  meta: { extractionConfidence: 0.98 },
});

// Step 4: Validate the record
const validator = new RecordValidator();
const result = validator.validate(record);

if (result.valid) {
  console.log("Record is valid!");
} else {
  for (const error of result.errors) {
    console.log(`Error: ${error.message}`);
  }
}

// Step 5: Export the record (only works after validation)
const exporter = new RecordExporter();
const jsonOutput = exporter.export(record, "json");
console.log(jsonOutput);
```

## Key Concepts

### Strict Type Enforcement

The toolkit enforces strict types to prevent "vibe coding" errors. You must use the proper factory methods:

```typescript
// WRONG - This will throw RecordConstructionError
SDSRecord.create({
  title: "Product",
  productName: "Test",
  substances: ["7681-52-9"], // Wrong! Must be Substance objects
  hazards: ["H314"], // Wrong! Must be HazardGroup
  precautions: ["P280"], // Wrong! Must be PrecautionaryGroup
});

// CORRECT
SDSRecord.create({
  title: "Product",
  productName: "Test",
  substances: [Substance.lookup("7681-52-9")],
  hazards: HazardGroup.fromCodes(["H314"]),
  precautions: PrecautionaryGroup.fromCodes(["P280"]),
});
```

### Pipeline Enforcement

Records must be validated before export:

```typescript
const record = SDSRecord.create({ ... });
const exporter = new RecordExporter();

// This will throw ValidationRequiredError
exporter.export(record); // Error!

// First validate, then export
const validator = new RecordValidator();
validator.validate(record);
exporter.export(record); // Works!
```

### Validation Modes

**Standard Mode** (default): Collects warnings but still allows export if there are no errors.

```typescript
const config = new ToolkitConfig("standard");
const validator = new RecordValidator(config);
const result = validator.validate(record);
// result.valid may be true even if there are warnings
```

**Strict Mode**: Treats all warnings as errors.

```typescript
const config = new ToolkitConfig("strict");
const validator = new RecordValidator(config);
const result = validator.validate(record);
// result.valid will be false if there are any warnings
```

## API Reference

### Substance

```typescript
// Look up by CAS number (validates format and check digit)
const substance = Substance.lookup("7681-52-9");

// Properties
substance.casNumber; // "7681-52-9"
substance.name; // "Sodium hypochlorite"
substance.ecNumber; // "231-668-3" (may be null)

// Convert to dict
substance.toDict();
```

### HazardGroup

```typescript
// Create from H-codes
const hazards = HazardGroup.fromCodes(["H314", "H335", "H400"]);

// Properties
hazards.codes; // ["H314", "H335", "H400"]
hazards.statements; // ["Causes severe skin burns...", ...]
hazards.categories; // ["Skin corrosion/irritation", ...]
hazards.pictograms; // ["GHS05", "GHS07", "GHS09"] (sorted, deduplicated)
```

### PrecautionaryGroup

```typescript
// Create from P-codes (including combined codes)
const precautions = PrecautionaryGroup.fromCodes(["P280", "P305+P351+P338"]);

// Properties
precautions.codes; // ["P280", "P305+P351+P338"]
precautions.statements; // ["Wear protective gloves...", ...]
precautions.types; // ["prevention", "response"]
```

### SDSRecord

```typescript
const record = SDSRecord.create({
  title: "Required title",
  productName: "Required product name",
  substances: [...],              // Array of Substance objects
  hazards: ...,                   // HazardGroup object
  precautions: ...,               // PrecautionaryGroup object
  manufacturer: ...,              // Optional CompanyInfo
  supplier: ...,                  // Optional CompanyInfo
  revisionDate: ...,              // Optional Date
  version: ...,                   // Optional string
  productCode: ...,               // Optional string
  regulationType: ...,            // Optional string (e.g. "CLP", "REACH")
  language: ...,                  // Optional string (e.g. "EN", "DE")
  rPhrases: [...],                // Optional array of R-phrase strings
  sPhrases: [...],                // Optional array of S-phrase strings
  reachRegistrationNumbers: [...], // Optional array of REACH reg. number strings
  meta: {...},                    // Optional object for custom fields
});
```

### CompanyInfo

```typescript
const company: CompanyInfo = {
  name: "Required name",
  address: "Optional address",
  phone: "Optional phone",
  email: "Optional email",
  website: "Optional website URL",
};
```

**Note:** R-phrases and S-phrases are pass-through fields (stored as-is). Unlike H-codes and P-codes, they are not validated against a database.

### RecordValidator

```typescript
const validator = new RecordValidator(); // or new RecordValidator(config)
const result = validator.validate(record);

result.valid; // boolean
result.errors; // ValidationError[]
result.warnings; // ValidationWarning[]
```

### RecordExporter

```typescript
const exporter = new RecordExporter();

// Single record
const dictOutput = exporter.export(record, "dict");
const jsonOutput = exporter.export(record, "json");

// Multiple records
const dictList = exporter.exportBatch(records, "dict");
const jsonArray = exporter.exportBatch(records, "json");
const csvOutput = exporter.exportBatch(records, "csv");
```

## Exceptions

| Exception                      | Description                                         |
| ------------------------------ | --------------------------------------------------- |
| `SevronToolkitError`           | Base exception for all toolkit errors               |
| `RecordConstructionError`      | Invalid parameters when creating SDSRecord          |
| `InvalidCASError`              | Invalid CAS number format, check digit, or not found|
| `InvalidHazardCodeError`       | Invalid or unknown H-code                           |
| `InvalidPrecautionaryCodeError`| Invalid or unknown P-code                           |
| `ValidationRequiredError`      | Attempted to export before validation               |
| `ConfigurationError`           | Invalid toolkit configuration                       |

## CAS Number Validation

The toolkit validates CAS numbers using the check digit algorithm:

1. Remove hyphens from the CAS number
2. Take all digits except the last (the check digit)
3. Multiply each digit by its position from the right (1, 2, 3, ...)
4. Sum all products
5. The check digit is `sum mod 10`

Example for CAS 7681-52-9:
```
Digits: 7, 6, 8, 1, 5, 2
Sum: 7×6 + 6×5 + 8×4 + 1×3 + 5×2 + 2×1 = 119
Check digit: 119 mod 10 = 9 ✓
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## License

MIT
