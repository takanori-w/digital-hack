/**
 * 監査ログモジュール - エントリポイント
 * LifePlan Navigator セキュリティ監査ログシステム
 */

// 型定義のエクスポート
export type {
  AuditLog,
  AuditEventType,
  AuditSeverity,
  RiskLevel,
  AuditActor,
  AuditTarget,
  AuditRequest,
  AuditResponse,
  AuditContext,
  AuditLogConfig,
  AuditLogFilter,
  AuditLogSearchResult,
  AuditLogAggregation,
  IntegrityRecord,
  AuditLogAccess,
  GeoLocation,
} from '@/types/audit';

// 定数のエクスポート
export {
  AUTH_EVENT_CODES,
  DATA_EVENT_CODES,
  ADMIN_EVENT_CODES,
  SEC_EVENT_CODES,
  SYS_EVENT_CODES,
  EVENT_NAMES,
} from '@/types/audit';

// サービスのエクスポート
export { AuditLogService, auditLogService, getAuditLogService } from './audit-service';

// ミドルウェアのエクスポート
export {
  extractActorFromRequest,
  extractRequestInfo,
  createResponseInfo,
  createTargetInfo,
  withAuditLog,
  auditLog,
} from './audit-middleware';

export type { AuditMiddlewareOptions } from './audit-middleware';
