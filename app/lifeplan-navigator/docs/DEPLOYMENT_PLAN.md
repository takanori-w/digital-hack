# LifePlan Navigator 本番デプロイ計画書

## 1. デプロイ概要

### 1.1 リリース情報
- **バージョン**: v1.0.0
- **リリース名**: Phase 2+3 統合リリース
- **デプロイ対象**: 法令API統合、理解度チェック、設定画面拡張

### 1.2 リリース内容
| 機能 | 説明 | 優先度 |
|------|------|--------|
| 法令API統合 | e-Gov法令APIとの連携 | 高 |
| 理解度チェック | パーソナライズクイズ機能 | 高 |
| 損得評価 | 財務インパクト表示 | 高 |
| 設定画面拡張 | 全質問編集可能 | 中 |
| オンボーディング改善 | 財務情報ステップ追加 | 中 |

---

## 2. 前提条件チェックリスト

### 2.1 開発完了確認
- [x] 全機能実装完了
- [x] ユニットテスト: 44/44 PASS
- [x] ビルド成功（型エラーなし）
- [x] セキュリティ監査完了
- [ ] E2Eテスト完了
- [ ] UAT完了

### 2.2 承認状況
- [x] CISO: セキュリティ承認済み
- [ ] CTO: 技術承認
- [ ] CEO: 最終承認
- [ ] CLO: 法務確認（免責事項）

---

## 3. インフラ構成

### 3.1 本番環境
```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Load Balancer                         │
│                   (AWS ALB/NLB)                         │
└─────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐   ┌────────┐   ┌────────┐
         │ App-1  │   │ App-2  │   │ App-3  │
         │ (ECS)  │   │ (ECS)  │   │ (ECS)  │
         └────────┘   └────────┘   └────────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
              ┌───────────────────────┐
              │    Redis Cluster      │
              │   (ElastiCache)       │
              └───────────────────────┘
                           │
              ┌───────────────────────┐
              │    PostgreSQL RDS     │
              │    (Multi-AZ)         │
              └───────────────────────┘
```

### 3.2 外部API接続
| API | エンドポイント | 認証 |
|-----|---------------|------|
| e-Gov法令API | `laws.e-gov.go.jp/api/2` | APIキー不要 |

---

## 4. デプロイ手順

### 4.1 デプロイ前（D-1日）
```bash
# 1. 最終ビルド確認
npm run build

# 2. 最終テスト実行
npm run test:all

# 3. Docker イメージ作成
docker build -t lifeplan-navigator:v1.0.0 .

# 4. ECR にプッシュ
docker push ${ECR_REPO}/lifeplan-navigator:v1.0.0

# 5. ステージング環境でのスモークテスト
npm run test:e2e -- --project=staging
```

### 4.2 デプロイ当日（D-Day）

#### フェーズ1: 準備（09:00-10:00）
```bash
# 1. 本番DBバックアップ
aws rds create-db-snapshot --db-instance-identifier prod-db --db-snapshot-identifier pre-deploy-backup

# 2. ロールバック用イメージタグ確認
PREVIOUS_VERSION=$(aws ecs describe-services --cluster prod --services app | jq -r '.services[0].taskDefinition')
echo "Rollback version: ${PREVIOUS_VERSION}"
```

#### フェーズ2: Blue-Greenデプロイ（10:00-11:00）
```bash
# 1. 新タスク定義登録
aws ecs register-task-definition --cli-input-json file://task-definition-v1.0.0.json

# 2. サービス更新（カナリアデプロイ）
aws ecs update-service \
  --cluster prod \
  --service app \
  --task-definition lifeplan-navigator:v1.0.0 \
  --deployment-configuration "minimumHealthyPercent=100,maximumPercent=150"

# 3. ヘルスチェック監視
watch -n 5 'aws ecs describe-services --cluster prod --services app | jq ".services[0].deployments"'
```

#### フェーズ3: 検証（11:00-12:00）
```bash
# 1. スモークテスト
curl -s https://lifeplan-navigator.example.com/api/health | jq

# 2. 主要機能動作確認
# - ログイン/ログアウト
# - ダッシュボード表示
# - 理解度チェック実行
# - 法令検索

# 3. エラーログ確認
aws logs tail /ecs/lifeplan-navigator --since 1h
```

### 4.3 ロールバック手順（緊急時）
```bash
# 1. 前バージョンに切り戻し
aws ecs update-service \
  --cluster prod \
  --service app \
  --task-definition ${PREVIOUS_VERSION}

# 2. キャッシュクリア
aws elasticache delete-cache-cluster --cache-cluster-id prod-cache

# 3. 障害報告
# Slackチャンネル #incident に報告
```

---

## 5. 監視・アラート

### 5.1 監視項目
| メトリクス | 閾値 | アクション |
|-----------|------|-----------|
| エラー率 | > 1% | Slack通知 |
| レスポンスタイム | > 3秒 | Slack通知 |
| CPU使用率 | > 80% | オートスケール |
| メモリ使用率 | > 85% | オートスケール |

### 5.2 ダッシュボード
- CloudWatch Dashboard: `lifeplan-navigator-prod`
- Grafana: `https://grafana.example.com/d/lifeplan`

---

## 6. コミュニケーション計画

### 6.1 デプロイ通知
| タイミング | 対象 | チャネル |
|-----------|------|----------|
| D-1日 17:00 | 全社 | メール |
| D-Day 09:00 | 技術チーム | Slack #deploy |
| D-Day 12:00 | 全社 | メール（完了報告） |

### 6.2 緊急連絡先
| 役割 | 担当者 | 連絡先 |
|------|--------|--------|
| デプロイ責任者 | App Engineer | - |
| インフラ担当 | Network Engineer | - |
| セキュリティ | CISO | - |
| 意思決定者 | CTO | - |

---

## 7. リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 法令API障害 | 中 | フォールバック表示（ローカルキャッシュ） |
| DB接続障害 | 高 | Multi-AZ構成、自動フェイルオーバー |
| デプロイ失敗 | 高 | Blue-Green、即時ロールバック可能 |
| トラフィック急増 | 中 | オートスケーリング設定済み |

---

## 8. 承認

### 8.1 デプロイ承認
| 役割 | 承認者 | 署名 | 日付 |
|------|--------|------|------|
| 技術責任者 (CTO) | | | |
| セキュリティ責任者 (CISO) | | | |
| プロダクトオーナー | | | |

### 8.2 Go/No-Go 判断
- [ ] 全テスト合格
- [ ] 全承認取得
- [ ] インフラ準備完了
- [ ] ロールバック手順確認済み
- [ ] 監視設定完了

**判断**: □ Go / □ No-Go

---

*作成日: 2024年12月*
*作成者: App Engineer*
*最終更新: 2024年12月*
