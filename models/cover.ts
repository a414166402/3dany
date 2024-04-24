import { QueryResult, QueryResultRow } from "pg";

import { Cover } from "@/types/cover";
import { getDb } from "./db";
import { log, warn, error } from '@/lib/log';

export async function insertCover(cover: Cover) {
  const db = getDb();
  // const res = await db.query(
  //   `INSERT INTO covers 
  //       (user_email, img_description, img_size, img_url, llm_name, llm_params, created_at, uuid, status) 
  //       VALUES 
  //       ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  //   `,
  //   [
  //     cover.user_email,
  //     cover.img_description,
  //     cover.img_size,
  //     cover.img_url,
  //     cover.llm_name,
  //     cover.llm_params,
  //     cover.created_at,
  //     cover.uuid,0
  //   ]
  // );
  const { data, error } = await db
    .from('covers')
    .insert([
      { ...cover }
    ]);

  if (error) {
    throw error;
  }
  return data;
}

export async function getCoversCount(): Promise<number> {
  const db = getDb();
  // const res = await db.query(`SELECT count(1) as count FROM covers`);
  // if (res.rowCount === 0) {
  //   return 0;
  // }

  // const { rows } = res;
  // const row = rows[0];
  const { count, error } = await db
    .from('covers')
    .select('*', { count: 'exact' });

  if (error) {
    throw error;
  }
  return count!;
}

export async function getUserCoversCount(user_email: string): Promise<number> {
  const db = getDb();
  // const res = await db.query(
  //   `SELECT count(1) as count FROM covers WHERE user_email = $1`,
  //   [user_email]
  // );
  // if (res.rowCount === 0) {
  //   return 0;
  // }

  // const { rows } = res;
  // const row = rows[0];
  const { count, error } = await db
    .from('covers')
    .select('*', { count: 'exact' })
    .eq('user_email', user_email);

  if (error) {
    throw error;
  }
  return count!;
}

export async function findCoverById(id: number): Promise<Cover | undefined> {
  const db = getDb();
  // const res = await db.query(
  //   `select w.*, u.uuid as user_uuid, u.email as user_email, u.nickname as user_name, u.avatar_url as user_avatar from covers as w left join users as u on w.user_email = u.email where w.id = $1`,
  //   [id]
  // );
  // if (res.rowCount === 0) {
  //   return;
  // }

  // const cover = formatCover(res.rows[0]);

  // return cover;
    // 第一步：查询封面信息
    let { data: coverData, error: coverError } = await db
    .from('covers')
    .select('*')
    .eq('id', id)
    .single();

    if (coverError || !coverData) {
      error(coverError);
      return undefined;
    }

    // 第二步：使用封面信息中的user_email查询用户信息
    let { data: userData, error: userError } = await db
      .from('users')
      .select('*')
      .eq('email', coverData.user_email)
      .single();

    if (userError) {
      error(userError);
    }

    // 组合封面和用户信息
    const cover = {
      ...coverData,
      created_user: userData ? {
        email: userData.email,
        nickname: userData.nickname,
        avatar_url: userData.avatar_url,
        uuid: userData.uuid,
      } : undefined,
    };

    // 尝试解析llm_params，Supabase通常会自动处理JSON字段，不需要手动解析
    try {
      cover.llm_params = JSON.parse(cover.llm_params);
    } catch (e) {
      log("parse cover llm_params failed: "+ e);
    }

    return cover;
}

export async function findCoverByUuid(
  uuid: string
): Promise<Cover | undefined> {
  const db = getDb();
  // const res = await db.query(
  //   `select w.*, u.uuid as user_uuid, u.email as user_email, u.nickname as user_name, u.avatar_url as user_avatar from covers as w left join users as u on w.user_email = u.email where w.uuid = $1`,
  //   [uuid]
  // );
  // if (res.rowCount === 0) {
  //   return;
  // }

  // const cover = formatCover(res.rows[0]);

  // return cover;
  
  // 第一步：根据UUID查询封面信息
  let { data: coverData, error: coverError } = await db
    .from('covers')
    .select('*')
    .eq('uuid', uuid)
    .single();

  if (coverError || !coverData) {
    error(coverError);
    return undefined;
  }

  // 第二步：使用封面信息中的user_email查询用户信息
  let { data: userData, error: userError } = await db
    .from('users')
    .select('*')
    .eq('email', coverData.user_email)
    .single();

  if (userError) {
    error(userError);
    // 如果没有找到用户信息，仍然返回封面信息但不包含用户信息
  }
  
  // 组合封面和用户信息
  const cover = {
    ...coverData,
    created_user: userData ? {
      email: userData.email,
      nickname: userData.nickname,
      avatar_url: userData.avatar_url,
      uuid: userData.uuid,
    } : undefined,
  };

  // 尝试解析llm_params，Supabase通常会自动处理JSON字段，不需要手动解析
  try {
    cover.llm_params = JSON.parse(cover.llm_params);
  } catch (e) {
    log("parse cover llm_params failed: "+ e);
  }

  return cover;
}

export async function getCovers(page: number, limit: number): Promise<Cover[]> {
  if (page < 1) {
    page = 1;
  }
  if (limit <= 0) {
    limit = 50;
  }
  const offset = (page - 1) * limit;

  const db = getDb();
  // const res = await db.query(
  //   `select w.*, u.uuid as user_uuid, u.email as user_email, u.nickname as user_name, u.avatar_url as user_avatar from covers as w left join users as u on w.user_email = u.email where w.status = 1 order by w.created_at desc limit $1 offset $2`,
  //   [limit, offset]
  // );
  // if (res.rowCount === 0) {
  //   return [];
  // }

  // const covers = getCoversFromSqlResult(res);

  // return covers;

  const { data, error } = await db
    .from('covers')
    .select(`
      id,
      user_email,
      users (
        uuid,
        email,
        nickname,
        avatar_url
      )
    `)
    .eq('status', 1)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    // error('Error fetching covers:'+ error);
    console.error('Error fetching covers:'+ error);
    return [];
  }
  warn("getCovers-data:")
  warn(data)
  const covers = data.map(d => formatCover(d));
  return covers;
}
// 假设 formatCover 函数如下，根据实际情况调整
export function formatCover(data: any): Cover {
  let cover: Cover = {
    id: data.id,
    user_email: data.user_email,
    img_description: data.img_description,
    img_size: data.img_size,
    img_url: data.img_url,
    llm_name: data.llm_name,
    llm_params: data.llm_params,
    created_at: data.created_at,
    uuid: data.uuid,
    status: data.status,
  };

  if (data.users) {
    cover.created_user = {
      email: data.users.email,
      nickname: data.users.nickname,
      avatar_url: data.users.avatar_url,
      uuid: data.users.uuid,
    };
  }
  
  return cover;
}
// export function getCoversFromSqlResult(
//   res: QueryResult<QueryResultRow>
// ): Cover[] {
//   if (!res.rowCount || res.rowCount === 0) {
//     return [];
//   }

//   const covers: Cover[] = [];
//   const { rows } = res;
//   rows.forEach((row) => {
//     const cover = formatCover(row);
//     if (cover) {
//       covers.push(cover);
//     }
//   });

//   return covers;
// }

// export function formatCover(row: QueryResultRow): Cover | undefined {
//   let cover: Cover = {
//     id: row.id,
//     user_email: row.user_email,
//     img_description: row.img_description,
//     img_size: row.img_size,
//     img_url: row.img_url,
//     llm_name: row.llm_name,
//     llm_params: row.llm_params,
//     created_at: row.created_at,
//     uuid: row.uuid,
//     status: row.status,
//   };

//   if (row.user_name || row.user_avatar) {
//     cover.created_user = {
//       email: row.user_email,
//       nickname: row.user_name,
//       avatar_url: row.user_avatar,
//       uuid: row.user_uuid,
//     };
//   }

//   try {
//     cover.llm_params = JSON.parse(JSON.stringify(cover.llm_params));
//   } catch (e) {
//     log("parse cover llm_params failed: " e);
//   }

//   return cover;
// }
