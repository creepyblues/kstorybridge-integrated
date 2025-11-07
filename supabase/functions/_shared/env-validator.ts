/**
 * Environment Variable Validation
 * Ensures required configuration is present before edge function execution
 */

export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Get a required environment variable, throwing if not found
 */
export function getRequiredEnv(key: string): string {
  const value = Deno.env.get(key);

  if (!value || value.trim() === '') {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    throw new EnvironmentValidationError(
      `Server misconfiguration: Missing required environment variable '${key}'. ` +
      `Please configure this variable in your edge function settings.`
    );
  }

  return value;
}

/**
 * Get an optional environment variable with a default value
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  const value = Deno.env.get(key);
  return value && value.trim() !== '' ? value : defaultValue;
}

/**
 * Validate all required environment variables at startup
 */
export function validateEnvironment(requiredVars: string[]): void {
  const missing: string[] = [];

  for (const key of requiredVars) {
    const value = Deno.env.get(key);
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`[FATAL] ${errorMessage}`);
    throw new EnvironmentValidationError(errorMessage);
  }

  console.log(`[Env] Validated ${requiredVars.length} required environment variables`);
}

/**
 * Mask sensitive values for logging
 */
export function maskValue(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }

  return value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars);
}

/**
 * Log environment configuration (safely)
 */
export function logEnvironmentConfig(config: Record<string, string | number | boolean>): void {
  const safeConfig: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(config)) {
    // Mask anything that looks like a key/secret/token
    if (
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('password')
    ) {
      safeConfig[key] = typeof value === 'string' ? maskValue(value) : value;
    } else {
      safeConfig[key] = value;
    }
  }

  console.log('[Env] Configuration:', safeConfig);
}
