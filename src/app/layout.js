import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from '@/components/common/ErrorBoundary';
// import SessionProviderWrapper from '@/components/common/SessionProviderWrapper'; // Removed
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sistem Akademik SIAS",
  description: "Sistem informasi akademik terpadu SIAS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          {children}
          <Toaster position="top-right" />
        </ErrorBoundary>
      </body>
    </html>
  );
}
