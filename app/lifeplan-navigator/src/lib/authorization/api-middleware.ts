/**
 * Authorization API Middleware
 *
 * Provides authorization checks for API routes.
 * Integrates with NextAuth.js session and CASL abilities.
 *
 * Security Compliance:
 * - SEC-001: Object-level authorization
 * - SEC-002: RBAC enforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAbility, Subjects, Actions, AbilityUser } from './abilities';
import { Role } from '@/lib/auth/config';

/**
 * Result of authorization check
 */
export interface AuthorizationResult {
  authorized: boolean;
  user?: AbilityUser;
  error?: string;
  statusCode?: number;
}

/**
 * Check if request is authorized
 *
 * @param request - Next.js request
 * @returns AuthorizationResult
 */
export async function checkAuthorization(
  request: NextRequest
): Promise<AuthorizationResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      error: '認証が必要です',
      statusCode: 401,
    };
  }

  const user: AbilityUser = {
    id: session.user.id,
    role: session.user.role || Role.USER,
  };

  return {
    authorized: true,
    user,
  };
}

/**
 * Check if user can perform action on resource
 *
 * @param user - Current user
 * @param action - Action to perform
 * @param subject - Resource with ownership info
 * @returns AuthorizationResult
 */
export function checkResourceAccess<T extends Subjects>(
  user: AbilityUser,
  action: Actions,
  subject: T
): AuthorizationResult {
  const isAllowed = checkAbility(user, action, subject);

  if (!isAllowed) {
    return {
      authorized: false,
      error: 'この操作を実行する権限がありません',
      statusCode: 403,
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Create error response for unauthorized access
 */
export function unauthorizedResponse(result: AuthorizationResult): NextResponse {
  return NextResponse.json(
    { error: result.error || 'アクセスが拒否されました' },
    { status: result.statusCode || 403 }
  );
}

/**
 * Higher-order function to wrap API handlers with authorization
 *
 * Usage:
 * export const GET = withAuthorization(async (request, user) => {
 *   // user is guaranteed to be authenticated
 *   return NextResponse.json({ data });
 * });
 */
export function withAuthorization(
  handler: (request: NextRequest, user: AbilityUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await checkAuthorization(request);

    if (!result.authorized || !result.user) {
      return unauthorizedResponse(result);
    }

    return handler(request, result.user);
  };
}

/**
 * Higher-order function to wrap API handlers with resource-level authorization
 *
 * Usage:
 * export const GET = withResourceAccess(
 *   'read',
 *   async (request, user) => {
 *     const resource = await getResource(params.id);
 *     return { kind: 'FinancialData', id: resource.id, userId: resource.userId };
 *   },
 *   async (request, user, resource) => {
 *     return NextResponse.json(resource);
 *   }
 * );
 */
export function withResourceAccess<T extends Subjects>(
  action: Actions,
  getSubject: (request: NextRequest, user: AbilityUser) => Promise<T>,
  handler: (request: NextRequest, user: AbilityUser, subject: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // First check authentication
    const authResult = await checkAuthorization(request);

    if (!authResult.authorized || !authResult.user) {
      return unauthorizedResponse(authResult);
    }

    // Get the subject/resource
    const subject = await getSubject(request, authResult.user);

    // Check resource-level access
    const accessResult = checkResourceAccess(authResult.user, action, subject);

    if (!accessResult.authorized) {
      return unauthorizedResponse(accessResult);
    }

    // Execute handler
    return handler(request, authResult.user, subject);
  };
}

/**
 * Check if user is the owner of a resource
 *
 * @param userId - Current user ID
 * @param resourceOwnerId - Owner ID of the resource
 * @returns boolean
 */
export function isResourceOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Require MFA verification for sensitive operations
 */
export async function requireMfaVerification(
  request: NextRequest
): Promise<AuthorizationResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      error: '認証が必要です',
      statusCode: 401,
    };
  }

  // Check if MFA is enabled and verified
  if (session.user.mfaEnabled && !session.user.mfaVerified) {
    return {
      authorized: false,
      error: 'MFA認証が必要です',
      statusCode: 403,
    };
  }

  return {
    authorized: true,
    user: {
      id: session.user.id,
      role: session.user.role || Role.USER,
    },
  };
}
