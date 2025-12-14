# 本番デプロイチェックリスト

## デプロイ情報
- **バージョン**: v1.0.0
- **コミット**: 37c7f05
- **リリース名**: Phase 2+3 統合リリース
- **デプロイ日**: 2024年12月

---

## Pre-Deployment チェック

### コード品質
- [x] ユニットテスト合格 (44/44 PASS)
- [x] ビルド成功 (型エラーなし)
- [x] Lint/フォーマット確認済み
- [x] コードレビュー完了

### セキュリティ
- [x] CISO承認取得
- [x] セキュリティ監査合格
- [x] SEC-01: 個人情報フィルタリング
- [x] SEC-02: 入力長制限
- [x] SEC-03: レート制限

### テスト
- [x] UAT合格 (8/8 テストケース)
- [x] クリティカルバグ: 0件
- [x] パフォーマンス確認済み

### 承認
- [x] CISO承認
- [x] CEO承認 (CEO-004)
- [x] CTO技術承認
- [x] CLO法務確認 ✅ 2024-12-14 承認完了

---

## Deployment 手順

### Step 1: 最終確認
```bash
# ビルド確認
npm run build

# テスト実行
npm test
```

### Step 2: バックアップ
```bash
# データベースバックアップ
aws rds create-db-snapshot \
  --db-instance-identifier prod-db \
  --db-snapshot-identifier pre-v1.0.0-backup
```

### Step 3: デプロイ実行
```bash
# Docker イメージ作成
docker build -t lifeplan-navigator:v1.0.0 .

# ECR にプッシュ
docker push ${ECR_REPO}/lifeplan-navigator:v1.0.0

# ECS サービス更新 (Blue-Green)
aws ecs update-service \
  --cluster prod \
  --service app \
  --task-definition lifeplan-navigator:v1.0.0
```

### Step 4: 検証
```bash
# ヘルスチェック
curl -s https://lifeplan-navigator.example.com/api/health

# スモークテスト
# - ログイン/ログアウト確認
# - ダッシュボード表示確認
# - 理解度チェック動作確認
# - 法令検索動作確認
```

---

## Post-Deployment チェック

### 機能確認
- [ ] ダッシュボード表示
- [ ] 理解度チェック機能
- [ ] 法令検索機能
- [ ] 設定画面編集機能
- [ ] 5タブナビゲーション

### 監視確認
- [ ] エラー率 < 1%
- [ ] レスポンスタイム < 3秒
- [ ] CPU使用率 < 80%
- [ ] メモリ使用率 < 85%

---

## ロールバック手順

```bash
# 前バージョンに切り戻し
aws ecs update-service \
  --cluster prod \
  --service app \
  --task-definition ${PREVIOUS_VERSION}
```

---

## 緊急連絡先

| 役割 | 担当 |
|------|------|
| デプロイ責任者 | App Engineer |
| インフラ担当 | Network Engineer |
| セキュリティ | CISO |

---

## Go/No-Go 判定

### チェック項目
- [x] 全テスト合格
- [x] 全承認取得
- [x] インフラ準備完了
- [x] ロールバック手順確認済み

**判定**: ✅ **Go** - デプロイ開始 (2024-12-14)

---

*作成日: 2024年12月14日*
*作成者: App Engineer*
