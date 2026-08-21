import { createHash } from "node:crypto";
import type { AuditEventType, AuditActor } from "@northstar/domain";

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
    ruleVersion,
    metadata,
  });

  return createHash("sha256").update(payload).digest("hex");
}
