import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Quizz Challenge",
  description: "Quiz de géographie WQC avec entraînement, niveaux, challenges et défis entre amis.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
