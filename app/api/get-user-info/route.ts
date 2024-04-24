import { findUserByEmail, insertUser } from "@/models/user";
import { respData, respErr } from "@/lib/resp";

import { User } from "@/types/user";
import { currentUser } from "@clerk/nextjs";
import { genUuid } from "@/lib";
import { getUserCredits } from "@/services/order";

import { log, warn, error } from '@/lib/log';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return respErr("not login");
  }

  try {
    const email = user.emailAddresses[0].emailAddress;
    const nickname = user.firstName;
    const avatarUrl = user.imageUrl;
    warn("user:")
    warn(user)
    let userInfo: User = {
      email: email,
      nickname: nickname || "",
      avatar_url: avatarUrl,
      uuid: genUuid(),
    };
    const existUser = await findUserByEmail(email);
    warn("existUser:"+existUser)
    if (existUser) {
      userInfo.uuid = existUser.uuid;
    } else {
      await insertUser(userInfo);
    }

    const user_credits = await getUserCredits(email);
    warn('user_credits:')
    warn(user_credits)
    userInfo.credits = user_credits;

    return respData(userInfo);
  } catch (e) {
    log("get user info failed:");
    log(e);
    return respErr("get user info failed");
  }
}
