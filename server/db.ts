import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Dual Database Architecture:
// - Supabase: User data, analysis history, agent outputs (main operations) - uses standard pg driver
// - NeonDB: OSHA reference data only (knowledge pool) - uses Neon driver

// SUPABASE CONNECTION - Main database for user operations (standard postgres)
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
if (!supabaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set. Please configure your Supabase database connection.",
  );
}

const supabasePool = new PgPool({ connectionString: supabaseUrl });
export const supabaseDb = pgDrizzle(supabasePool, { schema });

// NEONDB CONNECTION - OSHA reference data only (Neon serverless)
const neonUrl = process.env.DATABASE_URL;
if (!neonUrl) {
  throw new Error(
    "DATABASE_URL must be set. This is used for OSHA reference data.",
  );
}

const neonPool = new NeonPool({ connectionString: neonUrl });
export const neonDb = neonDrizzle(neonPool, { schema });

// Default export for backward compatibility (points to Supabase)
export const db = supabaseDb;
export const pool = supabasePool;
