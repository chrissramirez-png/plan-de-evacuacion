import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAMBIAR: Nombre App — ComunidadFeliz",
  description: "CAMBIAR: Descripcion de tu app interna de ComunidadFeliz.",
  icons: {
    icon: "/cf-logo-square.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
