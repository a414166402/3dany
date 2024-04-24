import { findUserByEmail, insertUser } from "@/models/user";

import { User } from "@/types/user";
import { log, warn, error } from '@/lib/log';

export async function saveUser(user: User) {
  try {
    const existUser = await findUserByEmail(user.email);
    if (!existUser) {
      await insertUser(user);
    }
  } catch (e) {
    log("save user failed: "+ e);
  }
}
