import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export interface DBClient {
  isPostgres: boolean;
  pool?: pg.Pool;
  db?: any;
}

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/relief';

let dbInstance: any = null;
let isPgConnected = false;

// In-Memory store for instant high-availability demo fallback
export class MemoryStore {
  users: any[] = [];
  incidents: any[] = [];
  incidentReports: any[] = [];
  resourceCenters: any[] = [];
  resourceStock: any[] = [];
  shelters: any[] = [];
  teams: any[] = [];
  auditLogs: any[] = [];
  private autoInc = {
    users: 1,
    incidents: 1,
    incidentReports: 1,
    resourceCenters: 1,
    resourceStock: 1,
    shelters: 1,
    teams: 1,
    auditLogs: 1,
  };

  nextId(table: keyof typeof this.autoInc): number {
    return this.autoInc[table]++;
  }
}

export const memoryStore = new MemoryStore();

export async function initDatabase(): Promise<{ isPostgres: boolean; db: any }> {
  try {
    const pool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 2000,
    });
    
    // Test query
    const client = await pool.connect();
    client.release();
    
    dbInstance = drizzle(pool, { schema });
    isPgConnected = true;
    console.log('✅ Connected to PostgreSQL Database:', dbUrl);
    return { isPostgres: true, db: dbInstance };
  } catch (err: any) {
    console.warn('⚠️ PostgreSQL connection failed (' + (err?.message || 'unknown') + '). Using robust In-Memory Store with full seed support.');
    isPgConnected = false;
    return { isPostgres: false, db: null };
  }
}

export { schema };
export const getDbStatus = () => ({ isPgConnected, dbUrl });
