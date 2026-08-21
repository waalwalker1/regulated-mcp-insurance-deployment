export type DataClassificationTier =
  "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED_PII";

export interface FieldDataClassification {
  fieldName: string;
  tier: DataClassificationTier;
  justification: string;
  retentionPeriod: string;
  redactedInLogs: boolean;
}

export const DATA_CLASSIFICATION_REGISTRY: Record<
  string,
  FieldDataClassification
> = {
  country: {
    fieldName: "country",
    tier: "INTERNAL",
    justification:
      "Required for underwriting jurisdiction and regional pricing calculation.",
    retentionPeriod: "30 days (quote lifecycle)",
    redactedInLogs: false,
  },
  postcode: {
    fieldName: "postcode",
    tier: "INTERNAL",
    justification: "Required for geographic risk factor assessment.",
    retentionPeriod: "30 days (quote lifecycle)",
    redactedInLogs: false,
  },
  propertyType: {
    fieldName: "propertyType",
    tier: "INTERNAL",
    justification: "Structural risk multiplier.",
    retentionPeriod: "30 days",
    redactedInLogs: false,
  },
  occupancyType: {
    fieldName: "occupancyType",
    tier: "INTERNAL",
    justification: "Occupancy risk multiplier.",
    retentionPeriod: "30 days",
    redactedInLogs: false,
  },
  claimsCount5Years: {
    fieldName: "claimsCount5Years",
    tier: "INTERNAL",
    justification: "Loss history multiplier.",
    retentionPeriod: "30 days",
    redactedInLogs: false,
  },
  contactEmail: {
    fieldName: "contactEmail",
    tier: "RESTRICTED_PII",
    justification:
      "Contact address for non-binding quote PDF delivery. Processed only after consent.",
    retentionPeriod:
      "Purged immediately upon session completion or 30-day expiry",
    redactedInLogs: true,
  },
  hasConsentedToDataProcessing: {
    fieldName: "hasConsentedToDataProcessing",
    tier: "CONFIDENTIAL",
    justification: "Audit evidence of GDPR processing consent.",
    retentionPeriod: "7 years (regulatory audit requirement)",
    redactedInLogs: false,
  },
};
