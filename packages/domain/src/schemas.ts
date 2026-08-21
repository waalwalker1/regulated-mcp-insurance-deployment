import { z } from "zod";

export const SupportedCountrySchema = z.enum(["FR", "ES", "PT", "DE", "IT"], {
  description: "Supported European country code (ISO 3166-1 alpha-2)",
});
export type SupportedCountry = z.infer<typeof SupportedCountrySchema>;

export const OccupancyTypeSchema = z.enum(
  ["owner_occupied", "tenant", "landlord"],
  {
    description: "Occupancy nature of the insured property",
  },
);
export type OccupancyType = z.infer<typeof OccupancyTypeSchema>;

export const PropertyTypeSchema = z.enum(
  ["apartment", "detached_house", "semi_detached", "terraced_house", "villa"],
  {
    description: "Structural property category",
  },
);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

export const ConstructionYearBandSchema = z.enum(
  ["pre_1970", "1970_1999", "2000_2015", "post_2015"],
  {
    description: "Construction year period",
  },
);
export type ConstructionYearBand = z.infer<typeof ConstructionYearBandSchema>;

export const FloorAreaBandSchema = z.enum(
  ["under_50_sqm", "50_100_sqm", "101_150_sqm", "151_250_sqm", "over_250_sqm"],
  {
    description: "Total living floor area in square meters",
  },
);
export type FloorAreaBand = z.infer<typeof FloorAreaBandSchema>;

export const CoverageTierSchema = z.enum(["essential", "comfort", "premium"], {
  description: "Selected coverage package",
});
export type CoverageTier = z.infer<typeof CoverageTierSchema>;

export const DeductibleOptionSchema = z.union(
  [z.literal(150), z.literal(300), z.literal(500), z.literal(1000)],
  {
    description: "Out-of-pocket deductible in EUR",
  },
);
export type DeductibleOption = z.infer<typeof DeductibleOptionSchema>;

export const PostcodeRegexMap: Record<SupportedCountry, RegExp> = {
  FR: /^[0-9]{5}$/,
  ES: /^[0-9]{5}$/,
  PT: /^[0-9]{4}-[0-9]{3}$/,
  DE: /^[0-9]{5}$/,
  IT: /^[0-9]{5}$/,
};

/**
 * Raw Base Quote Input Object Schema
 */
export const BaseQuoteInputSchema = z.object({
  country: SupportedCountrySchema,
  postcode: z
    .string()
    .trim()
    .min(3)
    .max(10)
    .describe("Postal code matching country format"),
  propertyType: PropertyTypeSchema.describe("Property classification"),
  occupancyType: OccupancyTypeSchema.describe(
    "Owner, tenant, or landlord occupancy",
  ),
  constructionYearBand: ConstructionYearBandSchema.describe(
    "Era of property construction",
  ),
  floorAreaBand: FloorAreaBandSchema.describe("Floor surface area band"),
  isPrimaryResidence: z
    .boolean()
    .describe("Whether this is the primary residence"),
  claimsCount5Years: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe("Total claims made in last 5 years"),
  coverageTier: CoverageTierSchema.default("comfort").describe(
    "Desired insurance coverage tier",
  ),
  deductible: DeductibleOptionSchema.default(300).describe(
    "Chosen out-of-pocket deductible in EUR",
  ),
  contactEmail: z
    .string()
    .email()
    .optional()
    .describe("Optional contact email for quote delivery"),
});

/**
 * Validated Quote Input with strict postcode validation
 */
export const QuoteInputSchema = BaseQuoteInputSchema.strict().superRefine(
  (data, ctx) => {
    const pattern = PostcodeRegexMap[data.country];
    if (pattern && !pattern.test(data.postcode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postcode"],
        message: `Invalid postal code format for country ${data.country}. Pattern: ${pattern.source}`,
      });
    }
  },
);
export type QuoteInput = z.infer<typeof QuoteInputSchema>;

/**
 * Partial Input Schema for conversational incremental extraction
 */
export const PartialQuoteInputSchema = BaseQuoteInputSchema.partial();
export type PartialQuoteInput = z.infer<typeof PartialQuoteInputSchema>;

/**
 * Strict Correction Input Schema - disallows unknown fields and restricts to valid partial keys
 */
export const CorrectionInputSchema = BaseQuoteInputSchema.partial().strict();
export type CorrectionInput = z.infer<typeof CorrectionInputSchema>;

/**
 * Explicit Consent Schema
 */
export const ConsentDeclarationSchema = z
  .object({
    hasConsentedToDataProcessing: z.literal(true, {
      errorMap: () => ({
        message: "User must explicitly confirm consent to process quote data.",
      }),
    }),
    consentVersion: z.string().min(1),
    consentTimestamp: z.string().datetime(),
  })
  .strict();
export type ConsentDeclaration = z.infer<typeof ConsentDeclarationSchema>;

/**
 * Eligibility Outcome Schema
 */
export const EligibilityStatusSchema = z.enum([
  "eligible",
  "referral_required",
  "declined",
]);
export type EligibilityStatus = z.infer<typeof EligibilityStatusSchema>;

export const EligibilityResultSchema = z.object({
  status: EligibilityStatusSchema,
  isEligible: z.boolean(),
  reasonCodes: z.array(z.string()),
  explanation: z.string(),
  evaluatedAt: z.string().datetime(),
  ruleVersion: z.string(),
});
export type EligibilityResult = z.infer<typeof EligibilityResultSchema>;

/**
 * Deterministic Pricing Breakdown
 */
export const PricingBreakdownSchema = z.object({
  baseAnnualPremium: z.number().positive(),
  propertyTypeMultiplier: z.number().positive(),
  occupancyMultiplier: z.number().positive(),
  areaMultiplier: z.number().positive(),
  constructionYearMultiplier: z.number().positive(),
  claimsMultiplier: z.number().positive(),
  coverageTierMultiplier: z.number().positive(),
  deductibleDiscount: z.number(),
  netAnnualPremium: z.number().positive(),
  fictionalTaxAmount: z.number().nonnegative(),
  taxRatePercent: z.number().nonnegative(),
  totalAnnualPremium: z.number().positive(),
  totalMonthlyPremium: z.number().positive(),
  currency: z.literal("EUR"),
});
export type PricingBreakdown = z.infer<typeof PricingBreakdownSchema>;

/**
 * Complete Generated Quote Schema
 */
export const GeneratedQuoteSchema = z.object({
  quoteId: z.string().uuid(),
  sessionId: z.string().uuid(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  ruleVersion: z.string(),
  quoteHash: z.string().length(64),
  input: BaseQuoteInputSchema,
  eligibility: EligibilityResultSchema,
  pricing: PricingBreakdownSchema,
  mandatoryDisclosure: z.string(),
  isBinding: z.literal(false),
  status: z.enum(["active", "adjusted", "expired", "referred"]),
});
export type GeneratedQuote = z.infer<typeof GeneratedQuoteSchema>;
export type IndicativeQuote = GeneratedQuote;
