import { QuoteInputSchema, type QuoteInput } from "@northstar/domain";

export interface FlowStatePayload {
  country?: string;
  postcode?: string;
  propertyType?: string;
  occupancyType?: string;
  constructionYearBand?: string;
  floorAreaBand?: string;
  isPrimaryResidence?: boolean;
  claimsCount5Years?: number;
  coverageTier?: string;
  deductible?: number;
  contactEmail?: string;
  [key: string]: unknown;
}

/**
 * Validates and transforms Waniwani flow state into a canonical QuoteInput object
 * using the domain QuoteInputSchema.
 */
export function buildValidatedQuoteInput(state: FlowStatePayload): QuoteInput {
  return QuoteInputSchema.parse({
    country: state.country,
    postcode: state.postcode,
    propertyType: state.propertyType,
    occupancyType: state.occupancyType,
    constructionYearBand: state.constructionYearBand,
    floorAreaBand: state.floorAreaBand,
    isPrimaryResidence: Boolean(state.isPrimaryResidence),
    claimsCount5Years: Number(state.claimsCount5Years ?? 0),
    coverageTier: state.coverageTier ?? "comfort",
    deductible: state.deductible ?? 300,
    contactEmail: state.contactEmail || undefined,
  });
}
