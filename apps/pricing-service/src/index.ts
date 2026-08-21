import { buildPricingServer } from './server.js';

const PORT = parseInt(process.env.PRICING_SERVICE_PORT || process.env.PORT || '3001', 10);
const HOST = '0.0.0.0';

const { app } = buildPricingServer();

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`[Pricing Service] Northstar Insurance Pricing API listening on http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('[Pricing Service] Startup error:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
