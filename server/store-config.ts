import {CREDIT_PACKS, STORE_ITEMS, isStoreItemForSale} from '../shared/store';

function overrides(env: Record<string, string | undefined>, key: string, ids: readonly string[], fractional = false) {
  if (env[key] === undefined) return {} as Record<string, number>;
  let value: unknown;
  try { value = JSON.parse(env[key]!); } catch { throw Error(`Invalid pricing setting: ${key}`); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(`Invalid pricing setting: ${key}`);
  const result: Record<string, number> = {};
  for (const [id, price] of Object.entries(value)) {
    if (!ids.includes(id) || typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 100000 ||
      (fractional ? !/^\d+(\.\d{1,2})?$/.test(String(price)) : !Number.isSafeInteger(price))) {
      throw Error(`Invalid pricing setting: ${key}.${id}`);
    }
    result[id] = price;
  }
  return result;
}

/** Both profiles are validated at startup. Overrides are exact cents, not discounted twice. */
export function storePricingConfig(env: Record<string, string | undefined>, testPricing: boolean) {
  const ids = CREDIT_PACKS.map(p => p.id);
  const live = overrides(env, 'CREDIT_PACK_USD_CENTS_JSON', ids);
  const test = overrides(env, 'TEST_CREDIT_PACK_USD_CENTS_JSON', ids, true);
  const storeCreditPrices = overrides(env, 'STORE_CREDIT_PRICES_JSON', STORE_ITEMS.filter(i => isStoreItemForSale(i.id)).map(i => i.id));
  const creditPackPrices = testPricing ? test : live;
  return {creditPackPrices, storeCreditPrices};
}
