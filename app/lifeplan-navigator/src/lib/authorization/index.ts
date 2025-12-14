/**
 * Authorization Module Exports
 *
 * Provides RBAC and object-level authorization using CASL.
 *
 * Security Compliance:
 * - SEC-001: Object-level authorization (IDOR prevention)
 * - SEC-002: Role-based access control (RBAC)
 */

// Re-export types and functions from abilities
export {
  type Profile,
  type FinancialData,
  type Settings,
  type AuditLog,
  type Notification,
  type Subjects,
  type Actions,
  type AppAbility,
  type AbilityUser,
  defineAbilityFor,
  checkAbility,
  createAbilityForUser,
} from './abilities';

// Re-export context components
export {
  AbilityProvider,
  Can,
  useAbility,
  useCanPerform,
} from './context';

// Re-export API middleware
export {
  type AuthorizationResult,
  checkAuthorization,
  checkResourceAccess,
  unauthorizedResponse,
  withAuthorization,
  withResourceAccess,
  isResourceOwner,
  requireMfaVerification,
} from './api-middleware';
