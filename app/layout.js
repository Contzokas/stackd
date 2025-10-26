import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import OfflineIndicator from "@/components/OfflineIndicator";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Stackd - Offline-First Task Management",
  description: "Modern, offline-first task management with free-form drag-and-drop columns. Work seamlessly online or offline with automatic sync. Built with Next.js and Supabase.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stackd",
  },
  openGraph: {
    title: "Stackd - Offline-First Task Management",
    description: "Modern, offline-first task management with free-form drag-and-drop columns. Work seamlessly online or offline with automatic sync.",
    url: "https://stackd.vercel.app", // Update with your actual deployment URL
    siteName: "Stackd",
    images: [
      {
        url: "/Stackd.png",
        width: 1200,
        height: 630,
        alt: "Stackd - Offline-First Task Management Application",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stackd - Offline-First Task Management",
    description: "Modern, offline-first task management with free-form drag-and-drop columns. Work seamlessly online or offline with automatic sync.",
    creator: "@Tziogadoros",
    images: ["/Stackd.png"],
  },
  icons: {
    icon: "/Stackd.png",
    apple: "/Stackd.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#2563eb" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <OfflineIndicator />
        </body>
      </html>
    </ClerkProvider>
  );
}
