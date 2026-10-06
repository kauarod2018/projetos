import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vemo | Sua secretária digital",
  description: "Clientes, agenda, orçamentos e financeiro para quem trabalha por conta própria.",
  icons: {
    icon: "/vemo-mark.png",
    shortcut: "/vemo-mark.png",
    apple: "/vemo-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <a className="skip-link" href="#main-content">
          Ir para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
