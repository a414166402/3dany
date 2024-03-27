# 3D Any

使用 AI 技术将视频转换成3D立体视频

## 在线演示

[https://3dany.com](https://3dany.com)

![demo](./preview.png)

## 快速开始

1. 克隆项目

```shell
git clone https://github.com/a414166402/3dany
```

2. 安装依赖

```shell
cd 3dany
pnpm install
```

3. 初始化数据库

使用本地数据库： [local postgres](https://wiki.postgresql.org/wiki/Homebrew)

或者使用在线数据库： [vercel-postgres](https://vercel.com/docs/storage/vercel-postgres)

或者使用在线数据库： [supabase](https://supabase.com/)

在 `data/install.sql` 文件中复制创建数据库用到的 sql

4. 设置环境变量

在 `3dany` 项目根目录下创建一个 `.env.local` 文件，填入如下的配置内容：

```
OPENAI_API_KEY=""

POSTGRES_URL=""

AWS_AK=""
OPENAI_API_KEY=""

POSTGRES_URL=""

AWS_AK=""
AWS_SK=""
AWS_REGION=""
AWS_BUCKET=""

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

STRIPE_PUBLIC_KEY=""
STRIPE_PRIVATE_KEY=""

WEB_BASE_URI=""
```

5. local development

```shell
pnpm dev
```

open `http://localhost:3000` for preview

## Credit to

- [aiwallpaper](https://aiwallpaper.shop) for code reference
- [nextjs](https://nextjs.org/docs) for full-stack development
- [clerk](https://clerk.com/docs/quickstarts/nextjs) for user auth
- [aws s3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html) for image storage
- [stripe](https://stripe.com/docs/development) for payment
- [node-postgres](https://node-postgres.com/) for data processing
- [tailwindcss](https://tailwindcss.com/) for page building



AWS_SK=""
AWS_REGION=""
AWS_BUCKET=""

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

STRIPE_PUBLIC_KEY=""
STRIPE_PRIVATE_KEY=""

WEB_BASE_URI=""
```

5. 本地开发

```shell
pnpm dev
```

打开 `http://localhost:3000` 预览并调试

## 感谢以下项目

- [nextjs](https://nextjs.org/docs) 全栈开发框架
- [clerk](https://clerk.com/docs/quickstarts/nextjs) 用户鉴权
- [aws s3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html) 图片存储
- [stripe](https://stripe.com/docs/development) 支付
- [node-postgres](https://node-postgres.com/) 数据处理库
- [tailwindcss](https://tailwindcss.com/) 快速实现页面样式
