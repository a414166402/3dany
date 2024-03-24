// import { Pool } from "pg";
// import DatabaseService from '../lib/DatabaseService'
// let globalPool: Pool;

// export function getDb() {
//   if (!globalPool) {
//     const connectionString = process.env.POSTGRES_URL;
//     console.log("connectionString", connectionString);

//     globalPool = new Pool({
//       connectionString,
//     });
//   }

//   return globalPool;
// }

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 从环境变量中获取Supabase项目的URL和密钥
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 全局变量来存储Supabase客户端实例
let supabaseClient: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!supabaseClient) {
    // 检查环境变量是否已定义
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key is undefined. Please check your environment variables.');
    }
    // 创建并初始化Supabase客户端实例
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}
