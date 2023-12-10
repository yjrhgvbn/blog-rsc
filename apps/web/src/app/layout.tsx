import "./globals.css";
import "@repo/ui/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SandPackCSS } from "components/sandpack-styles";
import { MainNav } from "components/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "blog",
  description: "PalmPam blog",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head>
        {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/qtcreator-light.min.css" /> */}
        <SandPackCSS />
      </head>
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <MainNav />
          <main className="py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
