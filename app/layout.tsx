import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bald Ben",
  description: "Created by Rohit Dasgupta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/Comic Sans MS.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
