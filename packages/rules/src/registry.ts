import type { InsuranceRuleSet } from "./rule-set.js";
import { RULE_SET_V1 } from "./v1.js";
import { RULE_SET_V2 } from "./v2.js";

export const RULE_REGISTRY: Record<string, InsuranceRuleSet> = {
  [RULE_SET_V1.version]: RULE_SET_V1,
  [RULE_SET_V2.version]: RULE_SET_V2,
};

export const DEFAULT_RULE_VERSION = RULE_SET_V1.version;

export function getRuleSet(
  version: string = DEFAULT_RULE_VERSION,
): InsuranceRuleSet {
  const ruleSet = RULE_REGISTRY[version];
  if (!ruleSet) {
    throw new Error(
      `Unknown insurance rule version '${version}'. Available: ${Object.keys(RULE_REGISTRY).join(", ")}`,
    );
  }
  return ruleSet;
}
