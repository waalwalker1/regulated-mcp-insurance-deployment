import { createHash } from "node:crypto";
import type { AuditEventType, AuditActor } from "@northstar/domain";

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== undefined) {
      sorted[key] = sortKeys(val);
    }
  }
  return sorted;
}

export function calculateEventHash(
  previousHash: string,
  eventId: string,
  sessionId: string,
  correlationId: string,
  timestamp: string,
  eventType: AuditEventType,
  actor: AuditActor,
  ruleVersion: string | undefined,
  metadata: Record<string, unknown>,
): string {
  const payload = JSON.stringify({
    previousHash,
    eventId,
    sessionId,
    correlationId,
    timestamp,
    eventType,
    actor,
    ruleVersion: ruleVersion || null,
    metadata: sortKeys(metadata || {}),
  });

  return createHash("sha256").update(payload).digest("hex");
}
