/**
 * CASL Authorization Context
 *
 * Provides React context for CASL abilities.
 * Integrates with NextAuth.js session.
 *
 * Usage:
 * 1. Wrap app with <AbilityProvider>
 * 2. Use useAbility() hook in components
 * 3. Use <Can> component for conditional rendering
 */

'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { createContextualCan } from '@casl/react';
import {
  AppAbility,
  defineAbilityFor,
  AbilityUser,
} from './abilities';
import { Role } from '@/lib/auth/config';

// Create ability context with a default empty ability
const AbilityContext = createContext<AppAbility | null>(null);

// Create Can component from context (with type assertion for CASL compatibility)
export const Can = createContextualCan(AbilityContext.Consumer as any);

interface AbilityProviderProps {
  children: ReactNode;
}

/**
 * Ability Provider Component
 *
 * Wraps the application and provides CASL abilities based on user session.
 */
export function AbilityProvider({ children }: AbilityProviderProps) {
  const { data: session, status } = useSession();

  // Create ability based on current user
  const ability = useMemo(() => {
    if (status === 'loading') {
      // Return empty ability while loading
      return defineAbilityFor({ id: '', role: Role.USER });
    }

    if (!session?.user) {
      // Return anonymous user ability (no permissions)
      return defineAbilityFor({ id: '', role: Role.USER });
    }

    const user: AbilityUser = {
      id: session.user.id,
      role: session.user.role || Role.USER,
    };

    return defineAbilityFor(user);
  }, [session, status]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}

/**
 * Hook to access CASL ability
 *
 * @returns AppAbility instance
 * @throws Error if used outside AbilityProvider
 */
export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext);

  if (!ability) {
    throw new Error('useAbility must be used within AbilityProvider');
  }

  return ability;
}

/**
 * Hook to check if user can perform action
 *
 * @param action - Action to check
 * @param subject - Resource to check against
 * @returns boolean
 */
export function useCanPerform<S>(action: string, subject: S): boolean {
  const ability = useAbility();
  return ability.can(action as any, subject as any);
}
