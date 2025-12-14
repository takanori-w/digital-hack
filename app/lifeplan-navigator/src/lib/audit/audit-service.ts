/**
 * 監査ログサービス
 * LifePlan Navigator セキュリティ監査ログシステム
 */

import {
  AuditLog,
  AuditEventType,
  AuditActor,
  AuditTarget,
  AuditRequest,
  AuditResponse,
  AuditContext,
  AuditLogConfig,
  AuditSeverity,
  RiskLevel,
  EVENT_NAMES,
} from '@/types/audit';

// UUID v4生成（ブラウザ/Node.js両対応）
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// SHA256ハッシュ（ブラウザ/Node.js両対応）
async function sha256Hash(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // サーバーサイドフォールバック
  const { createHash } = await import('crypto');
  return createHash('sha256').update(message).digest('hex');
}

const defaultConfig: AuditLogConfig = {
  serviceName: 'lifeplan-navigator',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  piiFields: ['email', 'phone', 'address', 'ssn', 'credit_card', 'password', 'token'],
  asyncLogging: true,
  batchSize: 100,
  flushInterval: 5000,
  enableConsoleOutput: process.env.NODE_ENV === 'development',
  enableDatabaseOutput: true,
  enableRemoteOutput: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.AUDIT_LOG_ENDPOINT,
};

export class AuditLogService {
  private config: AuditLogConfig;
  private logBuffer: AuditLog[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isShuttingDown = false;

  constructor(config: Partial<AuditLogConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    if (this.config.asyncLogging && typeof setInterval !== 'undefined') {
      this.startFlushTimer();
    }
  }

  /**
   * 認証イベントのログ記録
   */
  async logAuthentication(
    eventCode: string,
    actor: Partial<AuditActor>,
    request: Partial<AuditRequest>,
    response: Partial<AuditResponse>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const log = await this.createAuditLog(
      'AUTH',
      eventCode,
      actor,
      undefined,
      request,
      response,
      metadata
    );

    await this.persistLog(log);
  }

  /**
   * データアクセスイベントのログ記録
   */
  async logDataAccess(
    eventCode: string,
    actor: Partial<AuditActor>,
    target: Partial<AuditTarget>,
    request: Partial<AuditRequest>,
    response: Partial<AuditResponse>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const log = await this.createAuditLog(
      'DATA',
      eventCode,
      actor,
      target,
      request,
      response,
      metadata
    );

    await this.persistLog(log);
  }

  /**
   * データ変更イベントのログ記録（変更前後の状態を含む）
   */
  async logDataModification(
    eventCode: string,
    actor: Partial<AuditActor>,
    target: Partial<AuditTarget>,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
    request: Partial<AuditRequest>,
    response: Partial<AuditResponse>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const sanitizedPrevState = this.sanitizePII(previousState);
    const sanitizedNewState = this.sanitizePII(newState);
    const affectedFields = this.getChangedFields(previousState, newState);

    const enrichedTarget: Partial<AuditTarget> = {
      ...target,
      previousState: sanitizedPrevState,
      newState: sanitizedNewState,
      affectedFields,
    };

    const log = await this.createAuditLog(
      'DATA',
      eventCode,
      actor,
      enrichedTarget,
      request,
      response,
      metadata
    );

    await this.persistLog(log);
  }

  /**
   * セキュリティイベントのログ記録
   */
  async logSecurityEvent(
    eventCode: string,
    actor: Partial<AuditActor>,
    request: Partial<AuditRequest>,
    response: Partial<AuditResponse>,
    riskLevel: RiskLevel,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const log = await this.createAuditLog(
      'SEC',
      eventCode,
      actor,
      undefined,
      request,
      response,
      { ...metadata, riskLevel }
    );

    log.riskLevel = riskLevel;
    log.severity = this.riskLevelToSeverity(riskLevel);

    // セキュリティイベントは即座に永続化
    await this.persistLogImmediately(log);
  }

  /**
   * 管理者操作イベントのログ記録
   */
  async logAdminAction(
    eventCode: string,
    actor: Partial<AuditActor>,
    target: Partial<AuditTarget>,
    request: Partial<AuditRequest>,
    response: Partial<AuditResponse>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const log = await this.createAuditLog(
      'ADMIN',
      eventCode,
      actor,
      target,
      request,
      response,
      metadata
    );

    // 管理者操作は即座に永続化
    await this.persistLogImmediately(log);
  }

  /**
   * システムイベントのログ記録
   */
  async logSystemEvent(
    eventCode: string,
    request: Partial<AuditRequest>,
    response: Partial<AuditResponse>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const systemActor: Partial<AuditActor> = {
      type: 'system',
      ipAddress: '127.0.0.1',
      userAgent: 'LifePlan-Navigator-System',
    };

    const log = await this.createAuditLog(
      'SYS',
      eventCode,
      systemActor,
      undefined,
      request,
      response,
      metadata
    );

    await this.persistLog(log);
  }

  /**
   * 監査ログエントリの作成
   */
  private async createAuditLog(
    eventType: AuditEventType,
    eventCode: string,
    actor: Partial<AuditActor>,
    target?: Partial<AuditTarget>,
    request?: Partial<AuditRequest>,
    response?: Partial<AuditResponse>,
    metadata?: Record<string, unknown>
  ): Promise<AuditLog> {
    const hostname = typeof process !== 'undefined' ? process.env.HOSTNAME || 'browser' : 'browser';
    const traceId = request?.id || generateUUID();
    const spanId = generateUUID().substring(0, 16);

    // メールのハッシュ化（非同期）
    let emailHash: string | undefined;
    if (actor.email) {
      emailHash = await sha256Hash(actor.email.toLowerCase());
    }

    return {
      id: generateUUID(),
      timestamp: new Date().toISOString(),

      eventType,
      eventCode,
      eventName: this.getEventName(eventCode),
      eventDescription: this.getEventDescription(eventCode),

      actor: {
        type: actor.type || 'anonymous',
        userId: actor.userId,
        username: actor.username,
        email: emailHash,
        roles: actor.roles,
        sessionId: actor.sessionId,
        ipAddress: actor.ipAddress || '0.0.0.0',
        userAgent: actor.userAgent || 'unknown',
        geoLocation: actor.geoLocation,
      },

      target: target
        ? {
            type: target.type || 'unknown',
            id: target.id || 'unknown',
            name: target.name,
            ownerId: target.ownerId,
            previousState: target.previousState,
            newState: target.newState,
            affectedFields: target.affectedFields,
          }
        : undefined,

      request: {
        id: request?.id || traceId,
        method: request?.method || 'UNKNOWN',
        path: request?.path || '/',
        query: request?.query,
        headers: this.filterHeaders(request?.headers),
        body: request?.body ? this.sanitizePII(request.body) : undefined,
        contentType: request?.contentType,
        contentLength: request?.contentLength,
      },

      response: {
        statusCode: response?.statusCode || 0,
        success: response?.success ?? false,
        errorCode: response?.errorCode,
        errorMessage: response?.errorMessage,
        duration: response?.duration || 0,
        dataSize: response?.dataSize,
      },

      context: {
        service: this.config.serviceName,
        version: this.config.version,
        environment: this.config.environment,
        hostname,
        traceId,
        spanId,
        parentSpanId: undefined,
        correlationId: request?.id,
      },

      metadata: metadata ? this.sanitizePII(metadata) : undefined,

      severity: this.eventCodeToSeverity(eventCode),
    };
  }

  /**
   * オブジェクトからPIIを除去/マスキング
   */
  private sanitizePII(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (this.config.piiFields.some((field) => lowerKey.includes(field))) {
        if (typeof value === 'string') {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = null;
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizePII(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 変更されたフィールドの検出
   */
  private getChangedFields(
    prev: Record<string, unknown>,
    next: Record<string, unknown>
  ): string[] {
    const changedFields: string[] = [];
    const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)]));

    for (const key of allKeys) {
      if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * ヘッダーのフィルタリング（セキュリティ関連のみ保持）
   */
  private filterHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;

    const allowedHeaders = [
      'content-type',
      'accept',
      'x-csrf-token',
      'x-request-id',
      'x-forwarded-for',
      'x-real-ip',
    ];

    const filtered: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        filtered[key] = value;
      }
      // Authorization ヘッダーはマスキング
      if (lowerKey === 'authorization') {
        filtered[key] = value.substring(0, 10) + '***REDACTED***';
      }
    }

    return Object.keys(filtered).length > 0 ? filtered : undefined;
  }

  /**
   * ログの永続化（バッファリング対応）
   */
  private async persistLog(log: AuditLog): Promise<void> {
    if (this.isShuttingDown) {
      await this.persistLogImmediately(log);
      return;
    }

    if (this.config.asyncLogging) {
      this.logBuffer.push(log);

      if (this.logBuffer.length >= this.config.batchSize) {
        await this.flushLogs();
      }
    } else {
      await this.persistLogImmediately(log);
    }
  }

  /**
   * ログの即時永続化
   */
  private async persistLogImmediately(log: AuditLog): Promise<void> {
    const outputs: Promise<void>[] = [];

    // コンソール出力
    if (this.config.enableConsoleOutput) {
      outputs.push(this.writeToConsole(log));
    }

    // データベース出力
    if (this.config.enableDatabaseOutput) {
      outputs.push(this.writeToDatabase(log));
    }

    // リモート出力
    if (this.config.enableRemoteOutput && this.config.remoteEndpoint) {
      outputs.push(this.sendToRemote(log));
    }

    await Promise.allSettled(outputs);
  }

  /**
   * バッファのフラッシュ
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    const outputs: Promise<void>[] = [];

    // コンソール出力
    if (this.config.enableConsoleOutput) {
      for (const log of logsToFlush) {
        outputs.push(this.writeToConsole(log));
      }
    }

    // バッチデータベース出力
    if (this.config.enableDatabaseOutput) {
      outputs.push(this.writeBatchToDatabase(logsToFlush));
    }

    // リモート出力
    if (this.config.enableRemoteOutput && this.config.remoteEndpoint) {
      for (const log of logsToFlush) {
        outputs.push(this.sendToRemote(log));
      }
    }

    await Promise.allSettled(outputs);
  }

  /**
   * フラッシュタイマーの開始
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs().catch((err) => {
        console.error('[AUDIT] Flush error:', err);
      });
    }, this.config.flushInterval);
  }

  /**
   * コンソールへの出力
   */
  private async writeToConsole(log: AuditLog): Promise<void> {
    const logLine = JSON.stringify({
      timestamp: log.timestamp,
      eventType: log.eventType,
      eventCode: log.eventCode,
      eventName: log.eventName,
      severity: log.severity,
      actor: {
        type: log.actor.type,
        userId: log.actor.userId,
        ipAddress: log.actor.ipAddress,
      },
      target: log.target
        ? {
            type: log.target.type,
            id: log.target.id,
          }
        : undefined,
      response: {
        statusCode: log.response.statusCode,
        success: log.response.success,
        duration: log.response.duration,
      },
    });

    const prefix = `[AUDIT][${log.severity}]`;

    switch (log.severity) {
      case 'ERROR':
      case 'CRITICAL':
        console.error(prefix, logLine);
        break;
      case 'WARN':
        console.warn(prefix, logLine);
        break;
      default:
        console.log(prefix, logLine);
    }
  }

  /**
   * データベースへの書き込み（単一）
   */
  private async writeToDatabase(log: AuditLog): Promise<void> {
    // サーバーサイドでのみDB書き込み
    if (typeof window === 'undefined') {
      try {
        const { insertAuditLog } = await import('@/lib/database/audit-repository');
        await insertAuditLog(log);
      } catch (err) {
        console.error('[AUDIT] Database write error:', err);
      }
    }
  }

  /**
   * データベースへの書き込み（バッチ）
   */
  private async writeBatchToDatabase(logs: AuditLog[]): Promise<void> {
    // サーバーサイドでのみDB書き込み
    if (typeof window === 'undefined' && logs.length > 0) {
      try {
        const { insertAuditLogBatch } = await import('@/lib/database/audit-repository');
        await insertAuditLogBatch(logs);
      } catch (err) {
        console.error('[AUDIT] Database batch write error:', err);
      }
    }
  }

  /**
   * リモートエンドポイントへの転送
   */
  private async sendToRemote(log: AuditLog): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });
    } catch (err) {
      console.error('[AUDIT] Remote send error:', err);
    }
  }

  /**
   * イベントコードからイベント名を取得
   */
  private getEventName(eventCode: string): string {
    return EVENT_NAMES[eventCode] || eventCode;
  }

  /**
   * イベントコードからイベント説明を取得
   */
  private getEventDescription(eventCode: string): string {
    const descriptions: Record<string, string> = {
      AUTH_LOGIN_SUCCESS: 'ユーザーが正常にシステムにログインしました',
      AUTH_LOGIN_FAILURE: 'ログイン試行が失敗しました（認証エラー）',
      AUTH_LOGOUT: 'ユーザーがシステムからログアウトしました',
      AUTH_PASSWORD_CHANGE: 'ユーザーがパスワードを変更しました',
      AUTH_ACCOUNT_LOCKED: '複数回のログイン失敗によりアカウントがロックされました',
      DATA_USER_PROFILE_VIEW: 'ユーザープロファイルが閲覧されました',
      DATA_USER_PROFILE_UPDATE: 'ユーザープロファイルが更新されました',
      DATA_LIFEPLAN_CREATE: '新しいライフプランが作成されました',
      DATA_LIFEPLAN_VIEW: 'ライフプランが閲覧されました',
      DATA_LIFEPLAN_UPDATE: 'ライフプランが更新されました',
      DATA_LIFEPLAN_DELETE: 'ライフプランが削除されました',
      SEC_BRUTE_FORCE_DETECTED: 'ブルートフォース攻撃の試行が検知されました',
      SEC_CSRF_VIOLATION: 'CSRFトークンの検証に失敗しました',
      SEC_RATE_LIMIT_EXCEEDED: 'APIレート制限を超過しました',
    };

    return descriptions[eventCode] || '';
  }

  /**
   * イベントコードから重要度を判定
   */
  private eventCodeToSeverity(eventCode: string): AuditSeverity {
    if (eventCode.includes('FAILURE') || eventCode.includes('DENIED')) {
      return 'WARN';
    }
    if (
      eventCode.includes('DETECTED') ||
      eventCode.includes('VIOLATION') ||
      eventCode.includes('ATTEMPT')
    ) {
      return 'ERROR';
    }
    if (eventCode.includes('DELETE') || eventCode.includes('PURGE')) {
      return 'WARN';
    }
    if (eventCode.includes('LOCKED')) {
      return 'WARN';
    }
    return 'INFO';
  }

  /**
   * リスクレベルから重要度を判定
   */
  private riskLevelToSeverity(riskLevel: RiskLevel): AuditSeverity {
    const mapping: Record<RiskLevel, AuditSeverity> = {
      LOW: 'INFO',
      MEDIUM: 'WARN',
      HIGH: 'ERROR',
      CRITICAL: 'CRITICAL',
    };
    return mapping[riskLevel] || 'INFO';
  }

  /**
   * シャットダウン時のクリーンアップ
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flushLogs();
  }

  /**
   * 設定の更新
   */
  updateConfig(config: Partial<AuditLogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * バッファ内のログ数を取得
   */
  getBufferSize(): number {
    return this.logBuffer.length;
  }
}

// シングルトンインスタンス
let auditLogServiceInstance: AuditLogService | null = null;

export function getAuditLogService(): AuditLogService {
  if (!auditLogServiceInstance) {
    auditLogServiceInstance = new AuditLogService();
  }
  return auditLogServiceInstance;
}

export const auditLogService = getAuditLogService();
