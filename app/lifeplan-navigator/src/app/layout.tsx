import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AbilityProvider } from '@/lib/authorization';
import { CsrfProvider } from '@/components/providers/CsrfProvider';
import { DisclaimerFooter } from '@/components/common/DisclaimerFooter';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LifePlan Navigator - あなたの人生設計をサポート',
  description: '補助金・税制優遇・お得情報を一元管理。ライフステージに応じた最適なアクションを提案します。',
};

/**
 * Root Layout
 *
 * Provider hierarchy:
 * 1. AuthProvider (NextAuth.js SessionProvider) - handles authentication state
 * 2. AbilityProvider (CASL) - provides authorization context based on user role
 * 3. CsrfProvider - provides CSRF token for API requests
 *
 * Security Compliance:
 * - SEC-001: Session-based authentication via NextAuth.js
 * - SEC-002: RBAC via CASL AbilityProvider
 *
 * Legal Compliance:
 * - APP-017: Global DisclaimerFooter for legal compliance (Auditor directive)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <AbilityProvider>
            <CsrfProvider>
              <main className="flex-grow">{children}</main>
              <DisclaimerFooter compact />
            </CsrfProvider>
          </AbilityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
