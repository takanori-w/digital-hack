/**
 * 監査ログミドルウェア
 * リクエスト/レスポンスから監査情報を自動抽出
 */

import { auditLogService } from './audit-service';
import {
  AuditActor,
  AuditRequest,
  AuditResponse,
  AuditTarget,
  AuditEventType,
} from '@/types/audit';

// UUID生成
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * リクエストからアクター情報を抽出
 */
export function extractActorFromRequest(req: Request): Partial<AuditActor> {
  const headers = req.headers;
  const userId = headers.get('x-user-id') || undefined;
  const username = headers.get('x-username') || undefined;
  const sessionId = headers.get('x-session-id') || undefined;

  // IPアドレスの取得（プロキシ対応）
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || '0.0.0.0';

  const userAgent = headers.get('user-agent') || 'unknown';

  return {
    type: userId ? 'user' : 'anonymous',
    userId,
    username,
    sessionId,
    ipAddress,
    userAgent,
  };
}

/**
 * リクエスト情報の抽出
 */
export function extractRequestInfo(req: Request, requestId?: string): Partial<AuditRequest> {
  const url = new URL(req.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  return {
    id: requestId || generateUUID(),
    method: req.method,
    path: url.pathname,
    query: Object.keys(query).length > 0 ? query : undefined,
    contentType: req.headers.get('content-type') || undefined,
    contentLength: parseInt(req.headers.get('content-length') || '0', 10) || undefined,
    headers: headersObj,
  };
}

/**
 * レスポンス情報の作成
 */
export function createResponseInfo(
  statusCode: number,
  startTime: number,
  options?: {
    errorCode?: string;
    errorMessage?: string;
    dataSize?: number;
  }
): Partial<AuditResponse> {
  return {
    statusCode,
    success: statusCode >= 200 && statusCode < 400,
    errorCode: options?.errorCode,
    errorMessage: options?.errorMessage,
    duration: Date.now() - startTime,
    dataSize: options?.dataSize,
  };
}

/**
 * ターゲット情報の作成ヘルパー
 */
export function createTargetInfo(
  type: string,
  id: string,
  options?: {
    name?: string;
    ownerId?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    affectedFields?: string[];
  }
): Partial<AuditTarget> {
  return {
    type,
    id,
    name: options?.name,
    ownerId: options?.ownerId,
    previousState: options?.previousState,
    newState: options?.newState,
    affectedFields: options?.affectedFields,
  };
}

/**
 * 監査ログミドルウェアオプション
 */
export interface AuditMiddlewareOptions {
  eventCode: string;
  eventType?: AuditEventType;
  extractTarget?: (req: Request, body?: unknown) => Partial<AuditTarget>;
  extractMetadata?: (req: Request, body?: unknown) => Record<string, unknown>;
  skipOnSuccess?: boolean;
  skipOnFailure?: boolean;
}

/**
 * 監査ログ付きAPIハンドラのラッパー
 * Next.js App Router 用
 */
export function withAuditLog<T>(
  options: AuditMiddlewareOptions,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const requestId = generateUUID();
    const startTime = Date.now();

    const actor = extractActorFromRequest(req);
    const request = extractRequestInfo(req, requestId);

    let body: unknown;
    try {
      const clonedReq = req.clone();
      body = await clonedReq.json().catch(() => undefined);
    } catch {
      body = undefined;
    }

    const target = options.extractTarget?.(req, body);
    const metadata = options.extractMetadata?.(req, body);

    try {
      const response = await handler(req);
      const responseInfo = createResponseInfo(response.status, startTime);

      // 成功時のスキップ判定
      if (options.skipOnSuccess && response.ok) {
        return response;
      }

      // イベントタイプに応じたログ記録
      await logByEventType(
        options.eventType || 'DATA',
        options.eventCode,
        actor,
        target || {},
        { ...request, body: body as Record<string, unknown> },
        responseInfo,
        metadata
      );

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseInfo = createResponseInfo(500, startTime, {
        errorCode: 'INTERNAL_ERROR',
        errorMessage,
      });

      // 失敗時のスキップ判定
      if (!options.skipOnFailure) {
        await logByEventType(
          options.eventType || 'DATA',
          options.eventCode,
          actor,
          target || {},
          { ...request, body: body as Record<string, unknown> },
          responseInfo,
          { ...metadata, error: errorMessage }
        );
      }

      throw error;
    }
  };
}

/**
 * イベントタイプに応じたログ記録
 */
async function logByEventType(
  eventType: AuditEventType,
  eventCode: string,
  actor: Partial<AuditActor>,
  target: Partial<AuditTarget>,
  request: Partial<AuditRequest>,
  response: Partial<AuditResponse>,
  metadata?: Record<string, unknown>
): Promise<void> {
  switch (eventType) {
    case 'AUTH':
      await auditLogService.logAuthentication(eventCode, actor, request, response, metadata);
      break;
    case 'DATA':
      await auditLogService.logDataAccess(eventCode, actor, target, request, response, metadata);
      break;
    case 'ADMIN':
      await auditLogService.logAdminAction(eventCode, actor, target, request, response, metadata);
      break;
    case 'SYS':
      await auditLogService.logSystemEvent(eventCode, request, response, metadata);
      break;
    default:
      await auditLogService.logDataAccess(eventCode, actor, target, request, response, metadata);
  }
}

/**
 * 手動で監査ログを記録するヘルパー
 */
export const auditLog = {
  /**
   * ログイン成功
   */
  async loginSuccess(
    userId: string,
    username: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await auditLogService.logAuthentication(
      'AUTH_LOGIN_SUCCESS',
      { type: 'user', userId, username, email, ipAddress, userAgent },
      { id: generateUUID(), method: 'POST', path: '/api/auth/login' },
      { statusCode: 200, success: true, duration: 0 },
      metadata
    );
  },

  /**
   * ログイン失敗
   */
  async loginFailure(
    attemptedEmail: string,
    ipAddress: string,
    userAgent: string,
    reason: string
  ): Promise<void> {
    await auditLogService.logAuthentication(
      'AUTH_LOGIN_FAILURE',
      { type: 'anonymous', email: attemptedEmail, ipAddress, userAgent },
      { id: generateUUID(), method: 'POST', path: '/api/auth/login' },
      { statusCode: 401, success: false, errorCode: 'AUTH_FAILED', errorMessage: reason, duration: 0 },
      { attemptedEmail, failureReason: reason }
    );
  },

  /**
   * ログアウト
   */
  async logout(userId: string, username: string, ipAddress: string): Promise<void> {
    await auditLogService.logAuthentication(
      'AUTH_LOGOUT',
      { type: 'user', userId, username, ipAddress, userAgent: '' },
      { id: generateUUID(), method: 'POST', path: '/api/auth/logout' },
      { statusCode: 200, success: true, duration: 0 }
    );
  },

  /**
   * プロファイル閲覧
   */
  async profileView(
    actorUserId: string,
    targetUserId: string,
    ipAddress: string
  ): Promise<void> {
    await auditLogService.logDataAccess(
      'DATA_USER_PROFILE_VIEW',
      { type: 'user', userId: actorUserId, ipAddress, userAgent: '' },
      { type: 'user_profile', id: targetUserId, ownerId: targetUserId },
      { id: generateUUID(), method: 'GET', path: `/api/users/${targetUserId}` },
      { statusCode: 200, success: true, duration: 0 }
    );
  },

  /**
   * プロファイル更新
   */
  async profileUpdate(
    actorUserId: string,
    targetUserId: string,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
    ipAddress: string
  ): Promise<void> {
    await auditLogService.logDataModification(
      'DATA_USER_PROFILE_UPDATE',
      { type: 'user', userId: actorUserId, ipAddress, userAgent: '' },
      { type: 'user_profile', id: targetUserId, ownerId: targetUserId },
      previousState,
      newState,
      { id: generateUUID(), method: 'PUT', path: `/api/users/${targetUserId}` },
      { statusCode: 200, success: true, duration: 0 }
    );
  },

  /**
   * ライフプラン作成
   */
  async lifeplanCreate(
    userId: string,
    lifeplanId: string,
    ipAddress: string
  ): Promise<void> {
    await auditLogService.logDataAccess(
      'DATA_LIFEPLAN_CREATE',
      { type: 'user', userId, ipAddress, userAgent: '' },
      { type: 'lifeplan', id: lifeplanId, ownerId: userId },
      { id: generateUUID(), method: 'POST', path: '/api/lifeplans' },
      { statusCode: 201, success: true, duration: 0 }
    );
  },

  /**
   * ライフプラン閲覧
   */
  async lifeplanView(
    userId: string,
    lifeplanId: string,
    ownerId: string,
    ipAddress: string
  ): Promise<void> {
    await auditLogService.logDataAccess(
      'DATA_LIFEPLAN_VIEW',
      { type: 'user', userId, ipAddress, userAgent: '' },
      { type: 'lifeplan', id: lifeplanId, ownerId },
      { id: generateUUID(), method: 'GET', path: `/api/lifeplans/${lifeplanId}` },
      { statusCode: 200, success: true, duration: 0 }
    );
  },

  /**
   * ライフプラン更新
   */
  async lifeplanUpdate(
    userId: string,
    lifeplanId: string,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
    ipAddress: string
  ): Promise<void> {
    await auditLogService.logDataModification(
      'DATA_LIFEPLAN_UPDATE',
      { type: 'user', userId, ipAddress, userAgent: '' },
      { type: 'lifeplan', id: lifeplanId, ownerId: userId },
      previousState,
      newState,
      { id: generateUUID(), method: 'PUT', path: `/api/lifeplans/${lifeplanId}` },
      { statusCode: 200, success: true, duration: 0 }
    );
  },

  /**
   * ライフプラン削除
   */
  async lifeplanDelete(userId: string, lifeplanId: string, ipAddress: string): Promise<void> {
    await auditLogService.logDataAccess(
      'DATA_LIFEPLAN_DELETE',
      { type: 'user', userId, ipAddress, userAgent: '' },
      { type: 'lifeplan', id: lifeplanId, ownerId: userId },
      { id: generateUUID(), method: 'DELETE', path: `/api/lifeplans/${lifeplanId}` },
      { statusCode: 200, success: true, duration: 0 }
    );
  },

  /**
   * セキュリティイベント - ブルートフォース検知
   */
  async bruteForceDetected(ipAddress: string, attemptCount: number): Promise<void> {
    await auditLogService.logSecurityEvent(
      'SEC_BRUTE_FORCE_DETECTED',
      { type: 'anonymous', ipAddress, userAgent: '' },
      { id: generateUUID(), method: 'POST', path: '/api/auth/login' },
      { statusCode: 429, success: false, errorCode: 'BRUTE_FORCE', duration: 0 },
      'HIGH',
      { attemptCount, detectionTime: new Date().toISOString() }
    );
  },

  /**
   * セキュリティイベント - CSRF違反
   */
  async csrfViolation(ipAddress: string, userAgent: string, path: string): Promise<void> {
    await auditLogService.logSecurityEvent(
      'SEC_CSRF_VIOLATION',
      { type: 'anonymous', ipAddress, userAgent },
      { id: generateUUID(), method: 'POST', path },
      { statusCode: 403, success: false, errorCode: 'CSRF_INVALID', duration: 0 },
      'MEDIUM',
      { violationType: 'invalid_token' }
    );
  },

  /**
   * セキュリティイベント - レート制限超過
   */
  async rateLimitExceeded(
    userId: string | undefined,
    ipAddress: string,
    endpoint: string
  ): Promise<void> {
    await auditLogService.logSecurityEvent(
      'SEC_RATE_LIMIT_EXCEEDED',
      { type: userId ? 'user' : 'anonymous', userId, ipAddress, userAgent: '' },
      { id: generateUUID(), method: 'GET', path: endpoint },
      { statusCode: 429, success: false, errorCode: 'RATE_LIMIT', duration: 0 },
      'LOW',
      { endpoint }
    );
  },

  /**
   * データエクスポート
   */
  async dataExport(
    userId: string,
    exportType: string,
    recordCount: number,
    ipAddress: string
  ): Promise<void> {
    await auditLogService.logDataAccess(
      'DATA_EXPORT',
      { type: 'user', userId, ipAddress, userAgent: '' },
      { type: 'export', id: generateUUID(), ownerId: userId },
      { id: generateUUID(), method: 'GET', path: '/api/export' },
      { statusCode: 200, success: true, duration: 0 },
      { exportType, recordCount }
    );
  },
};

export default auditLog;
