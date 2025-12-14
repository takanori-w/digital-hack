/**
 * 監査ログシステムの型定義
 * LifePlan Navigator セキュリティ監査ログ
 */

// 監査イベントタイプ
export type AuditEventType = 'AUTH' | 'DATA' | 'ADMIN' | 'SEC' | 'SYS';

// 重要度レベル
export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

// リスクレベル
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * 監査ログのメインスキーマ
 */
export interface AuditLog {
  // 識別子
  id: string;
  timestamp: string;

  // イベント情報
  eventType: AuditEventType;
  eventCode: string;
  eventName: string;
  eventDescription: string;

  // アクター情報
  actor: AuditActor;

  // ターゲット情報
  target?: AuditTarget;

  // リクエスト情報
  request: AuditRequest;

  // レスポンス情報
  response: AuditResponse;

  // コンテキスト情報
  context: AuditContext;

  // メタデータ
  metadata?: Record<string, unknown>;

  // セキュリティ
  severity: AuditSeverity;
  riskLevel?: RiskLevel;
}

/**
 * アクター（操作実行者）情報
 */
export interface AuditActor {
  type: 'user' | 'admin' | 'system' | 'anonymous';
  userId?: string;
  username?: string;
  email?: string;
  roles?: string[];
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  geoLocation?: GeoLocation;
}

/**
 * 地理的位置情報
 */
export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * ターゲット（操作対象）情報
 */
export interface AuditTarget {
  type: string;
  id: string;
  name?: string;
  ownerId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  affectedFields?: string[];
}

/**
 * リクエスト情報
 */
export interface AuditRequest {
  id: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  contentType?: string;
  contentLength?: number;
}

/**
 * レスポンス情報
 */
export interface AuditResponse {
  statusCode: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  duration: number;
  dataSize?: number;
}

/**
 * コンテキスト情報
 */
export interface AuditContext {
  service: string;
  version: string;
  environment: string;
  hostname: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  correlationId?: string;
}

/**
 * 監査ログ設定
 */
export interface AuditLogConfig {
  serviceName: string;
  version: string;
  environment: string;
  piiFields: string[];
  asyncLogging: boolean;
  batchSize: number;
  flushInterval: number;
  enableConsoleOutput: boolean;
  enableDatabaseOutput: boolean;
  enableRemoteOutput: boolean;
  remoteEndpoint?: string;
}

/**
 * 監査ログフィルター
 */
export interface AuditLogFilter {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  eventCodes?: string[];
  actorUserId?: string;
  actorIpAddress?: string;
  targetType?: string;
  targetId?: string;
  severity?: AuditSeverity[];
  riskLevel?: RiskLevel[];
  success?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 監査ログ検索結果
 */
export interface AuditLogSearchResult {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * 監査ログ集計
 */
export interface AuditLogAggregation {
  period: string;
  eventType: AuditEventType;
  eventCode: string;
  count: number;
  successCount: number;
  failureCount: number;
  uniqueUsers: number;
  uniqueIps: number;
}

/**
 * 完全性検証レコード
 */
export interface IntegrityRecord {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  recordCount: number;
  hashChain: string;
  previousHash: string | null;
  createdAt: Date;
  verifiedAt?: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
}

/**
 * 監査ログアクセス記録
 */
export interface AuditLogAccess {
  id: string;
  timestamp: Date;
  accessorUserId: string;
  accessorUsername: string;
  accessorIpAddress: string;
  accessType: 'VIEW' | 'SEARCH' | 'EXPORT';
  queryParameters?: Record<string, unknown>;
  resultCount?: number;
  purpose: string;
  authorizationReference?: string;
}

// イベントコード定数
export const AUTH_EVENT_CODES = {
  LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  LOGIN_FAILURE: 'AUTH_LOGIN_FAILURE',
  LOGOUT: 'AUTH_LOGOUT',
  PASSWORD_CHANGE: 'AUTH_PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST: 'AUTH_PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE: 'AUTH_PASSWORD_RESET_COMPLETE',
  MFA_ENABLED: 'AUTH_MFA_ENABLED',
  MFA_DISABLED: 'AUTH_MFA_DISABLED',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  TOKEN_REVOKED: 'AUTH_TOKEN_REVOKED',
  ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
} as const;

export const DATA_EVENT_CODES = {
  USER_PROFILE_VIEW: 'DATA_USER_PROFILE_VIEW',
  USER_PROFILE_UPDATE: 'DATA_USER_PROFILE_UPDATE',
  LIFEPLAN_CREATE: 'DATA_LIFEPLAN_CREATE',
  LIFEPLAN_VIEW: 'DATA_LIFEPLAN_VIEW',
  LIFEPLAN_UPDATE: 'DATA_LIFEPLAN_UPDATE',
  LIFEPLAN_DELETE: 'DATA_LIFEPLAN_DELETE',
  FINANCIAL_VIEW: 'DATA_FINANCIAL_VIEW',
  FINANCIAL_UPDATE: 'DATA_FINANCIAL_UPDATE',
  SIMULATION_RUN: 'DATA_SIMULATION_RUN',
  EXPORT: 'DATA_EXPORT',
  BULK_ACCESS: 'DATA_BULK_ACCESS',
} as const;

export const ADMIN_EVENT_CODES = {
  USER_CREATE: 'ADMIN_USER_CREATE',
  USER_UPDATE: 'ADMIN_USER_UPDATE',
  USER_DELETE: 'ADMIN_USER_DELETE',
  USER_DISABLE: 'ADMIN_USER_DISABLE',
  ROLE_CHANGE: 'ADMIN_ROLE_CHANGE',
  CONFIG_CHANGE: 'ADMIN_CONFIG_CHANGE',
  DATA_PURGE: 'ADMIN_DATA_PURGE',
  AUDIT_ACCESS: 'ADMIN_AUDIT_ACCESS',
} as const;

export const SEC_EVENT_CODES = {
  BRUTE_FORCE_DETECTED: 'SEC_BRUTE_FORCE_DETECTED',
  SUSPICIOUS_ACCESS: 'SEC_SUSPICIOUS_ACCESS',
  GEO_ANOMALY: 'SEC_GEO_ANOMALY',
  SESSION_HIJACK_ATTEMPT: 'SEC_SESSION_HIJACK_ATTEMPT',
  CSRF_VIOLATION: 'SEC_CSRF_VIOLATION',
  SQL_INJECTION_ATTEMPT: 'SEC_SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT: 'SEC_XSS_ATTEMPT',
  RATE_LIMIT_EXCEEDED: 'SEC_RATE_LIMIT_EXCEEDED',
  PERMISSION_DENIED: 'SEC_PERMISSION_DENIED',
  INVALID_INPUT: 'SEC_INVALID_INPUT',
} as const;

export const SYS_EVENT_CODES = {
  STARTUP: 'SYS_STARTUP',
  SHUTDOWN: 'SYS_SHUTDOWN',
  CONFIG_RELOAD: 'SYS_CONFIG_RELOAD',
  DATABASE_CONNECTION: 'SYS_DATABASE_CONNECTION',
  EXTERNAL_SERVICE_CALL: 'SYS_EXTERNAL_SERVICE_CALL',
  BATCH_JOB_START: 'SYS_BATCH_JOB_START',
  BATCH_JOB_COMPLETE: 'SYS_BATCH_JOB_COMPLETE',
  BATCH_JOB_FAILURE: 'SYS_BATCH_JOB_FAILURE',
} as const;

// イベント名マッピング
export const EVENT_NAMES: Record<string, string> = {
  // 認証
  [AUTH_EVENT_CODES.LOGIN_SUCCESS]: 'ログイン成功',
  [AUTH_EVENT_CODES.LOGIN_FAILURE]: 'ログイン失敗',
  [AUTH_EVENT_CODES.LOGOUT]: 'ログアウト',
  [AUTH_EVENT_CODES.PASSWORD_CHANGE]: 'パスワード変更',
  [AUTH_EVENT_CODES.PASSWORD_RESET_REQUEST]: 'パスワードリセット要求',
  [AUTH_EVENT_CODES.PASSWORD_RESET_COMPLETE]: 'パスワードリセット完了',
  [AUTH_EVENT_CODES.MFA_ENABLED]: 'MFA有効化',
  [AUTH_EVENT_CODES.MFA_DISABLED]: 'MFA無効化',
  [AUTH_EVENT_CODES.SESSION_EXPIRED]: 'セッション期限切れ',
  [AUTH_EVENT_CODES.TOKEN_REVOKED]: 'トークン失効',
  [AUTH_EVENT_CODES.ACCOUNT_LOCKED]: 'アカウントロック',

  // データ
  [DATA_EVENT_CODES.USER_PROFILE_VIEW]: 'プロファイル閲覧',
  [DATA_EVENT_CODES.USER_PROFILE_UPDATE]: 'プロファイル更新',
  [DATA_EVENT_CODES.LIFEPLAN_CREATE]: 'ライフプラン作成',
  [DATA_EVENT_CODES.LIFEPLAN_VIEW]: 'ライフプラン閲覧',
  [DATA_EVENT_CODES.LIFEPLAN_UPDATE]: 'ライフプラン更新',
  [DATA_EVENT_CODES.LIFEPLAN_DELETE]: 'ライフプラン削除',
  [DATA_EVENT_CODES.FINANCIAL_VIEW]: '金融情報閲覧',
  [DATA_EVENT_CODES.FINANCIAL_UPDATE]: '金融情報更新',
  [DATA_EVENT_CODES.SIMULATION_RUN]: 'シミュレーション実行',
  [DATA_EVENT_CODES.EXPORT]: 'データエクスポート',
  [DATA_EVENT_CODES.BULK_ACCESS]: '大量データアクセス',

  // 管理者
  [ADMIN_EVENT_CODES.USER_CREATE]: 'ユーザー作成',
  [ADMIN_EVENT_CODES.USER_UPDATE]: 'ユーザー更新',
  [ADMIN_EVENT_CODES.USER_DELETE]: 'ユーザー削除',
  [ADMIN_EVENT_CODES.USER_DISABLE]: 'ユーザー無効化',
  [ADMIN_EVENT_CODES.ROLE_CHANGE]: '権限変更',
  [ADMIN_EVENT_CODES.CONFIG_CHANGE]: '設定変更',
  [ADMIN_EVENT_CODES.DATA_PURGE]: 'データパージ',
  [ADMIN_EVENT_CODES.AUDIT_ACCESS]: '監査ログアクセス',

  // セキュリティ
  [SEC_EVENT_CODES.BRUTE_FORCE_DETECTED]: 'ブルートフォース検知',
  [SEC_EVENT_CODES.SUSPICIOUS_ACCESS]: '不審なアクセス',
  [SEC_EVENT_CODES.GEO_ANOMALY]: '地理的異常',
  [SEC_EVENT_CODES.SESSION_HIJACK_ATTEMPT]: 'セッションハイジャック試行',
  [SEC_EVENT_CODES.CSRF_VIOLATION]: 'CSRF違反',
  [SEC_EVENT_CODES.SQL_INJECTION_ATTEMPT]: 'SQLインジェクション試行',
  [SEC_EVENT_CODES.XSS_ATTEMPT]: 'XSS試行',
  [SEC_EVENT_CODES.RATE_LIMIT_EXCEEDED]: 'レート制限超過',
  [SEC_EVENT_CODES.PERMISSION_DENIED]: '権限不足',
  [SEC_EVENT_CODES.INVALID_INPUT]: '不正入力',

  // システム
  [SYS_EVENT_CODES.STARTUP]: 'システム起動',
  [SYS_EVENT_CODES.SHUTDOWN]: 'システム停止',
  [SYS_EVENT_CODES.CONFIG_RELOAD]: '設定リロード',
  [SYS_EVENT_CODES.DATABASE_CONNECTION]: 'DB接続',
  [SYS_EVENT_CODES.EXTERNAL_SERVICE_CALL]: '外部サービス呼び出し',
  [SYS_EVENT_CODES.BATCH_JOB_START]: 'バッチ開始',
  [SYS_EVENT_CODES.BATCH_JOB_COMPLETE]: 'バッチ完了',
  [SYS_EVENT_CODES.BATCH_JOB_FAILURE]: 'バッチ失敗',
};
