'use client';

import { useState } from 'react';
import { Compass } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onSuccess: () => void;
}

export default function AuthPage({ initialMode = 'login', onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

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
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setMode('register')}
              onSuccess={onSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setMode('login')}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>&copy; 2024 LifePlan Navigator. All rights reserved.</p>
      </footer>
    </div>
  );
}
