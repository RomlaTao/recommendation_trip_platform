import { createHash } from 'crypto';

export function buildSourceEventId(prefix: string, ...parts: string[]): string {
  const raw = parts.join(':');
  const digest = createHash('sha256').update(raw).digest('hex');
  return `${prefix}:${digest}`;
}
