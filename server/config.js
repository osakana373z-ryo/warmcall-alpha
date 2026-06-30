import 'dotenv/config';

export const JWT_SECRET = process.env.JWT_SECRET || 'warmcall-alpha-dev-secret-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
export const ADMIN_KEY = process.env.ADMIN_KEY || 'warmcall-admin';
export const AI_API_KEY = process.env.AI_API_KEY || '';
export const AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
export const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
