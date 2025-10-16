import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Dual Database Architecture:
// - Supabase: User data, analysis history, agent outputs (main operations)
// - NeonDB: OSHA reference data only (knowledge pool)

// SUPABASE CONNECTION - Main database for user operations
if (!process.env.SUPABASE_DATABASE_URL) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set. Please configure your Supabase database connection.",
  );
}

const supabasePool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL });
export const supabaseDb = drizzle({ client: supabasePool, schema });

// NEONDB CONNECTION - OSHA reference data only
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. This is used for OSHA reference data.",
  );
}

const neonPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const neonDb = drizzle({ client: neonPool, schema });

// Default export for backward compatibility (points to Supabase)
export const db = supabaseDb;
export const pool = supabasePool;
