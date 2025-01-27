// import { NextResponse } from "next/server";
// import { authMiddleware } from "@clerk/nextjs";

// export default authMiddleware({
//   publicRoutes: ["/", "/pricing", "/api/get-user-info"],

//   afterAuth(auth, req, evt) {
//     if (!auth.userId && !auth.isPublicRoute) {
//       if (auth.isApiRoute) {
//         return NextResponse.json(
//           { code: -2, message: "no auth" },
//           { status: 401 }
//         );
//       } else {
//         return NextResponse.redirect(new URL("/sign-in", req.url));
//       }
//     }

//     return NextResponse.next();
//   },
// });

import { withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server'

export default withClerkMiddleware((req: NextRequest) => {
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api)(.*)"],
};
