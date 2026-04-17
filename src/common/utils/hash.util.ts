import * as bcrypt from 'bcrypt';

const DEFAULT_SALT_ROUNDS = 12;

export async function hashValue(
  rawValue: string,
  saltRounds = DEFAULT_SALT_ROUNDS,
): Promise<string> {
  return bcrypt.hash(rawValue, saltRounds);
}

export async function compareHash(
  rawValue: string,
  hashedValue: string,
): Promise<boolean> {
  return bcrypt.compare(rawValue, hashedValue);
}
