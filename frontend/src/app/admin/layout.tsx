import { Outfit } from 'next/font/google';
import type { Metadata } from 'next';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import {AppLayoutContent} from '@/components/layout/AppLayoutContent';
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminGuard } from '@/components/AdminGuard'
import { HeroProviders } from '@/components/common/HeroProviders';



import './globals.css';

const outfit = Outfit({
  subsets: ["latin"],
   display: "swap",
});

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
        alt: 'Mawami',
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body className={`${outfit.className} bg-white-100 dark:bg-gray-900`} >
        <AuthProvider>
          <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
            <AdminGuard>
              <ThemeProvider>
                <SidebarProvider>
                  <HeroProviders>
                    <AppLayoutContent>{children}</AppLayoutContent>
                  </HeroProviders>
                </SidebarProvider>
              </ThemeProvider>
            </AdminGuard>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}

