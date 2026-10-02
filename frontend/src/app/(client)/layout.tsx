import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import './globals.css';
import { QueryProvider } from '@/components/common/QueryProvider';
import { RegularAuthProvider } from '@/context/RegularAuthContext';
import { HeroProviders } from '@/components/common/HeroProviders';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mawami",
  description: "Matrimony - Your Story Begins Here",
  openGraph: {
    title: "Mawami",
    description: "Matrimony - Your Story Begins Here",
    siteName: "Mawami",
    url: 'https://mawami.com',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://mawami.com/images/logo/logo-square.jpeg',
        secureUrl: 'https://mawami.com/images/logo/logo-square.jpeg',
        width: 100,
        height: 100,
        alt: 'Mawami Logo',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Mawami',
    description: 'Matrimony - Your Story Begins Here',
    images: ['https://mawami.com/images/logo/logo-square.jpeg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className='min-h-screen bg-gray-50'>
        <HeroProviders>
          <QueryProvider>
            <RegularAuthProvider>
              <Header />
              {children}
              <Footer />
            </RegularAuthProvider>
          </QueryProvider>
        </HeroProviders>
      </body>
    </html>
  );
}
