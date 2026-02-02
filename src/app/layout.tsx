import type { Metadata, Viewport } from "next";
import { Montserrat, Quicksand } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Footer } from "@/components/layout/footer";
import { APP_CONFIG } from "@/lib/constants";
import { Providers } from "./providers";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: ["swim lessons", "adaptive swimming", "special needs swimming", "funded swimming", "regional centers", "Modesto", "I Can Swim"],
  authors: [{ name: APP_CONFIG.owner }],
  creator: APP_CONFIG.owner,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_CONFIG.url,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    creator: "@icanswim209",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${quicksand.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <EditModeProvider>
              <NavigationProvider>
              <ToastProvider>
                <Providers>
                  <div className="relative flex min-h-screen flex-col">
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </Providers>
              </ToastProvider>
            </NavigationProvider>
            </EditModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
