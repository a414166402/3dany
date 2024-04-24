import { User } from "@/types/user";
import { getDb } from "@/models/db";
import { log, warn, error } from '@/lib/log';

export async function insertUser(user: User) {
  const createdAt: string = new Date().toISOString();

  const db = await getDb();
  // const res = await db.query(
  //   `INSERT INTO users 
  //     (email, nickname, avatar_url, created_at, uuid) 
  //     VALUES 
  //     ($1, $2, $3, $4, $5)
  // `,
  //   [user.email, user.nickname, user.avatar_url, createdAt, user.uuid]
  // );

  // return res;
  const { data, error } = await db
  .from('users')
  .insert([
    { ...user, created_at: createdAt }
  ]);

  if (error) {
    throw error;
  }
  warn("insertUserSussucess!!!")
  warn(data)
  return data;
}

export async function findUserByEmail(
  email: string
): Promise<User | undefined> {
  const db = getDb();
  // const res = await db.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [
  //   email,
  // ]);
  // if (res.rowCount === 0) {
  //   return undefined;
  // }
  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    // 检查是否是因为没有找到匹配的行而报错
    if (error.code === 'PGRST116' && error.details.includes('0 rows')) {
      // 如果是因为没有找到用户，返回undefined
      warn('No user found for email:'+ email);
      return undefined;
    }
    // 如果是其他类型的错误，则抛出异常
    throw error;
  }
  warn('findUserByEmail:'+data);
  // const { rows } = res;
  // const row = rows[0];
  const user: User = {
    email: data.email,
    nickname: data.nickname,
    avatar_url: data.avatar_url,
    created_at: data.created_at,
    uuid: data.uuid,
  };

  return user;
}

export async function findUserByUuid(uuid: string): Promise<User | undefined> {
  const db = getDb();
  // const res = await db.query(`SELECT * FROM users WHERE uuid = $1 LIMIT 1`, [
  //   uuid,
  // ]);
  // if (res.rowCount === 0) {
  //   return undefined;
  // }
  const { data, error } = await db
  .from('users')
  .select('*')
  .eq('uuid', uuid)
  .single();

  warn('findUserByUuid:'+data);
  // const { rows } = res;
  // const row = rows[0];
  const user: User = {
    email: data.email,
    nickname: data.nickname,
    avatar_url: data.avatar_url,
    created_at: data.created_at,
    uuid: data.uuid,
  };

  return user;
}
