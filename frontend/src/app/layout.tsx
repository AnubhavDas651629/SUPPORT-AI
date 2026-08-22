import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { GoogleAuthProvider } from "@/components/auth/GoogleAuthProvider";

const inter = Inter({ subsets: ["latin"] });

// Only the public surface uses `font-code`; the variable is declared here so
// the class is available wherever it appears.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-code",
  display: "swap",
});

export const metadata: Metadata = {
  // A plain default rather than a template: the dashboard layout sets its own
  // full title ("Command Center | Support AI"), and a template would append a
  // second suffix to it.
  title: "Support-AI — From question to resolution",
  description:
    "Support-AI connects your documentation, customer data and live APIs to investigate issues, take action and resolve requests without the back-and-forth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${mono.variable} antialiased text-slate-900 bg-[#F8FAFC] dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GoogleAuthProvider>
            <AuthProvider>{children}</AuthProvider>
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
