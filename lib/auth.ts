import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

// Open single-user access mode: No password or login required
export async function isAuthenticated(): Promise<boolean> {
  return true;
}

export function checkLoginRateLimit(_ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  return { allowed: true };
}

export function resetLoginRateLimit(_ip: string): void {}

export async function createSessionToken(): Promise<string> {
  return 'single-user-token';
}

export async function verifySessionToken(_token: string): Promise<boolean> {
  return true;
}

export async function setSessionCookie(): Promise<string> {
  return 'single-user-token';
}

export async function clearSessionCookie(): Promise<void> {}

export function verifyPassword(_providedPassword: string): boolean {
  return true;
}
