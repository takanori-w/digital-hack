# LifePlan Navigator 監査ログシステム技術仕様書

| 項目 | 内容 |
|------|------|
| ドキュメント名 | 監査ログシステム技術仕様書 |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | CSIRT Engineer |
| レビュー | CSIRT Team Leader, App Engineer, SOC Analyst |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator Webアプリケーションにおける監査ログシステムの技術仕様を定義する。セキュリティインシデントの調査、コンプライアンス要件の遵守、フォレンジック分析を可能にする監査ログ機能を実装する。

### 1.2 対象システム
- **フロントエンド**: Next.js (React) アプリケーション
- **バックエンド**: Node.js/Express API サーバー（想定）
- **データベース**: PostgreSQL
- **クラウドインフラ**: AWS

### 1.3 準拠要件
- GDPR Article 30 (記録保持義務)
- 個人情報保護法
- ISO 27001:2022 (A.12.4 ログ取得)
- PCI DSS v4.0 Requirement 10
- NIST SP 800-92 (ログ管理ガイド)

---

## 2. 監査ログアーキテクチャ

### 2.1 全体構成図

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LifePlan Navigator 監査ログシステム                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        アプリケーション層                            │   │
│  │                                                                     │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │   │
│  │   │  Frontend   │    │  Backend    │    │  Batch      │           │   │
│  │   │  (Next.js)  │ → │  (Node.js)  │ → │  Services   │           │   │
│  │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘           │   │
│  └──────────┼──────────────────┼──────────────────┼───────────────────┘   │
│             │                  │                  │                       │
│             ▼                  ▼                  ▼                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       監査ログサービス層                             │   │
│  │                                                                     │   │
│  │   ┌─────────────────────────────────────────────────────────────┐  │   │
│  │   │                    AuditLogService                          │  │   │
│  │   │  - logAuthentication()   - logDataAccess()                  │  │   │
│  │   │  - logDataModification() - logSecurityEvent()               │  │   │
│  │   │  - logAdminAction()      - logSystemEvent()                 │  │   │
│  │   └─────────────────────────────┬───────────────────────────────┘  │   │
│  │                                 │                                   │   │
│  │   ┌─────────────────────────────┼───────────────────────────────┐  │   │
│  │   │                    AuditLogFormatter                        │  │   │
│  │   │  - 共通フォーマット適用                                      │  │   │
│  │   │  - コンテキスト情報付与                                      │  │   │
│  │   │  - PIIマスキング                                            │  │   │
│  │   └─────────────────────────────┬───────────────────────────────┘  │   │
│  └─────────────────────────────────┼───────────────────────────────────┘   │
│                                    │                                       │
│             ┌──────────────────────┼──────────────────────┐               │
│             ▼                      ▼                      ▼               │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐      │
│  │   PostgreSQL     │   │    Fluent Bit    │   │   CloudWatch     │      │
│  │   (監査テーブル)  │   │   (転送/バッファ) │   │    Logs          │      │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘      │
│           │                      │                      │                 │
│           │                      └──────────┬───────────┘                 │
│           │                                 ▼                             │
│           │                      ┌──────────────────┐                     │
│           │                      │   Elasticsearch  │                     │
│           │                      │      (SIEM)      │                     │
│           │                      └────────┬─────────┘                     │
│           │                               │                               │
│           ▼                               ▼                               │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                         S3 Archive                           │        │
│  │                 (長期保管・コンプライアンス)                   │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.2 監査ログフロー

```
[ユーザーアクション] → [APIエンドポイント] → [監査ミドルウェア]
                                                    │
                                          ┌────────┴────────┐
                                          ▼                 ▼
                                    [同期ログ]        [非同期ログ]
                                    (Critical)       (Standard)
                                          │                 │
                                          ▼                 ▼
                                    [PostgreSQL]      [Message Queue]
                                          │                 │
                                          │                 ▼
                                          │           [Log Processor]
                                          │                 │
                                          └────────┬────────┘
                                                   ▼
                                            [SIEM/Archive]
```

---

## 3. 監査対象イベント定義

### 3.1 認証イベント (AUTH)

| イベントコード | イベント名 | 説明 | ログレベル |
|---------------|-----------|------|-----------|
| AUTH_LOGIN_SUCCESS | ログイン成功 | ユーザーが正常にログイン | INFO |
| AUTH_LOGIN_FAILURE | ログイン失敗 | ログイン試行失敗（認証エラー） | WARN |
| AUTH_LOGOUT | ログアウト | ユーザーがログアウト | INFO |
| AUTH_PASSWORD_CHANGE | パスワード変更 | パスワードが変更された | INFO |
| AUTH_PASSWORD_RESET_REQUEST | パスワードリセット要求 | リセットメール送信 | INFO |
| AUTH_PASSWORD_RESET_COMPLETE | パスワードリセット完了 | 新パスワード設定完了 | INFO |
| AUTH_MFA_ENABLED | MFA有効化 | 二要素認証が有効化 | INFO |
| AUTH_MFA_DISABLED | MFA無効化 | 二要素認証が無効化 | WARN |
| AUTH_SESSION_EXPIRED | セッション期限切れ | セッションがタイムアウト | INFO |
| AUTH_TOKEN_REVOKED | トークン失効 | 認証トークンが無効化 | INFO |
| AUTH_ACCOUNT_LOCKED | アカウントロック | 複数回失敗によるロック | WARN |

### 3.2 データアクセスイベント (DATA)

| イベントコード | イベント名 | 説明 | ログレベル |
|---------------|-----------|------|-----------|
| DATA_USER_PROFILE_VIEW | プロファイル閲覧 | ユーザープロファイルの閲覧 | INFO |
| DATA_USER_PROFILE_UPDATE | プロファイル更新 | ユーザープロファイルの変更 | INFO |
| DATA_LIFEPLAN_CREATE | ライフプラン作成 | 新規ライフプラン作成 | INFO |
| DATA_LIFEPLAN_VIEW | ライフプラン閲覧 | ライフプランの閲覧 | INFO |
| DATA_LIFEPLAN_UPDATE | ライフプラン更新 | ライフプランの変更 | INFO |
| DATA_LIFEPLAN_DELETE | ライフプラン削除 | ライフプランの削除 | WARN |
| DATA_FINANCIAL_VIEW | 金融情報閲覧 | 金融データの閲覧 | INFO |
| DATA_FINANCIAL_UPDATE | 金融情報更新 | 金融データの変更 | INFO |
| DATA_SIMULATION_RUN | シミュレーション実行 | シミュレーション計算実行 | INFO |
| DATA_EXPORT | データエクスポート | ユーザーデータのエクスポート | WARN |
| DATA_BULK_ACCESS | 大量データアクセス | 閾値超過のデータ取得 | WARN |

### 3.3 管理者操作イベント (ADMIN)

| イベントコード | イベント名 | 説明 | ログレベル |
|---------------|-----------|------|-----------|
| ADMIN_USER_CREATE | ユーザー作成 | 管理者によるユーザー作成 | INFO |
| ADMIN_USER_UPDATE | ユーザー更新 | 管理者によるユーザー情報変更 | INFO |
| ADMIN_USER_DELETE | ユーザー削除 | 管理者によるユーザー削除 | WARN |
| ADMIN_USER_DISABLE | ユーザー無効化 | アカウントの無効化 | WARN |
| ADMIN_ROLE_CHANGE | 権限変更 | ユーザー権限の変更 | WARN |
| ADMIN_CONFIG_CHANGE | 設定変更 | システム設定の変更 | WARN |
| ADMIN_DATA_PURGE | データパージ | データの一括削除 | ERROR |
| ADMIN_AUDIT_ACCESS | 監査ログアクセス | 監査ログの閲覧 | INFO |

### 3.4 セキュリティイベント (SEC)

| イベントコード | イベント名 | 説明 | ログレベル |
|---------------|-----------|------|-----------|
| SEC_BRUTE_FORCE_DETECTED | ブルートフォース検知 | 複数回の認証失敗検知 | ERROR |
| SEC_SUSPICIOUS_ACCESS | 不審なアクセス | 通常と異なるアクセスパターン | WARN |
| SEC_GEO_ANOMALY | 地理的異常 | 通常と異なる地域からのアクセス | WARN |
| SEC_SESSION_HIJACK_ATTEMPT | セッションハイジャック試行 | セッション乗っ取り試行 | ERROR |
| SEC_CSRF_VIOLATION | CSRF違反 | CSRFトークン検証失敗 | ERROR |
| SEC_SQL_INJECTION_ATTEMPT | SQLインジェクション試行 | SQLインジェクション検知 | ERROR |
| SEC_XSS_ATTEMPT | XSS試行 | XSS攻撃パターン検知 | ERROR |
| SEC_RATE_LIMIT_EXCEEDED | レート制限超過 | APIレート制限超過 | WARN |
| SEC_PERMISSION_DENIED | 権限不足 | 権限外リソースへのアクセス試行 | WARN |
| SEC_INVALID_INPUT | 不正入力 | バリデーションエラー | INFO |

### 3.5 システムイベント (SYS)

| イベントコード | イベント名 | 説明 | ログレベル |
|---------------|-----------|------|-----------|
| SYS_STARTUP | システム起動 | アプリケーション起動 | INFO |
| SYS_SHUTDOWN | システム停止 | アプリケーション停止 | INFO |
| SYS_CONFIG_RELOAD | 設定リロード | 設定ファイルの再読み込み | INFO |
| SYS_DATABASE_CONNECTION | DB接続 | データベース接続状態変化 | INFO |
| SYS_EXTERNAL_SERVICE_CALL | 外部サービス呼び出し | 外部APIへの呼び出し | DEBUG |
| SYS_BATCH_JOB_START | バッチ開始 | バッチジョブ開始 | INFO |
| SYS_BATCH_JOB_COMPLETE | バッチ完了 | バッチジョブ完了 | INFO |
| SYS_BATCH_JOB_FAILURE | バッチ失敗 | バッチジョブ失敗 | ERROR |

---

## 4. 監査ログデータモデル

### 4.1 監査ログスキーマ

```typescript
// types/audit.ts

/**
 * 監査ログのメインスキーマ
 */
export interface AuditLog {
  // 識別子
  id: string;                          // UUID v4
  timestamp: string;                   // ISO 8601 形式

  // イベント情報
  eventType: AuditEventType;           // AUTH, DATA, ADMIN, SEC, SYS
  eventCode: string;                   // イベントコード
  eventName: string;                   // イベント名（人間可読）
  eventDescription: string;            // イベント詳細説明

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
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type AuditEventType = 'AUTH' | 'DATA' | 'ADMIN' | 'SEC' | 'SYS';

/**
 * アクター（操作実行者）情報
 */
export interface AuditActor {
  type: 'user' | 'admin' | 'system' | 'anonymous';
  userId?: string;
  username?: string;
  email?: string;                      // マスキング対象
  roles?: string[];
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * ターゲット（操作対象）情報
 */
export interface AuditTarget {
  type: string;                        // user, lifeplan, financial_data, etc.
  id: string;
  name?: string;
  ownerId?: string;
  previousState?: Record<string, unknown>;  // 変更前の状態
  newState?: Record<string, unknown>;       // 変更後の状態
  affectedFields?: string[];                // 変更されたフィールド
}

/**
 * リクエスト情報
 */
export interface AuditRequest {
  id: string;                          // リクエストID
  method: string;                      // HTTP メソッド
  path: string;                        // リクエストパス
  query?: Record<string, string>;      // クエリパラメータ
  headers?: Record<string, string>;    // 選択されたヘッダー（認証系など）
  body?: Record<string, unknown>;      // ボディ（PII除去済み）
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
  duration: number;                    // レスポンス時間（ミリ秒）
  dataSize?: number;                   // レスポンスサイズ
}

/**
 * コンテキスト情報
 */
export interface AuditContext {
  service: string;                     // サービス名
  version: string;                     // アプリケーションバージョン
  environment: string;                 // production, staging, development
  hostname: string;                    // サーバーホスト名
  traceId: string;                     // 分散トレースID
  spanId: string;                      // スパンID
  parentSpanId?: string;               // 親スパンID
  correlationId?: string;              // 相関ID
}
```

### 4.2 PostgreSQL テーブル定義

```sql
-- 監査ログメインテーブル
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- イベント情報
    event_type VARCHAR(10) NOT NULL,
    event_code VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_description TEXT,

    -- アクター情報
    actor_type VARCHAR(20) NOT NULL,
    actor_user_id UUID,
    actor_username VARCHAR(255),
    actor_email_hash VARCHAR(64),          -- SHA256 ハッシュ（PIIマスキング）
    actor_roles TEXT[],
    actor_session_id VARCHAR(255),
    actor_ip_address INET NOT NULL,
    actor_user_agent TEXT,
    actor_geo_country VARCHAR(2),
    actor_geo_region VARCHAR(100),
    actor_geo_city VARCHAR(100),

    -- ターゲット情報
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    target_name VARCHAR(255),
    target_owner_id UUID,
    target_changes JSONB,                  -- 変更前後の差分

    -- リクエスト情報
    request_id VARCHAR(255) NOT NULL,
    request_method VARCHAR(10) NOT NULL,
    request_path VARCHAR(500) NOT NULL,
    request_query JSONB,
    request_body_hash VARCHAR(64),         -- ボディのハッシュ（完全性検証用）
    request_content_type VARCHAR(100),
    request_content_length INTEGER,

    -- レスポンス情報
    response_status_code INTEGER NOT NULL,
    response_success BOOLEAN NOT NULL,
    response_error_code VARCHAR(50),
    response_error_message TEXT,
    response_duration_ms INTEGER NOT NULL,
    response_data_size INTEGER,

    -- コンテキスト情報
    context_service VARCHAR(50) NOT NULL,
    context_version VARCHAR(20) NOT NULL,
    context_environment VARCHAR(20) NOT NULL,
    context_hostname VARCHAR(255) NOT NULL,
    context_trace_id VARCHAR(64) NOT NULL,
    context_span_id VARCHAR(32) NOT NULL,
    context_parent_span_id VARCHAR(32),
    context_correlation_id VARCHAR(255),

    -- メタデータ
    metadata JSONB,

    -- セキュリティ
    severity VARCHAR(10) NOT NULL,
    risk_level VARCHAR(10),

    -- インデックス用
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス定義
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs (event_type);
CREATE INDEX idx_audit_logs_event_code ON audit_logs (event_code);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs (actor_user_id);
CREATE INDEX idx_audit_logs_actor_ip ON audit_logs (actor_ip_address);
CREATE INDEX idx_audit_logs_target_id ON audit_logs (target_id);
CREATE INDEX idx_audit_logs_request_id ON audit_logs (request_id);
CREATE INDEX idx_audit_logs_trace_id ON audit_logs (context_trace_id);
CREATE INDEX idx_audit_logs_severity ON audit_logs (severity);
CREATE INDEX idx_audit_logs_response_status ON audit_logs (response_status_code);

-- パーティショニング（月次）
CREATE TABLE audit_logs_partitioned (
    LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- パーティション作成例（自動化推奨）
CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- 監査ログアクセス記録テーブル
CREATE TABLE audit_log_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accessor_user_id UUID NOT NULL,
    accessor_username VARCHAR(255) NOT NULL,
    accessor_ip_address INET NOT NULL,
    access_type VARCHAR(20) NOT NULL,      -- VIEW, SEARCH, EXPORT
    query_parameters JSONB,
    result_count INTEGER,
    purpose VARCHAR(500),                  -- アクセス目的（必須）
    authorization_reference VARCHAR(100)   -- 承認参照番号
);

-- 監査ログ完全性検証テーブル
CREATE TABLE audit_log_integrity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    record_count INTEGER NOT NULL,
    hash_chain VARCHAR(64) NOT NULL,       -- SHA256 ハッシュチェーン
    previous_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verification_status VARCHAR(20)        -- PENDING, VERIFIED, FAILED
);
```

---

## 5. 実装仕様

### 5.1 監査ログサービス実装

```typescript
// lib/audit/audit-service.ts

import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { AuditLog, AuditEventType, AuditActor, AuditTarget, AuditRequest, AuditResponse, AuditContext } from '@/types/audit';

interface AuditLogConfig {
  serviceName: string;
  version: string;
  environment: string;
  piiFields: string[];
  asyncLogging: boolean;
  batchSize: number;
  flushInterval: number;
}

const defaultConfig: AuditLogConfig = {
  serviceName: 'lifeplan-navigator',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  piiFields: ['email', 'phone', 'address', 'ssn', 'credit_card'],
  asyncLogging: true,
  batchSize: 100,
  flushInterval: 5000, // 5秒
};

export class AuditLogService {
  private config: AuditLogConfig;
  private logBuffer: AuditLog[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AuditLogConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    if (this.config.asyncLogging) {
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
    const log = this.createAuditLog(
      'AUTH',
      eventCode,
      this.getEventName(eventCode),
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
    const log = this.createAuditLog(
      'DATA',
      eventCode,
      this.getEventName(eventCode),
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

    const log = this.createAuditLog(
      'DATA',
      eventCode,
      this.getEventName(eventCode),
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
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const log = this.createAuditLog(
      'SEC',
      eventCode,
      this.getEventName(eventCode),
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
    const log = this.createAuditLog(
      'ADMIN',
      eventCode,
      this.getEventName(eventCode),
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

    const log = this.createAuditLog(
      'SYS',
      eventCode,
      this.getEventName(eventCode),
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
  private createAuditLog(
    eventType: AuditEventType,
    eventCode: string,
    eventName: string,
    actor: Partial<AuditActor>,
    target?: Partial<AuditTarget>,
    request?: Partial<AuditRequest>,
    response?: Partial<AuditResponse>,
    metadata?: Record<string, unknown>
  ): AuditLog {
    const hostname = process.env.HOSTNAME || 'unknown';
    const traceId = request?.id || uuidv4();
    const spanId = uuidv4().substring(0, 16);

    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),

      eventType,
      eventCode,
      eventName,
      eventDescription: this.getEventDescription(eventCode),

      actor: {
        type: actor.type || 'anonymous',
        userId: actor.userId,
        username: actor.username,
        email: actor.email ? this.hashPII(actor.email) : undefined,
        roles: actor.roles,
        sessionId: actor.sessionId,
        ipAddress: actor.ipAddress || '0.0.0.0',
        userAgent: actor.userAgent || 'unknown',
        geoLocation: actor.geoLocation,
      },

      target: target ? {
        type: target.type || 'unknown',
        id: target.id || 'unknown',
        name: target.name,
        ownerId: target.ownerId,
        previousState: target.previousState,
        newState: target.newState,
        affectedFields: target.affectedFields,
      } : undefined,

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
   * PIIフィールドのハッシュ化
   */
  private hashPII(value: string): string {
    return createHash('sha256').update(value.toLowerCase()).digest('hex');
  }

  /**
   * オブジェクトからPIIを除去/マスキング
   */
  private sanitizePII(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (this.config.piiFields.some(field => lowerKey.includes(field))) {
        if (typeof value === 'string') {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = null;
        }
      } else if (typeof value === 'object' && value !== null) {
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
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

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
      'authorization',
      'x-csrf-token',
      'x-request-id',
      'x-forwarded-for',
      'x-real-ip',
    ];

    const filtered: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        // Authorization ヘッダーはマスキング
        if (lowerKey === 'authorization') {
          filtered[key] = value.substring(0, 10) + '***REDACTED***';
        } else {
          filtered[key] = value;
        }
      }
    }

    return filtered;
  }

  /**
   * ログの永続化（バッファリング対応）
   */
  private async persistLog(log: AuditLog): Promise<void> {
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
    // PostgreSQLへの書き込み
    await this.writeToDatabase(log);

    // Fluent Bitへの転送（SIEM連携用）
    await this.sendToFluentBit(log);
  }

  /**
   * バッファのフラッシュ
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // バッチ挿入
    await this.writeBatchToDatabase(logsToFlush);

    // Fluent Bitへの転送
    for (const log of logsToFlush) {
      await this.sendToFluentBit(log);
    }
  }

  /**
   * フラッシュタイマーの開始
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * データベースへの書き込み（単一）
   */
  private async writeToDatabase(log: AuditLog): Promise<void> {
    // 実装: PostgreSQL への INSERT
    // const pool = getPool();
    // await pool.query('INSERT INTO audit_logs ...', [...]);
    console.log('[AUDIT]', JSON.stringify(log));
  }

  /**
   * データベースへの書き込み（バッチ）
   */
  private async writeBatchToDatabase(logs: AuditLog[]): Promise<void> {
    // 実装: PostgreSQL への BATCH INSERT
    // const pool = getPool();
    // await pool.query('INSERT INTO audit_logs ... VALUES ...', [...]);
    logs.forEach(log => console.log('[AUDIT]', JSON.stringify(log)));
  }

  /**
   * Fluent Bit への転送
   */
  private async sendToFluentBit(log: AuditLog): Promise<void> {
    // 実装: Fluent Bit HTTP エンドポイントへの POST
    // await fetch('http://fluent-bit:9880/audit', { method: 'POST', body: JSON.stringify(log) });
  }

  /**
   * イベントコードからイベント名を取得
   */
  private getEventName(eventCode: string): string {
    const eventNames: Record<string, string> = {
      'AUTH_LOGIN_SUCCESS': 'ログイン成功',
      'AUTH_LOGIN_FAILURE': 'ログイン失敗',
      'AUTH_LOGOUT': 'ログアウト',
      'DATA_USER_PROFILE_VIEW': 'プロファイル閲覧',
      'DATA_USER_PROFILE_UPDATE': 'プロファイル更新',
      'DATA_LIFEPLAN_CREATE': 'ライフプラン作成',
      'DATA_LIFEPLAN_VIEW': 'ライフプラン閲覧',
      'DATA_LIFEPLAN_UPDATE': 'ライフプラン更新',
      'DATA_LIFEPLAN_DELETE': 'ライフプラン削除',
      'SEC_BRUTE_FORCE_DETECTED': 'ブルートフォース検知',
      'SEC_CSRF_VIOLATION': 'CSRF違反',
      // ... その他のイベント
    };

    return eventNames[eventCode] || eventCode;
  }

  /**
   * イベントコードからイベント説明を取得
   */
  private getEventDescription(eventCode: string): string {
    const descriptions: Record<string, string> = {
      'AUTH_LOGIN_SUCCESS': 'ユーザーが正常にシステムにログインしました',
      'AUTH_LOGIN_FAILURE': 'ログイン試行が失敗しました（認証エラー）',
      // ... その他の説明
    };

    return descriptions[eventCode] || '';
  }

  /**
   * イベントコードから重要度を判定
   */
  private eventCodeToSeverity(eventCode: string): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' {
    if (eventCode.includes('FAILURE') || eventCode.includes('DENIED')) {
      return 'WARN';
    }
    if (eventCode.includes('DETECTED') || eventCode.includes('VIOLATION') || eventCode.includes('ATTEMPT')) {
      return 'ERROR';
    }
    if (eventCode.includes('DELETE') || eventCode.includes('PURGE')) {
      return 'WARN';
    }
    return 'INFO';
  }

  /**
   * リスクレベルから重要度を判定
   */
  private riskLevelToSeverity(riskLevel: string): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' {
    const mapping: Record<string, 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'> = {
      'LOW': 'INFO',
      'MEDIUM': 'WARN',
      'HIGH': 'ERROR',
      'CRITICAL': 'CRITICAL',
    };
    return mapping[riskLevel] || 'INFO';
  }

  /**
   * シャットダウン時のクリーンアップ
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushLogs();
  }
}

// シングルトンインスタンス
export const auditLogService = new AuditLogService();
```

### 5.2 監査ログミドルウェア実装

```typescript
// lib/audit/audit-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { auditLogService } from './audit-service';
import { AuditActor, AuditRequest, AuditResponse } from '@/types/audit';

/**
 * リクエストからアクター情報を抽出
 */
export function extractActorFromRequest(req: NextRequest): Partial<AuditActor> {
  const userId = req.headers.get('x-user-id') || undefined;
  const sessionId = req.headers.get('x-session-id') || undefined;

  // IPアドレスの取得（プロキシ対応）
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || '0.0.0.0';

  const userAgent = req.headers.get('user-agent') || 'unknown';

  return {
    type: userId ? 'user' : 'anonymous',
    userId,
    sessionId,
    ipAddress,
    userAgent,
  };
}

/**
 * リクエスト情報の抽出
 */
export function extractRequestInfo(req: NextRequest, requestId: string): Partial<AuditRequest> {
  const url = new URL(req.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    id: requestId,
    method: req.method,
    path: url.pathname,
    query: Object.keys(query).length > 0 ? query : undefined,
    contentType: req.headers.get('content-type') || undefined,
    contentLength: parseInt(req.headers.get('content-length') || '0', 10) || undefined,
    headers: Object.fromEntries(req.headers.entries()),
  };
}

/**
 * レスポンス情報の作成
 */
export function createResponseInfo(
  statusCode: number,
  startTime: number,
  errorCode?: string,
  errorMessage?: string
): Partial<AuditResponse> {
  return {
    statusCode,
    success: statusCode >= 200 && statusCode < 400,
    errorCode,
    errorMessage,
    duration: Date.now() - startTime,
  };
}

/**
 * 監査ログミドルウェアのファクトリ
 */
export function createAuditMiddleware(options: {
  eventCode: string;
  eventType?: 'AUTH' | 'DATA' | 'ADMIN' | 'SEC' | 'SYS';
  extractTarget?: (req: NextRequest) => Partial<AuditTarget>;
  extractMetadata?: (req: NextRequest) => Record<string, unknown>;
}) {
  return async function auditMiddleware(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    const actor = extractActorFromRequest(req);
    const request = extractRequestInfo(req, requestId);
    const target = options.extractTarget?.(req);
    const metadata = options.extractMetadata?.(req);

    try {
      const response = await handler(req);

      const responseInfo = createResponseInfo(
        response.status,
        startTime
      );

      // イベントタイプに応じたログ記録
      switch (options.eventType) {
        case 'AUTH':
          await auditLogService.logAuthentication(
            options.eventCode,
            actor,
            request,
            responseInfo,
            metadata
          );
          break;
        case 'DATA':
          await auditLogService.logDataAccess(
            options.eventCode,
            actor,
            target || {},
            request,
            responseInfo,
            metadata
          );
          break;
        case 'ADMIN':
          await auditLogService.logAdminAction(
            options.eventCode,
            actor,
            target || {},
            request,
            responseInfo,
            metadata
          );
          break;
        default:
          await auditLogService.logDataAccess(
            options.eventCode,
            actor,
            target || {},
            request,
            responseInfo,
            metadata
          );
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseInfo = createResponseInfo(
        500,
        startTime,
        'INTERNAL_ERROR',
        errorMessage
      );

      await auditLogService.logDataAccess(
        options.eventCode,
        actor,
        target || {},
        request,
        responseInfo,
        { ...metadata, error: errorMessage }
      );

      throw error;
    }
  };
}
```

### 5.3 使用例

```typescript
// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auditLogService } from '@/lib/audit/audit-service';
import { extractActorFromRequest, extractRequestInfo, createResponseInfo } from '@/lib/audit/audit-middleware';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  const actor = extractActorFromRequest(req);
  const request = extractRequestInfo(req, requestId);

  try {
    const body = await req.json();
    const { email, password } = body;

    // 認証処理
    const user = await authenticateUser(email, password);

    if (user) {
      // ログイン成功
      await auditLogService.logAuthentication(
        'AUTH_LOGIN_SUCCESS',
        { ...actor, userId: user.id, username: user.name, email: user.email },
        { ...request, body: { email } }, // パスワードは含めない
        createResponseInfo(200, startTime),
        { loginMethod: 'email_password' }
      );

      return NextResponse.json({ user, message: 'Login successful' });
    } else {
      // ログイン失敗
      await auditLogService.logAuthentication(
        'AUTH_LOGIN_FAILURE',
        actor,
        { ...request, body: { email } },
        createResponseInfo(401, startTime, 'INVALID_CREDENTIALS', 'Invalid email or password'),
        { attemptedEmail: email }
      );

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await auditLogService.logAuthentication(
      'AUTH_LOGIN_FAILURE',
      actor,
      request,
      createResponseInfo(500, startTime, 'INTERNAL_ERROR', errorMessage)
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 6. SIEM連携仕様

### 6.1 Fluent Bit設定

```ini
# /etc/fluent-bit/fluent-bit.conf

[SERVICE]
    Flush         1
    Log_Level     info
    Daemon        Off
    Parsers_File  parsers.conf

# 監査ログ入力（HTTPエンドポイント）
[INPUT]
    Name              http
    Listen            0.0.0.0
    Port              9880
    Tag               audit.*

# 監査ログ入力（ファイル）
[INPUT]
    Name              tail
    Path              /var/log/lifeplan-navigator/audit/*.log
    Tag               audit.file
    Parser            json
    Refresh_Interval  5
    Mem_Buf_Limit     50MB

# コンテキスト情報の追加
[FILTER]
    Name              record_modifier
    Match             audit.*
    Record            log_source lifeplan-navigator
    Record            log_type audit

# Splunk HEC 出力
[OUTPUT]
    Name              splunk
    Match             audit.*
    Host              splunk-hec.internal
    Port              8088
    TLS               On
    TLS.Verify        On
    Splunk_Token      ${SPLUNK_HEC_TOKEN}
    Splunk_Send_Raw   Off
    Event_Index       lifeplan_audit
    Event_Sourcetype  lifeplan:audit

# Elasticsearch 出力（バックアップ）
[OUTPUT]
    Name              es
    Match             audit.*
    Host              elasticsearch.internal
    Port              9200
    Index             lifeplan-audit
    Type              _doc
    Logstash_Format   On
    Logstash_Prefix   lifeplan-audit
```

### 6.2 Splunk検知ルール例

```spl
# ブルートフォース検知
index=lifeplan_audit eventCode="AUTH_LOGIN_FAILURE"
| stats count by actor.ipAddress, actor.username
| where count > 5
| eval alert_type="BRUTE_FORCE_DETECTED"

# 不審な大量データアクセス検知
index=lifeplan_audit eventCode="DATA_*"
| stats count, sum(response.dataSize) as total_data by actor.userId
| where count > 100 OR total_data > 10000000
| eval alert_type="SUSPICIOUS_DATA_ACCESS"

# 管理者権限操作の監視
index=lifeplan_audit eventType="ADMIN"
| table timestamp, actor.username, eventCode, target.type, target.id, response.success

# 地理的異常アクセス検知
index=lifeplan_audit eventCode="AUTH_LOGIN_SUCCESS"
| iplocation actor.ipAddress
| stats dc(Country) as country_count, values(Country) as countries by actor.userId
| where country_count > 1
| eval alert_type="GEO_ANOMALY"
```

---

## 7. ログ保管・アーカイブ

### 7.1 保管期間ポリシー

| ログ種別 | Hot Storage | Warm Storage | Cold Storage | 合計保管期間 |
|---------|-------------|--------------|--------------|-------------|
| 認証ログ (AUTH) | 90日 | 275日 | 2年 | 3年 |
| データアクセスログ (DATA) | 90日 | 275日 | 6年 | 7年 |
| 管理者操作ログ (ADMIN) | 90日 | 275日 | 6年 | 7年 |
| セキュリティログ (SEC) | 90日 | 275日 | 6年 | 7年 |
| システムログ (SYS) | 30日 | 60日 | 275日 | 1年 |

### 7.2 S3 ライフサイクルポリシー

```yaml
# S3 Lifecycle Policy
lifecycle_rules:
  - id: audit-logs-lifecycle
    prefix: audit-logs/
    transitions:
      - days: 90
        storage_class: STANDARD_IA
      - days: 365
        storage_class: GLACIER
    expiration:
      days: 2555  # 7 years

  - id: security-audit-logs-lifecycle
    prefix: audit-logs/SEC/
    transitions:
      - days: 90
        storage_class: STANDARD_IA
      - days: 365
        storage_class: GLACIER_DEEP_ARCHIVE
    expiration:
      days: 2555  # 7 years (法的要件)
```

---

## 8. 完全性検証

### 8.1 ハッシュチェーン実装

```typescript
// lib/audit/integrity-service.ts

import { createHash } from 'crypto';

interface IntegrityRecord {
  periodStart: Date;
  periodEnd: Date;
  recordCount: number;
  hashChain: string;
  previousHash: string | null;
}

export class AuditIntegrityService {
  /**
   * 期間内のログのハッシュチェーンを計算
   */
  async calculateHashChain(
    logs: AuditLog[],
    previousHash: string | null
  ): Promise<string> {
    let currentHash = previousHash || '0'.repeat(64);

    for (const log of logs) {
      const logString = JSON.stringify({
        id: log.id,
        timestamp: log.timestamp,
        eventCode: log.eventCode,
        actor: log.actor,
        target: log.target,
        request: log.request,
        response: log.response,
      });

      currentHash = createHash('sha256')
        .update(currentHash + logString)
        .digest('hex');
    }

    return currentHash;
  }

  /**
   * 定期的な完全性検証
   */
  async verifyIntegrity(
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ valid: boolean; details: string }> {
    // ログの取得
    const logs = await this.getLogsForPeriod(periodStart, periodEnd);

    // 前回のハッシュを取得
    const previousRecord = await this.getPreviousIntegrityRecord(periodStart);

    // ハッシュチェーンの再計算
    const calculatedHash = await this.calculateHashChain(
      logs,
      previousRecord?.hashChain || null
    );

    // 保存されているハッシュと比較
    const storedRecord = await this.getIntegrityRecord(periodStart, periodEnd);

    if (!storedRecord) {
      return { valid: false, details: 'No integrity record found for period' };
    }

    const valid = calculatedHash === storedRecord.hashChain;

    return {
      valid,
      details: valid
        ? 'Integrity verified successfully'
        : `Hash mismatch: expected ${storedRecord.hashChain}, got ${calculatedHash}`,
    };
  }

  /**
   * 完全性レコードの保存
   */
  async saveIntegrityRecord(
    periodStart: Date,
    periodEnd: Date,
    recordCount: number,
    hashChain: string,
    previousHash: string | null
  ): Promise<void> {
    // PostgreSQL への保存
    // await pool.query('INSERT INTO audit_log_integrity ...', [...]);
  }

  private async getLogsForPeriod(start: Date, end: Date): Promise<AuditLog[]> {
    // 実装: PostgreSQL からログ取得
    return [];
  }

  private async getPreviousIntegrityRecord(before: Date): Promise<IntegrityRecord | null> {
    // 実装: 直前の完全性レコードを取得
    return null;
  }

  private async getIntegrityRecord(start: Date, end: Date): Promise<IntegrityRecord | null> {
    // 実装: 指定期間の完全性レコードを取得
    return null;
  }
}
```

---

## 9. 監視・アラート

### 9.1 監査ログ監視ダッシュボード項目

| メトリクス | 説明 | アラート閾値 |
|-----------|------|-------------|
| 認証失敗率 | 認証失敗 / 認証試行 | > 10% |
| 同一IPからの認証失敗 | IPごとの失敗回数 | > 5回/5分 |
| 管理者操作数 | 管理者イベント数 | > 50回/時間 |
| データエクスポート数 | エクスポートイベント数 | > 10回/日 |
| セキュリティイベント数 | SECイベント数 | > 0回（即時通知） |
| ログ遅延 | イベント発生〜記録の遅延 | > 5秒 |
| ログ欠損率 | 欠損ログ / 期待ログ | > 0.1% |

### 9.2 アラート設定例

```yaml
# アラート設定
alerts:
  - name: brute_force_detection
    condition: |
      eventCode == "AUTH_LOGIN_FAILURE" AND
      count(by: actor.ipAddress, window: 5m) > 5
    severity: HIGH
    notification:
      - channel: pagerduty
        priority: P1
      - channel: slack
        channel: "#security-alerts"

  - name: admin_privilege_escalation
    condition: |
      eventCode == "ADMIN_ROLE_CHANGE" AND
      target.newState.role IN ["admin", "superadmin"]
    severity: MEDIUM
    notification:
      - channel: slack
        channel: "#security-alerts"

  - name: data_exfiltration_attempt
    condition: |
      eventCode == "DATA_EXPORT" AND
      count(by: actor.userId, window: 1h) > 5
    severity: HIGH
    notification:
      - channel: pagerduty
        priority: P2
```

---

## 10. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_Log_Management.md | ログ管理設計書 |
| LifePlan_Navigator_Forensic_Procedures.md | フォレンジック手順書 |
| LifePlan_Navigator_Investigation_Capabilities.md | 調査能力構築ガイド |
| LifePlan_Navigator_Investigation_Checklist.md | 調査チェックリスト |

---

## 11. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | CSIRT Engineer |

---

## 12. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| 作成者 | CSIRT Engineer | 2025-12-11 | |
| レビュー | CSIRT Team Leader | | |
| レビュー | App Engineer | | |
| レビュー | SOC Analyst | | |
| 承認 | CISO | | |
