import { FunnelEngine } from '../apps/mcp-server/src/funnel-engine.js';
import { createSessionStore } from '../packages/persistence/src/index.js';
import { globalAuditStore } from '../packages/audit/src/index.js';

async function seedDemoData() {
  console.log('==> Seeding synthetic demonstration sessions into active store...');
  const engine = new FunnelEngine(createSessionStore(), globalAuditStore);

  // Seed 1: France Apartment (Completed & Quoted)
  const s1 = await engine.startSession('seed-corr-fr');
  await engine.submitPropertyBasics(s1.sessionId, {
    country: 'FR',
    postcode: '75008',
    propertyType: 'apartment',
    occupancyType: 'owner_occupied'
  });
  await engine.submitRiskFactors(s1.sessionId, {
    constructionYearBand: '2000_2015',
    floorAreaBand: '50_100_sqm',
    isPrimaryResidence: true,
    claimsCount5Years: 0
  });
  await engine.evaluateEligibility(s1.sessionId);
  await engine.selectCoverage(s1.sessionId, { coverageTier: 'comfort', deductible: 300 });
  await engine.confirmParameters(s1.sessionId, true);
  await engine.submitConsent(s1.sessionId);
  const q1 = await engine.calculateQuote(s1.sessionId);
  console.log(`  -> Seeded Session 1 (FR Apartment, Quoted €${q1.pricing.totalAnnualPremium}): ${s1.sessionId}`);

  // Seed 2: Germany Villa (Referred)
  const s2 = await engine.startSession('seed-corr-de');
  await engine.submitPropertyBasics(s2.sessionId, {
    country: 'DE',
    postcode: '10115',
    propertyType: 'villa',
    occupancyType: 'owner_occupied'
  });
  await engine.submitRiskFactors(s2.sessionId, {
    constructionYearBand: 'pre_1970',
    floorAreaBand: 'over_250_sqm',
    isPrimaryResidence: true,
    claimsCount5Years: 4
  });
  const eval2 = await engine.evaluateEligibility(s2.sessionId);
  console.log(`  -> Seeded Session 2 (DE Villa, Referred): ${s2.sessionId}`);

  console.log('==> Seeding completed successfully.');
}

seedDemoData().catch(console.error);
