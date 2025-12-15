/**
 * Database Module Exports
 */

export { getDatabase, db, type QueryResult, type DatabaseConfig } from './pool';

export {
  insertAuditLog,
  insertAuditLogBatch,
  queryAuditLogs,
  getResourceAuditTrail,
  getSecurityEvents,
  type AuditLogQuery,
} from './audit-repository';
