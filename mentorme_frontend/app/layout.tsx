import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import './globals.css';
import { UISettingsProvider } from '@/components/ui-settings-context';

import { Geist as V0_Font_Geist, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _geist = V0_Font_Geist({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: 'Mentor Me - Tutor Marketplace',
  description: 'Connect with expert tutors for personalized learning',
  generator: 'v0.app',
  icons: {
    icon: '/mentorme_logo.png',
    shortcut: '/mentorme_logo.png',
    apple: '/mentorme_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <UISettingsProvider>{children}</UISettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
