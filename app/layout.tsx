import "./globals.css";
import Script from 'next/script';
import { Toaster, toast } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Suspense } from "react";
import GTMAnalytics from "@/components/GTMAnalytics";
import GoogleAnalytics from '@/components/googleAnalytics';
// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_WEB_TITLE+" ｜ "+process.env.NEXT_PUBLIC_WEB_NAME,
  description:
    process.env.NEXT_PUBLIC_WEB_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <GoogleAnalytics />
        <Script src="https://us.umami.is/script.js" data-website-id={process.env.NEXT_PUBLIC_UMAMI_KEY}></Script>
        <body className={inter.className}>
          <Suspense>
            <GTMAnalytics />
          </Suspense>
          
          <Script
            src="/enable-threads.js"
          />
          <Toaster position="top-center" richColors />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
