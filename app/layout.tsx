import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flower - Parenting Community Platform",
  description: "A community platform for parents with intuitive iPod-style navigation",
  keywords: ["parenting", "community", "childcare", "family", "support"],
  authors: [{ name: "Flower Team" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Flower",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#4ade80" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body 
        className={`${inter.className} antialiased bg-gray-50 text-gray-900`}
        style={{
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'auto',
          height: '100dvh',
        }}
      >
        <div 
          id="__next"
          style={{
            minHeight: '100dvh',
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            overscrollBehavior: 'none',
            WebkitOverflowScrolling: 'auto',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
