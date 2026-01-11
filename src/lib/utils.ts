import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { customAlphabet } from 'nanoid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed similar lookalikes like I, 1, 0, O
const nanoid = customAlphabet(alphabet, 8); // 8 chars is enough entropy for this scale

export function generateComplaintId() {
  return `CMP-${nanoid()}`;
}

export async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
