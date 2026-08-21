const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*prompt\s*:/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /set\s+(premium|price)\s+to\s+0/i,
  /override\s+eligibility/i,
  /bypass\s+consent/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i
];

export interface SanitizationResult {
  isSafe: boolean;
  detectedThreats: string[];
  sanitizedValue: string;
}

export function sanitizeTextInput(input: string, maxLength: number = 255): SanitizationResult {
  const trimmed = input.trim().slice(0, maxLength);
  const detectedThreats: string[] = [];

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      detectedThreats.push(`Matched suspicious pattern: ${pattern.source}`);
    }
  }

  // Remove potential HTML/script tags and control characters
  const sanitized = trimmed
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '');

  return {
    isSafe: detectedThreats.length === 0,
    detectedThreats,
    sanitizedValue: sanitized
  };
}
