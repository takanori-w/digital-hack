/**
 * MFA Verification Page
 *
 * Allows users to verify their identity using TOTP or backup code.
 * Required when MFA is enabled but not yet verified in the current session.
 *
 * Security Compliance:
 * - SEC-001: Two-factor authentication
 * - SEC-002: Session security
 */

'use client';

import { useState, FormEvent, useRef, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, Shield, Key, AlertCircle, Loader2 } from 'lucide-react';
import { useCsrf } from '@/components/providers/CsrfProvider';

type VerificationMode = 'totp' | 'backup';

// Loading fallback component
function MfaVerifyLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}

// Main page component wrapped in Suspense for useSearchParams
export default function MfaVerifyPage() {
  return (
    <Suspense fallback={<MfaVerifyLoading />}>
      <MfaVerifyContent />
    </Suspense>
  );
}

function MfaVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const { csrfToken, getCsrfHeaders } = useCsrf();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [mode, setMode] = useState<VerificationMode>('totp');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if not authenticated or MFA not required
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // If MFA is already verified, redirect to callback
      if (session.user.mfaVerified) {
        router.replace(callbackUrl);
        return;
      }

      // If MFA is not enabled, redirect to callback
      if (!session.user.mfaEnabled) {
        router.replace(callbackUrl);
      }
    }
  }, [status, session, router, callbackUrl]);

  // Handle TOTP code input
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleVerify = async (totpCode?: string) => {
    setError('');
    setIsLoading(true);

    const codeToVerify = mode === 'totp' ? (totpCode || code.join('')) : backupCode;

    if (mode === 'totp' && codeToVerify.length !== 6) {
      setError('6桁のコードを入力してください');
      setIsLoading(false);
      return;
    }

    if (mode === 'backup' && !codeToVerify) {
      setError('バックアップコードを入力してください');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({
          token: codeToVerify,
          type: mode === 'backup' ? 'backup' : 'totp',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '認証に失敗しました');
        if (mode === 'totp') {
          setCode(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
        setIsLoading(false);
        return;
      }

      // Refresh session to update mfaVerified status
      await update();

      // Redirect to callback URL
      router.push(callbackUrl);
    } catch (err) {
      console.error('MFA verification error:', err);
      setError('ネットワークエラーが発生しました');
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Compass className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">LifePlan Navigator</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">二要素認証</h2>
              <p className="text-gray-600 mt-2">
                {mode === 'totp'
                  ? '認証アプリに表示されている6桁のコードを入力してください'
                  : 'バックアップコードを入力してください'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {mode === 'totp' ? (
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isLoading}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="backupCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    バックアップコード
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="backupCode"
                      type="text"
                      value={backupCode}
                      onChange={(e) => {
                        setBackupCode(e.target.value);
                        setError('');
                      }}
                      className="block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="XXXX-XXXX"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    確認中...
                  </>
                ) : (
                  '確認する'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'totp' ? 'backup' : 'totp');
                    setError('');
                    setCode(['', '', '', '', '', '']);
                    setBackupCode('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {mode === 'totp'
                    ? 'バックアップコードを使用する'
                    : '認証アプリを使用する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>&copy; 2024 LifePlan Navigator. All rights reserved.</p>
      </footer>
    </div>
  );
}
