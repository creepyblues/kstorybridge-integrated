/**
 * Prompt Sanitization Utilities
 * Prevents prompt injection attacks and enforces safety limits
 */

export interface SanitizationResult {
  sanitized: string;
  warnings: string[];
  originalLength: number;
  sanitizedLength: number;
}

// Maximum prompt length (DALL-E 3 supports up to 4000, we use 2000 for safety)
const MAX_PROMPT_LENGTH = 2000;

// Minimum prompt length for meaningful generation
const MIN_PROMPT_LENGTH = 10;

// Known prompt injection patterns
const INJECTION_PATTERNS = [
  // Direct instruction manipulation
  /ignore\s+(previous|all|the|above)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(everything|all|previous|the above)/gi,
  /disregard\s+(previous|all|the)\s+(instructions?|context)/gi,

  // Role manipulation
  /you\s+are\s+now\s+(a|an)/gi,
  /act\s+as\s+(a|an|if)/gi,
  /pretend\s+(to\s+be|you\s+are)/gi,

  // System/assistant prefixes
  /system\s*:/gi,
  /assistant\s*:/gi,
  /user\s*:/gi,
  /<\|system\|>/gi,
  /<\|assistant\|>/gi,

  // Jailbreak attempts
  /jailbreak/gi,
  /DAN\s+mode/gi,
  /developer\s+mode/gi,
];

// Suspicious content patterns that might violate content policy
const SUSPICIOUS_PATTERNS = [
  /\b(nsfw|explicit|adult|sexual)\b/gi,
  /\b(violence|gore|blood|death)\b/gi,
  /\b(illegal|criminal|weapon|drug)\b/gi,
];

/**
 * Sanitize a prompt to prevent injection attacks and enforce safety limits
 */
export function sanitizePrompt(prompt: string): SanitizationResult {
  const warnings: string[] = [];
  const originalLength = prompt.length;

  // Step 1: Basic cleanup
  let sanitized = prompt.trim();

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Step 2: Check minimum length
  if (sanitized.length < MIN_PROMPT_LENGTH) {
    warnings.push(`Prompt too short (${sanitized.length} chars, minimum ${MIN_PROMPT_LENGTH})`);
  }

  // Step 3: Remove injection patterns
  INJECTION_PATTERNS.forEach(pattern => {
    if (pattern.test(sanitized)) {
      warnings.push('Removed potential prompt injection pattern');
      sanitized = sanitized.replace(pattern, '');
    }
  });

  // Step 4: Flag suspicious content (don't remove, just warn)
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(sanitized)) {
      warnings.push('Detected potentially policy-violating content');
    }
  });

  // Step 5: Enforce maximum length
  if (sanitized.length > MAX_PROMPT_LENGTH) {
    warnings.push(
      `Truncated prompt from ${sanitized.length} to ${MAX_PROMPT_LENGTH} characters`
    );
    sanitized = sanitized.substring(0, MAX_PROMPT_LENGTH);

    // Try to truncate at sentence boundary
    const lastPeriod = sanitized.lastIndexOf('.');
    const lastExclamation = sanitized.lastIndexOf('!');
    const lastQuestion = sanitized.lastIndexOf('?');
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

    if (lastSentenceEnd > MAX_PROMPT_LENGTH * 0.8) {
      sanitized = sanitized.substring(0, lastSentenceEnd + 1);
    }
  }

  // Step 6: Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Step 7: Final trim
  sanitized = sanitized.trim();

  return {
    sanitized,
    warnings,
    originalLength,
    sanitizedLength: sanitized.length,
  };
}

/**
 * Validate a prompt meets all requirements
 */
export function validatePrompt(prompt: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
  warnings?: string[];
} {
  // Sanitize first
  const result = sanitizePrompt(prompt);

  // Check if prompt is still valid after sanitization
  if (result.sanitizedLength === 0) {
    return {
      valid: false,
      error: 'Prompt is empty after sanitization',
    };
  }

  if (result.sanitizedLength < MIN_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `Prompt too short (${result.sanitizedLength} chars, minimum ${MIN_PROMPT_LENGTH})`,
    };
  }

  // Check if too much content was removed (possible attack)
  const removalPercentage = ((result.originalLength - result.sanitizedLength) / result.originalLength) * 100;
  if (removalPercentage > 50) {
    return {
      valid: false,
      error: `Over 50% of prompt content was removed during sanitization (possible injection attempt)`,
    };
  }

  return {
    valid: true,
    sanitized: result.sanitized,
    warnings: result.warnings.length > 0 ? result.warnings : undefined,
  };
}

/**
 * Log sanitization results for monitoring
 */
export function logSanitization(
  result: SanitizationResult,
  context: { assetId?: string; titleId?: string }
): void {
  if (result.warnings.length > 0) {
    console.warn('[Prompt Sanitization]', {
      context,
      originalLength: result.originalLength,
      sanitizedLength: result.sanitizedLength,
      warnings: result.warnings,
      reductionPercent: (
        ((result.originalLength - result.sanitizedLength) / result.originalLength) * 100
      ).toFixed(2),
    });
  }
}
