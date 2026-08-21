export type DomainErrorCode =
  | 'INVALID_INPUT'
  | 'MISSING_REQUIRED_FIELDS'
  | 'CONSENT_REQUIRED'
  | 'INELIGIBLE_RISK'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'INVALID_STATE_TRANSITION'
  | 'TAMPERING_DETECTED'
  | 'UNAUTHORIZED_OVERRIDE'
  | 'INTERNAL_RULE_ERROR';

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    super(`[${code}] ${message}`);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, DomainError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}
