import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bald Ben",
  description: "Created by Rohit Dasgupta",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Bald Ben",
    description: "Created by Rohit Dasgupta",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "Bald Ben Preview",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
