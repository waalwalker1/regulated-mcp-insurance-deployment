const SENSITIVE_KEYS = new Set([
  'email',
  'contactEmail',
  'phone',
  'password',
  'secret',
  'token',
  'apiKey',
  'creditCard',
  'nationalId',
  'ssn'
]);

/**
 * Recursively sanitize metadata object to redact PII and secret values
 */
export function redactMetadata(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      result[key] = value;
      continue;
    }

    if (SENSITIVE_KEYS.has(key)) {
      if (typeof value === 'string' && value.includes('@')) {
        const parts = value.split('@');
        result[key] = `${parts[0].slice(0, 2)}***@${parts[1]}`;
      } else {
        result[key] = '[REDACTED]';
      }
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redactMetadata(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? redactMetadata(item as Record<string, unknown>)
          : item
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}
