// components/GoogleAnalytics.tsx
'use client';

import Script from 'next/script'
import {usePathname, useSearchParams} from 'next/navigation'
import { useEffect } from "react";
import {pageview} from "@/components/utils/gtagHelper"

export default function googleAnalytics(){
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

    useEffect(() => {
        const url = pathname + searchParams.toString()
    
        pageview(GA_MEASUREMENT_ID, url);
        
    }, [pathname, searchParams, GA_MEASUREMENT_ID]);
    return (
        <>
            <Script strategy="afterInteractive" 
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} defer />
            <Script id='google-analytics' strategy="afterInteractive" defer 
                dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('consent', 'default', {
                    'analytics_storage': 'denied'
                });
                
                gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                });
                `,
                }}
            />
        </>
)}