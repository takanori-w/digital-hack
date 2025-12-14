'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { validateEmail, validatePassword, validateName, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/validation';
import { useAuthStore } from '@/lib/auth-store';
import { PasswordStrength } from '@/types';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export default function RegisterForm({ onSwitchToLogin, onSuccess }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { setUser, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    if (password) {
      setPasswordStrength(validatePassword(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error!;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error!;
    }

    // Validate password
    if (!passwordStrength?.isValid) {
      newErrors.password = 'より強力なパスワードを設定してください';
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // Validate terms agreement
    if (!agreeToTerms) {
      newErrors.terms = '利用規約に同意してください';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.field) {
          setErrors({ [data.field]: data.error });
        } else {
          setErrors({ general: data.error || '登録に失敗しました' });
        }
        setLoading(false);
        return;
      }

      setUser(data.user);
      onSuccess();
    } catch {
      setErrors({ general: 'ネットワークエラーが発生しました。再度お試しください。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">新規登録</h2>
          <p className="text-gray-600 mt-2">アカウントを作成してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              お名前
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="山田 太郎"
                autoComplete="name"
                disabled={isLoading}
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="example@email.com"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="12文字以上の強力なパスワード"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}

            {/* Password strength indicator */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(passwordStrength.score + 1) * 20}%`,
                        backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: getPasswordStrengthColor(passwordStrength.score) }}
                  >
                    {getPasswordStrengthLabel(passwordStrength.score)}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="space-y-1">
                    {passwordStrength.feedback.map((feedback, i) => (
                      <li key={i} className="flex items-center gap-1 text-xs text-gray-500">
                        <X className="w-3 h-3 text-red-500" />
                        {feedback}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm password field */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（確認）
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="パスワードを再入力"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                パスワードが一致しています
              </p>
            )}
          </div>

          {/* Terms agreement */}
          <div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-600">
                <a href="/terms" className="text-blue-600 hover:text-blue-700">利用規約</a>
                と
                <a href="/privacy" className="text-blue-600 hover:text-blue-700">プライバシーポリシー</a>
                に同意します
              </span>
            </label>
            {errors.terms && <p className="mt-1 text-sm text-red-600">{errors.terms}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                登録中...
              </>
            ) : (
              'アカウントを作成'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            すでにアカウントをお持ちの方は{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ログイン
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
