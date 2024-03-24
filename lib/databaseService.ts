
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

type Client = SupabaseClient | Pool;

interface InsertData {
  [key: string]: any;
}

class DatabaseService {
  private client: Client;
  private type: 'supabase' | 'vercelPostgres';

  constructor() {
    if (process.env.USE_SUPABASE === 'true') {
      this.client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
      this.type = 'supabase';
    } else {
      this.client = new Pool({ connectionString: process.env.POSTGRES_URL! });
      this.type = 'vercelPostgres';
    }
  }

  async insert(tableName: string, data: InsertData): Promise<any> {
    if (this.type === 'supabase') {
      const { data: insertedData, error } = await (this.client as SupabaseClient)
        .from(tableName)
        .insert([data]);
      if (error) throw error;
      return insertedData;
    } else {
      const columns = Object.keys(data).join(',');
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(',');
      const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      
      const { rows } = await (this.client as Pool).query(sql, values);
      return rows;
    }
  }
}

export default DatabaseService;