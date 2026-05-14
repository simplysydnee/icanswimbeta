import type { Metadata } from "next";
import { Montserrat, Quicksand } from "next/font/google";
import "../globals.css";

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
  title: "Preview Mode - I Can Swim",
  description: "Preview mode for testing UI changes",
};

// This is a completely isolated layout for the preview route group
// It does NOT use AuthProvider to avoid the refresh loop issue
export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${quicksand.variable} antialiased bg-gray-50`}>
        <div className="p-4">
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800">
            <strong>Preview Mode</strong> - No authentication required. This page demonstrates the refactored UI spacing.
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
