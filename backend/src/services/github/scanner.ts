/**
 * Secret scanner and redactor
 * Ensures no private keys, AWS tokens, API secrets, or .env secrets
 * ever leave the server or get forwarded to LLM or logs.
 */

const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'AWS_KEY', regex: /(?:AKIA[0-9A-Z]{16})/g },
  { name: 'AWS_SECRET', regex: /(?:aws_secret_access_key\s*=\s*['"][A-Za-z0-9/+=]{40}['"])/gi },
  { name: 'GITHUB_TOKEN', regex: /(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})/g },
  { name: 'SLACK_TOKEN', regex: /(?:xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32})/g },
  { name: 'PRIVATE_KEY', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { name: 'GENERIC_SECRET', regex: /(?:(?:api_key|apikey|secret|password|client_secret|auth_token)\s*[:=]\s*["'])([A-Za-z0-9_\-.~+/=]{16,})["']/gi },
  { name: 'JWT', regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { name: 'GOOGLE_API_KEY', regex: /AIza[0-9A-Za-z\\-_]{35}/g },
  { name: 'STRIPE_SECRET', regex: /(?:sk_live|rk_live)_[0-9a-zA-Z]{24}/g },
];

export interface RedactionResult {
  redactedText: string;
  foundSecretTypes: string[];
}

export function redactSecrets(content: string): RedactionResult {
  if (!content) return { redactedText: '', foundSecretTypes: [] };

  let redacted = content;
  const foundSet = new Set<string>();

  for (const { name, regex } of SECRET_PATTERNS) {
    if (regex.test(redacted)) {
      foundSet.add(name);
      redacted = redacted.replace(regex, `[REDACTED_SECRET_${name}]`);
    }
  }

  return {
    redactedText: redacted,
    foundSecretTypes: Array.from(foundSet),
  };
}
