# LifePlan Navigator フォレンジック・調査機能 実装サマリー

**作成日**: 2025-12-11
**作成者**: CSIRT Engineer
**宛先**: CSIRT Team Leader, App Engineer

---

## 1. 実装完了項目

### 1.1 ドキュメント作成

| ドキュメント | 状態 | 説明 |
|-------------|------|------|
| `LifePlan_Navigator_Log_Management.md` | ✅ 作成済み | ログ収集・保管・SIEM連携設計 |
| `LifePlan_Navigator_Forensic_Procedures.md` | ✅ 作成済み | フォレンジック手順書 |
| `LifePlan_Navigator_Investigation_Capabilities.md` | ✅ 作成済み | 調査能力構築ガイド |
| `LifePlan_Navigator_Investigation_Checklist.md` | ✅ 作成済み | シナリオ別調査チェックリスト |
| `LifePlan_Navigator_Audit_Log_Technical_Spec.md` | ✅ 新規作成 | 監査ログシステム技術仕様 |
| `LifePlan_Navigator_Investigation_Tools.md` | ✅ 新規作成 | インシデント調査ツールキット |
| `LifePlan_Navigator_Evidence_Preservation_SOP.md` | ✅ 新規作成 | 証跡保全標準作業手順書 |

### 1.2 実装コード

| ファイル | 状態 | 説明 |
|---------|------|------|
| `src/types/audit.ts` | ✅ 新規作成 | 監査ログ型定義 |
| `src/lib/audit/audit-service.ts` | ✅ 新規作成 | 監査ログサービス実装 |
| `src/lib/audit/audit-middleware.ts` | ✅ 新規作成 | 監査ログミドルウェア |
| `src/lib/audit/index.ts` | ✅ 新規作成 | モジュールエントリポイント |

---

## 2. CSIRT Team Leader への連携事項

### 2.1 レビュー依頼

以下のドキュメントのレビューをお願いします：

1. **監査ログ技術仕様書** (`LifePlan_Navigator_Audit_Log_Technical_Spec.md`)
   - 監査対象イベントの妥当性
   - ログ保管期間の適切性
   - SIEM連携設計の整合性

2. **調査ツールキット** (`LifePlan_Navigator_Investigation_Tools.md`)
   - ツール選定の妥当性
   - 自動化スクリプトの有効性
   - 運用上の課題

3. **証跡保全SOP** (`LifePlan_Navigator_Evidence_Preservation_SOP.md`)
   - 法的要件への準拠
   - Chain of Custody 手順の適切性
   - CLOとの連携ポイント

### 2.2 承認事項

- [ ] 監査ログイベント定義の最終承認
- [ ] 調査ツールの本番環境展開承認
- [ ] 証跡保全手順の運用開始承認

### 2.3 インシデント対応訓練への組み込み

新しいツールキットを使用したインシデント対応訓練の実施を提案します：
- **推奨時期**: 2025年12月中
- **シナリオ例**: データ漏洩インシデントのフォレンジック調査

---

## 3. App Engineer への連携事項

### 3.1 監査ログ機能の統合

監査ログサービス (`src/lib/audit/`) をアプリケーションに統合するための作業が必要です。

#### 3.1.1 統合が必要な箇所

| エンドポイント/機能 | イベントコード | 優先度 |
|-------------------|---------------|--------|
| ログイン処理 | `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE` | P0 |
| ログアウト処理 | `AUTH_LOGOUT` | P0 |
| ユーザープロファイル閲覧 | `DATA_USER_PROFILE_VIEW` | P1 |
| ユーザープロファイル更新 | `DATA_USER_PROFILE_UPDATE` | P1 |
| ライフプラン作成 | `DATA_LIFEPLAN_CREATE` | P1 |
| ライフプラン閲覧 | `DATA_LIFEPLAN_VIEW` | P1 |
| ライフプラン更新 | `DATA_LIFEPLAN_UPDATE` | P1 |
| ライフプラン削除 | `DATA_LIFEPLAN_DELETE` | P0 |
| シミュレーション実行 | `DATA_SIMULATION_RUN` | P2 |
| データエクスポート | `DATA_EXPORT` | P0 |

#### 3.1.2 統合方法

```typescript
// 使用例: ログインエンドポイント
import { auditLog } from '@/lib/audit';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const user = await authenticateUser(email, password);

    if (user) {
      // 成功ログ
      await auditLog.loginSuccess(
        user.id,
        user.name,
        user.email,
        ipAddress,
        userAgent
      );
      return Response.json({ user });
    } else {
      // 失敗ログ
      await auditLog.loginFailure(email, ipAddress, userAgent, 'Invalid credentials');
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    await auditLog.loginFailure(email, ipAddress, userAgent, error.message);
    throw error;
  }
}
```

#### 3.1.3 ミドルウェアの使用

より簡潔に統合する場合は、`withAuditLog`ミドルウェアを使用できます：

```typescript
import { withAuditLog } from '@/lib/audit';

export const GET = withAuditLog(
  {
    eventCode: 'DATA_LIFEPLAN_VIEW',
    eventType: 'DATA',
    extractTarget: (req) => ({
      type: 'lifeplan',
      id: req.url.split('/').pop(),
    }),
  },
  async (req) => {
    // 実際の処理
    const lifeplan = await getLifeplan(id);
    return Response.json(lifeplan);
  }
);
```

### 3.2 バックエンドAPI要件

監査ログの永続化のために、以下のバックエンドAPIが必要です：

```typescript
// POST /api/internal/audit-logs
// 監査ログの書き込み（フロントエンドからの直接呼び出し用）

interface AuditLogRequest {
  logs: AuditLog[];
}

interface AuditLogResponse {
  success: boolean;
  insertedCount: number;
}
```

### 3.3 データベース要件

PostgreSQLに監査ログテーブルを作成する必要があります。DDLは技術仕様書（`LifePlan_Navigator_Audit_Log_Technical_Spec.md`）のセクション4.2を参照してください。

### 3.4 環境変数

以下の環境変数を設定してください：

```env
# 監査ログ設定
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production

# 監査ログエンドポイント（オプション）
AUDIT_LOG_ENDPOINT=http://fluent-bit:9880/audit

# データベース接続（監査用）
AUDIT_DB_HOST=localhost
AUDIT_DB_PORT=5432
AUDIT_DB_NAME=lifeplan_audit
AUDIT_DB_USER=audit_writer
```

---

## 4. 次のステップ

### 4.1 即時対応（1週間以内）

| タスク | 担当 | 期限 |
|--------|------|------|
| ドキュメントレビュー | CSIRT Team Leader | 2025-12-18 |
| 監査ログテーブル作成 | App Engineer | 2025-12-18 |
| 認証エンドポイントへの監査ログ統合 | App Engineer | 2025-12-18 |

### 4.2 短期対応（2週間以内）

| タスク | 担当 | 期限 |
|--------|------|------|
| 全データアクセスAPIへの監査ログ統合 | App Engineer | 2025-12-25 |
| 調査ツールキットの本番環境展開 | CSIRT Engineer | 2025-12-25 |
| Fluent Bit設定・SIEM連携 | SOC Analyst | 2025-12-25 |

### 4.3 中期対応（1ヶ月以内）

| タスク | 担当 | 期限 |
|--------|------|------|
| インシデント対応訓練実施 | CSIRT Team | 2026-01-15 |
| 検知ルールの作成・チューニング | CTI Analyst | 2026-01-15 |
| 運用手順の最終確定 | CSIRT Team Leader | 2026-01-15 |

---

## 5. 質問・懸念事項

### App Engineer への質問

1. 現在のバックエンドAPIの構成は？（Express/Fastify/その他）
2. データベースマイグレーションツールは使用していますか？
3. ログ出力の既存実装はありますか？

### CSIRT Team Leader への確認事項

1. 法務（CLO）との事前調整は必要ですか？
2. 監査ログへのアクセス権限の承認フローは？
3. インシデント対応訓練の優先度は？

---

## 6. 連絡先

質問や懸念事項がありましたら、以下までご連絡ください：

- **CSIRT Engineer**: [内線/Slack]
- **緊急時**: CSIRT Team Leader経由

---

**Document Classification**: Internal Use Only
**Last Updated**: 2025-12-11
