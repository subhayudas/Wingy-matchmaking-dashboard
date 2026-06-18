import type { Metadata } from "next";
import { Cormorant_Garamond, Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "./components/Nav";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const editorial = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
});
const body = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Wingy · Matchmaking Studio",
  description: "Mutual best-match engine — compatibility, reasoning, and the people behind the matches.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${editorial.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Nav />
        <main className="mx-auto max-w-[1320px] px-5 pb-32 pt-6 md:px-8">{children}</main>
      </body>
    </html>
  );
}
