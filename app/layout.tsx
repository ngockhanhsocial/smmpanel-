import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'SMM Panel Việt Nam - Hệ thống SMM chuyên nghiệp',
  description: 'Cung cấp dịch vụ tăng tương tác mạng xã hội uy tín, giá rẻ.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-zinc-50 text-zinc-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
