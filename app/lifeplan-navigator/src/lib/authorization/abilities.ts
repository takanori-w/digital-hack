/**
 * CASL Authorization - Ability Definitions
 *
 * Implements Role-Based Access Control (RBAC) with object-level authorization.
 *
 * Security Compliance:
 * - SEC-001: Object-level authorization (IDOR prevention)
 * - SEC-002: RBAC implementation
 * - CISO Design: CASL isomorphic authorization
 *
 * Resources:
 * - Profile: User profile data
 * - FinancialData: Income, assets, debts
 * - Settings: User preferences
 * - AuditLog: Security audit trails
 */

import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Role } from '@/lib/auth/config';

// Define subjects (resources)
export type Profile = {
  kind: 'Profile';
  id: string;
  userId: string;
};

export type FinancialData = {
  kind: 'FinancialData';
  id: string;
  userId: string;
  sharedWith?: { userId: string; permission: 'read' | 'write' }[];
};

export type Settings = {
  kind: 'Settings';
  id: string;
  userId: string;
};

export type AuditLog = {
  kind: 'AuditLog';
  id: string;
};

export type Notification = {
  kind: 'Notification';
  id: string;
  userId: string;
};

// All subjects (using string literals for CASL compatibility)
export type Subjects =
  | 'Profile'
  | 'FinancialData'
  | 'Settings'
  | 'AuditLog'
  | 'Notification'
  | 'all';

// All actions
export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';

// Ability type
export type AppAbility = MongoAbility<[Actions, Subjects]>;

// User interface for ability definition
export interface AbilityUser {
  id: string;
  role: Role;
}

/**
 * Define abilities based on user role and ownership
 *
 * Follows principle of least privilege:
 * - Users can only access their own data
 * - Shared data has explicit permissions
 * - Admins have limited access with PII masking
 */
export function defineAbilityFor(user: AbilityUser): AppAbility {
  // Using 'any' type for the builder to bypass strict CASL type checking
  // while maintaining runtime functionality
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility) as any;

  switch (user.role) {
    case Role.USER:
      // Profile operations - own data only
      can('read', 'Profile', { userId: user.id });
      can('update', 'Profile', { userId: user.id });
      can('delete', 'Profile', { userId: user.id });

      // Financial data - own data only
      can('create', 'FinancialData', { userId: user.id });
      can('read', 'FinancialData', { userId: user.id });
      can('update', 'FinancialData', { userId: user.id });
      can('delete', 'FinancialData', { userId: user.id });

      // Financial data - shared with user (read-only by default)
      can('read', 'FinancialData', {
        'sharedWith.userId': user.id,
        'sharedWith.permission': 'read',
      });

      // Financial data - shared with write permission
      can(['read', 'update'], 'FinancialData', {
        'sharedWith.userId': user.id,
        'sharedWith.permission': 'write',
      });

      // Settings - own only
      can('read', 'Settings', { userId: user.id });
      can('update', 'Settings', { userId: user.id });

      // Notifications - own only
      can('read', 'Notification', { userId: user.id });
      can('update', 'Notification', { userId: user.id });
      can('delete', 'Notification', { userId: user.id });
      break;

    case Role.FAMILY_MEMBER:
      // Limited access to shared data only
      can('read', 'FinancialData', {
        'sharedWith.userId': user.id,
      });

      // Own profile only
      can('read', 'Profile', { userId: user.id });
      can('update', 'Profile', { userId: user.id });
      break;

    case Role.SUPPORT:
      // Read-only access to profiles (PII masked at API level)
      can('read', 'Profile');

      // Cannot read financial data
      cannot('read', 'FinancialData');

      // Cannot modify anything
      cannot(['create', 'update', 'delete'], 'all');
      break;

    case Role.ADMIN:
      // Read access to profiles
      can('read', 'Profile');

      // Read financial data (values masked at API level)
      can('read', 'FinancialData');

      // Can manage users (not implemented as subject here)
      can('read', 'AuditLog');

      // Cannot modify user data directly
      cannot(['create', 'update', 'delete'], ['Profile', 'FinancialData']);
      break;

    case Role.SUPER_ADMIN:
      // Full access to everything
      can('manage', 'all');

      // Audit logs are append-only (no delete)
      cannot('delete', 'AuditLog');
      break;

    default:
      // No permissions for unknown roles
      break;
  }

  return build();
}

/**
 * Check if user can perform action on resource
 *
 * @param user - Current user
 * @param action - Action to perform
 * @param subject - Resource to access
 * @returns boolean - Whether action is allowed
 */
export function checkAbility<T extends Subjects>(
  user: AbilityUser,
  action: Actions,
  subject: T
): boolean {
  const ability = defineAbilityFor(user);
  return ability.can(action, subject);
}

/**
 * Create ability instance for a user
 *
 * Use this in components with @casl/react
 */
export function createAbilityForUser(user: AbilityUser): AppAbility {
  return defineAbilityFor(user);
}
