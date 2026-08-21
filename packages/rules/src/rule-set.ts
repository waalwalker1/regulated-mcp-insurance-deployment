import type {
  SupportedCountry,
  PropertyType,
  OccupancyType,
  FloorAreaBand,
  ConstructionYearBand,
  CoverageTier,
  DeductibleOption
} from '@northstar/domain';

export interface InsuranceRuleSet {
  version: string;
  label: string;
  effectiveFrom: string;
  effectiveTo?: string;
  supportedCountries: SupportedCountry[];
  baseAnnualRates: Record<SupportedCountry, number>;
  propertyMultipliers: Record<PropertyType, number>;
  occupancyMultipliers: Record<OccupancyType, number>;
  areaMultipliers: Record<FloorAreaBand, number>;
  constructionYearMultipliers: Record<ConstructionYearBand, number>;
  claimsMultipliers: Record<number, number>;
  coverageTierMultipliers: Record<CoverageTier, number>;
  deductibleDiscounts: Record<DeductibleOption, number>;
  taxRates: Record<SupportedCountry, number>;
  maxClaimsForInstantQuote: number;
  mandatoryDisclosure: string;
}
