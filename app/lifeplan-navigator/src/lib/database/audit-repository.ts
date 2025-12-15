/**
 * Audit Log Repository
 *
 * Handles persistence of audit logs to PostgreSQL
 *
 * Security Compliance:
 * - SEC-015: Audit log persistence
 * - GDPR Article 30: Record of processing activities
 */

import { getDatabase } from './pool';
import type { AuditLog } from '@/types/audit';

/**
 * Insert a single audit log entry
 */
export async function insertAuditLog(log: AuditLog): Promise<void> {
  const db = getDatabase();

  const sql = `
    INSERT INTO audit_logs (
      id, timestamp,
      event_type, event_code, event_name, event_description,
      actor_type, actor_user_id, actor_username, actor_email_hash,
      actor_roles, actor_session_id, actor_ip_address, actor_user_agent, actor_geo_location,
      target_type, target_id, target_name, target_owner_id,
      target_previous_state, target_new_state, target_affected_fields,
      request_id, request_method, request_path, request_query,
      request_headers, request_body_sanitized, request_content_type, request_content_length,
      response_status_code, response_success, response_error_code, response_error_message,
      response_duration_ms, response_data_size,
      context_service, context_version, context_environment, context_hostname,
      context_trace_id, context_span_id, context_parent_span_id, context_correlation_id,
      severity, risk_level, metadata
    ) VALUES (
      $1, $2,
      $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21, $22,
      $23, $24, $25, $26,
      $27, $28, $29, $30,
      $31, $32, $33, $34,
      $35, $36,
      $37, $38, $39, $40,
      $41, $42, $43, $44,
      $45, $46, $47
    )
  `;

  const params = [
    log.id,
    log.timestamp,
    log.eventType,
    log.eventCode,
    log.eventName,
    log.eventDescription,
    log.actor.type,
    log.actor.userId,
    log.actor.username,
    log.actor.email,
    log.actor.roles,
    log.actor.sessionId,
    log.actor.ipAddress,
    log.actor.userAgent,
    log.actor.geoLocation ? JSON.stringify(log.actor.geoLocation) : null,
    log.target?.type,
    log.target?.id,
    log.target?.name,
    log.target?.ownerId,
    log.target?.previousState ? JSON.stringify(log.target.previousState) : null,
    log.target?.newState ? JSON.stringify(log.target.newState) : null,
    log.target?.affectedFields,
    log.request.id,
    log.request.method,
    log.request.path,
    log.request.query ? JSON.stringify(log.request.query) : null,
    log.request.headers ? JSON.stringify(log.request.headers) : null,
    log.request.body ? JSON.stringify(log.request.body) : null,
    log.request.contentType,
    log.request.contentLength,
    log.response.statusCode,
    log.response.success,
    log.response.errorCode,
    log.response.errorMessage,
    log.response.duration,
    log.response.dataSize,
    log.context.service,
    log.context.version,
    log.context.environment,
    log.context.hostname,
    log.context.traceId,
    log.context.spanId,
    log.context.parentSpanId,
    log.context.correlationId,
    log.severity,
    log.riskLevel,
    log.metadata ? JSON.stringify(log.metadata) : null,
  ];

  await db.query(sql, params);
}

/**
 * Insert multiple audit log entries (batch)
 */
export async function insertAuditLogBatch(logs: AuditLog[]): Promise<number> {
  if (logs.length === 0) return 0;

  const db = getDatabase();

  // For simplicity, insert one by one
  // In production, use a proper batch insert
  let insertedCount = 0;

  for (const log of logs) {
    try {
      await insertAuditLog(log);
      insertedCount++;
    } catch (error) {
      console.error('[AuditRepository] Failed to insert log:', error);
    }
  }

  return insertedCount;
}

/**
 * Query audit logs with filters
 */
export interface AuditLogQuery {
  userId?: string;
  eventType?: string;
  eventCode?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: string;
  riskLevel?: string;
  limit?: number;
  offset?: number;
}

export async function queryAuditLogs(
  query: AuditLogQuery
): Promise<{ logs: AuditLog[]; total: number }> {
  const db = getDatabase();

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (query.userId) {
    conditions.push(`actor_user_id = $${paramIndex++}`);
    params.push(query.userId);
  }

  if (query.eventType) {
    conditions.push(`event_type = $${paramIndex++}`);
    params.push(query.eventType);
  }

  if (query.eventCode) {
    conditions.push(`event_code = $${paramIndex++}`);
    params.push(query.eventCode);
  }

  if (query.startDate) {
    conditions.push(`timestamp >= $${paramIndex++}`);
    params.push(query.startDate.toISOString());
  }

  if (query.endDate) {
    conditions.push(`timestamp <= $${paramIndex++}`);
    params.push(query.endDate.toISOString());
  }

  if (query.severity) {
    conditions.push(`severity = $${paramIndex++}`);
    params.push(query.severity);
  }

  if (query.riskLevel) {
    conditions.push(`risk_level = $${paramIndex++}`);
    params.push(query.riskLevel);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const limit = query.limit || 100;
  const offset = query.offset || 0;

  // Get total count
  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Get logs
  const sql = `
    SELECT * FROM audit_logs
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `;

  params.push(limit, offset);

  const result = await db.query(sql, params);

  // Map database rows to AuditLog objects
  const logs = result.rows.map(mapRowToAuditLog);

  return { logs, total };
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditTrail(
  targetType: string,
  targetId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const db = getDatabase();

  const sql = `
    SELECT * FROM audit_logs
    WHERE target_type = $1 AND target_id = $2
    ORDER BY timestamp DESC
    LIMIT $3
  `;

  const result = await db.query(sql, [targetType, targetId, limit]);

  return result.rows.map(mapRowToAuditLog);
}

/**
 * Get security events within a time range
 */
export async function getSecurityEvents(
  startDate: Date,
  endDate: Date,
  minSeverity: string = 'WARN'
): Promise<AuditLog[]> {
  const db = getDatabase();

  const severityOrder = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
  const minSeverityIndex = severityOrder.indexOf(minSeverity);
  const validSeverities = severityOrder.slice(minSeverityIndex);

  const sql = `
    SELECT * FROM audit_logs
    WHERE timestamp >= $1 AND timestamp <= $2
    AND severity = ANY($3)
    ORDER BY timestamp DESC
  `;

  const result = await db.query(sql, [
    startDate.toISOString(),
    endDate.toISOString(),
    validSeverities,
  ]);

  return result.rows.map(mapRowToAuditLog);
}

/**
 * Map database row to AuditLog object
 */
function mapRowToAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as string,
    timestamp: row.timestamp as string,
    eventType: row.event_type as AuditLog['eventType'],
    eventCode: row.event_code as string,
    eventName: row.event_name as string,
    eventDescription: row.event_description as string,
    actor: {
      type: row.actor_type as AuditLog['actor']['type'],
      userId: row.actor_user_id as string | undefined,
      username: row.actor_username as string | undefined,
      email: row.actor_email_hash as string | undefined,
      roles: row.actor_roles as string[] | undefined,
      sessionId: row.actor_session_id as string | undefined,
      ipAddress: row.actor_ip_address as string,
      userAgent: row.actor_user_agent as string,
      geoLocation: row.actor_geo_location as AuditLog['actor']['geoLocation'],
    },
    target: row.target_type ? {
      type: row.target_type as string,
      id: row.target_id as string,
      name: row.target_name as string | undefined,
      ownerId: row.target_owner_id as string | undefined,
      previousState: row.target_previous_state as Record<string, unknown> | undefined,
      newState: row.target_new_state as Record<string, unknown> | undefined,
      affectedFields: row.target_affected_fields as string[] | undefined,
    } : undefined,
    request: {
      id: row.request_id as string,
      method: row.request_method as string,
      path: row.request_path as string,
      query: row.request_query as Record<string, string> | undefined,
      headers: row.request_headers as Record<string, string> | undefined,
      body: row.request_body_sanitized as Record<string, unknown> | undefined,
      contentType: row.request_content_type as string | undefined,
      contentLength: row.request_content_length as number | undefined,
    },
    response: {
      statusCode: row.response_status_code as number,
      success: row.response_success as boolean,
      errorCode: row.response_error_code as string | undefined,
      errorMessage: row.response_error_message as string | undefined,
      duration: row.response_duration_ms as number,
      dataSize: row.response_data_size as number | undefined,
    },
    context: {
      service: row.context_service as string,
      version: row.context_version as string,
      environment: row.context_environment as string,
      hostname: row.context_hostname as string,
      traceId: row.context_trace_id as string,
      spanId: row.context_span_id as string,
      parentSpanId: row.context_parent_span_id as string | undefined,
      correlationId: row.context_correlation_id as string | undefined,
    },
    severity: row.severity as AuditLog['severity'],
    riskLevel: row.risk_level as AuditLog['riskLevel'],
    metadata: row.metadata as Record<string, unknown> | undefined,
  };
}
