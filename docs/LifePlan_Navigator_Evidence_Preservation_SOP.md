# LifePlan Navigator 証跡保全標準作業手順書 (SOP)

| 項目 | 内容 |
|------|------|
| ドキュメント名 | 証跡保全標準作業手順書 |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | CSIRT Engineer |
| レビュー | CSIRT Team Leader, CLO |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本文書は、LifePlan Navigator においてセキュリティインシデント発生時に、デジタル証拠を法的証拠能力を維持しながら保全するための標準作業手順を定義する。

### 1.2 適用範囲
- 全てのセキュリティインシデント
- 法的調査への対応
- 内部不正調査
- コンプライアンス監査

### 1.3 法的根拠
- 刑事訴訟法（証拠の保全）
- 個人情報保護法（記録の保持）
- 不正競争防止法（営業秘密の保護）
- GDPR Article 30（記録保持義務）

---

## 2. 証跡保全の原則

### 2.1 基本原則

| 原則 | 説明 |
|------|------|
| **完全性 (Integrity)** | 証拠が改ざんされていないことを保証 |
| **真正性 (Authenticity)** | 証拠が本物であることを証明 |
| **可用性 (Availability)** | 必要時に証拠にアクセス可能 |
| **追跡可能性 (Traceability)** | 証拠の取り扱い履歴を完全に追跡可能 |
| **最小介入 (Minimal Intervention)** | 証拠への影響を最小限に抑える |

### 2.2 揮発性順序 (Order of Volatility)

証拠収集は以下の優先順位で実施する：

```
優先度1: CPUレジスタ/キャッシュ     ← 最も揮発性が高い
優先度2: システムメモリ (RAM)
優先度3: ネットワーク接続状態
優先度4: 実行中プロセス
優先度5: 一時ファイル/セッションデータ
優先度6: ディスク（HDD/SSD）
優先度7: リモートログ/監視データ
優先度8: バックアップメディア        ← 最も揮発性が低い
```

---

## 3. 証跡保全フロー

### 3.1 全体フロー図

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        証跡保全フロー                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐                                                         │
│  │ インシデント   │                                                         │
│  │    検知       │                                                         │
│  └───────┬───────┘                                                         │
│          │                                                                  │
│          ▼                                                                  │
│  ┌───────────────┐     ┌───────────────┐                                   │
│  │ 初期評価     │────▶│ 保全要否判断  │                                   │
│  │ (15分以内)   │     │               │                                   │
│  └───────────────┘     └───────┬───────┘                                   │
│                                │                                           │
│          ┌─────────────────────┼─────────────────────┐                     │
│          │                     │                     │                     │
│          ▼                     ▼                     ▼                     │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐           │
│  │ メモリ保全   │     │ ログ保全     │     │ ディスク保全  │           │
│  │ (優先度: 高)  │     │ (優先度: 中)  │     │ (優先度: 低)  │           │
│  └───────┬───────┘     └───────┬───────┘     └───────┬───────┘           │
│          │                     │                     │                     │
│          └─────────────────────┼─────────────────────┘                     │
│                                │                                           │
│                                ▼                                           │
│                        ┌───────────────┐                                   │
│                        │ ハッシュ検証  │                                   │
│                        │ & 記録作成    │                                   │
│                        └───────┬───────┘                                   │
│                                │                                           │
│                                ▼                                           │
│                        ┌───────────────┐                                   │
│                        │ Chain of      │                                   │
│                        │ Custody 作成  │                                   │
│                        └───────┬───────┘                                   │
│                                │                                           │
│                                ▼                                           │
│                        ┌───────────────┐                                   │
│                        │ 安全な保管    │                                   │
│                        │ 場所へ移動    │                                   │
│                        └───────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 詳細手順

### 4.1 ステップ1: 初期評価と判断

#### 4.1.1 初期評価チェックリスト

```markdown
□ インシデントの性質を確認
  □ 外部攻撃（不正アクセス、マルウェア等）
  □ 内部不正（情報漏洩、権限濫用等）
  □ 偶発的インシデント（誤操作、設定ミス等）

□ 影響範囲の初期評価
  □ 影響を受けたシステム数
  □ 影響を受けた可能性のあるデータ種別
  □ 影響を受けた可能性のあるユーザー数

□ 保全の緊急度判断
  □ 揮発性データの存在有無
  □ システム稼働継続の必要性
  □ 攻撃者による証拠隠滅の可能性

□ 法的考慮事項
  □ 法執行機関への通報要否
  □ 規制当局への報告要否
  □ 訴訟の可能性
```

#### 4.1.2 保全優先度判定マトリクス

| インシデント種別 | メモリ保全 | ログ保全 | ディスク保全 | 優先度 |
|-----------------|----------|---------|-------------|--------|
| マルウェア感染 | 必須 | 必須 | 必須 | P0 |
| 不正アクセス（進行中） | 必須 | 必須 | 推奨 | P0 |
| 不正アクセス（過去） | 不要 | 必須 | 推奨 | P1 |
| データ漏洩（進行中） | 推奨 | 必須 | 必須 | P0 |
| データ漏洩（検知済み） | 不要 | 必須 | 推奨 | P1 |
| 内部不正 | 状況次第 | 必須 | 必須 | P1 |
| ランサムウェア | 必須 | 必須 | 必須 | P0 |

### 4.2 ステップ2: メモリ保全

#### 4.2.1 Linux環境（LifePlan Navigator本番サーバー）

```bash
#!/bin/bash
# memory_preservation.sh - メモリ保全スクリプト

# 変数設定
INCIDENT_ID="${1:-INC-$(date +%Y%m%d-%H%M%S)}"
EVIDENCE_DIR="/forensics/evidence/${INCIDENT_ID}/memory"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HOSTNAME=$(hostname)

# 準備
echo "[$(date -Iseconds)] Starting memory preservation for ${INCIDENT_ID}"
mkdir -p "${EVIDENCE_DIR}"

# 保全者情報記録
cat << EOF > "${EVIDENCE_DIR}/preservation_info.txt"
Incident ID: ${INCIDENT_ID}
Hostname: ${HOSTNAME}
Timestamp: $(date -Iseconds)
Preserved By: $(whoami)
Kernel: $(uname -r)
Memory Size: $(free -h | grep Mem | awk '{print $2}')
EOF

# LiMEによるメモリダンプ
echo "[$(date -Iseconds)] Acquiring memory dump with LiME..."
LIME_MODULE="/opt/forensics/lime-$(uname -r).ko"
MEMORY_FILE="${EVIDENCE_DIR}/${HOSTNAME}_memory_${TIMESTAMP}.lime"

if [[ -f "${LIME_MODULE}" ]]; then
    sudo insmod "${LIME_MODULE}" "path=${MEMORY_FILE} format=lime"
    sudo rmmod lime

    # ハッシュ計算
    echo "[$(date -Iseconds)] Calculating hashes..."
    sha256sum "${MEMORY_FILE}" > "${MEMORY_FILE}.sha256"
    md5sum "${MEMORY_FILE}" > "${MEMORY_FILE}.md5"

    echo "[$(date -Iseconds)] Memory preservation complete"
    echo "File: ${MEMORY_FILE}"
    echo "SHA256: $(cat ${MEMORY_FILE}.sha256)"
else
    echo "[ERROR] LiME module not found: ${LIME_MODULE}"
    exit 1
fi
```

#### 4.2.2 AWS EC2環境

```bash
#!/bin/bash
# ec2_memory_preservation.sh - EC2メモリ保全

INSTANCE_ID="${1}"
INCIDENT_ID="${2:-INC-$(date +%Y%m%d-%H%M%S)}"

echo "[*] Preserving memory for EC2 instance: ${INSTANCE_ID}"

# SSM経由でメモリダンプ実行
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters '{"commands":["bash /opt/forensics/memory_preservation.sh '"${INCIDENT_ID}"'"]}' \
    --query 'Command.CommandId' \
    --output text)

echo "[*] SSM Command ID: ${COMMAND_ID}"

# 完了待機
aws ssm wait command-executed \
    --instance-id "${INSTANCE_ID}" \
    --command-id "${COMMAND_ID}"

# 結果取得
aws ssm get-command-invocation \
    --instance-id "${INSTANCE_ID}" \
    --command-id "${COMMAND_ID}" \
    --query 'StandardOutputContent' \
    --output text
```

### 4.3 ステップ3: ログ保全

#### 4.3.1 アプリケーションログ保全

```bash
#!/bin/bash
# log_preservation.sh - ログ保全スクリプト

INCIDENT_ID="${1:-INC-$(date +%Y%m%d-%H%M%S)}"
EVIDENCE_DIR="/forensics/evidence/${INCIDENT_ID}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "[$(date -Iseconds)] Starting log preservation for ${INCIDENT_ID}"
mkdir -p "${EVIDENCE_DIR}"/{app,web,db,system,aws}

# アプリケーションログ
echo "[$(date -Iseconds)] Preserving application logs..."
if [[ -d "/var/log/lifeplan-navigator" ]]; then
    cp -rp /var/log/lifeplan-navigator/* "${EVIDENCE_DIR}/app/"
fi

# Webサーバーログ
echo "[$(date -Iseconds)] Preserving web server logs..."
if [[ -d "/var/log/nginx" ]]; then
    cp -rp /var/log/nginx/* "${EVIDENCE_DIR}/web/"
fi

# データベースログ（PostgreSQL）
echo "[$(date -Iseconds)] Preserving database logs..."
PGDATA="${PGDATA:-/var/lib/postgresql/14/main}"
if [[ -d "${PGDATA}/log" ]]; then
    cp -rp "${PGDATA}/log/"* "${EVIDENCE_DIR}/db/"
fi

# システムログ
echo "[$(date -Iseconds)] Preserving system logs..."
LOG_FILES=(
    "/var/log/auth.log"
    "/var/log/syslog"
    "/var/log/kern.log"
    "/var/log/secure"
)
for log_file in "${LOG_FILES[@]}"; do
    [[ -f "$log_file" ]] && cp -p "$log_file" "${EVIDENCE_DIR}/system/"
done

# systemdジャーナル
journalctl --since "7 days ago" -o json > "${EVIDENCE_DIR}/system/journal.json"

# ハッシュ計算
echo "[$(date -Iseconds)] Calculating hashes..."
find "${EVIDENCE_DIR}" -type f -exec sha256sum {} \; > "${EVIDENCE_DIR}/log_hashes.sha256"

echo "[$(date -Iseconds)] Log preservation complete"
echo "Evidence directory: ${EVIDENCE_DIR}"
```

#### 4.3.2 AWSログ保全

```bash
#!/bin/bash
# aws_log_preservation.sh - AWSログ保全

INCIDENT_ID="${1:-INC-$(date +%Y%m%d-%H%M%S)}"
START_DATE="${2:-$(date -d '30 days ago' +%Y-%m-%d)}"
EVIDENCE_DIR="/forensics/evidence/${INCIDENT_ID}/logs/aws"

mkdir -p "${EVIDENCE_DIR}"/{cloudtrail,flowlogs,rds,cloudwatch}

echo "[*] Preserving AWS logs from ${START_DATE}..."

# CloudTrailログ
echo "[*] CloudTrail logs..."
aws cloudtrail lookup-events \
    --start-time "${START_DATE}T00:00:00Z" \
    --end-time "$(date +%Y-%m-%d)T23:59:59Z" \
    --max-results 10000 \
    --output json > "${EVIDENCE_DIR}/cloudtrail/events.json"

# VPC Flow Logs（S3からダウンロード）
echo "[*] VPC Flow Logs..."
FLOWLOG_BUCKET="lifeplan-flowlogs"
aws s3 sync "s3://${FLOWLOG_BUCKET}/" "${EVIDENCE_DIR}/flowlogs/" \
    --include "*$(date -d ${START_DATE} +%Y/%m)/*"

# RDS監査ログ
echo "[*] RDS audit logs..."
DB_INSTANCE="lifeplan-db-prod"
for log_file in $(aws rds describe-db-log-files \
    --db-instance-identifier "${DB_INSTANCE}" \
    --query 'DescribeDBLogFiles[].LogFileName' \
    --output text); do
    aws rds download-db-log-file-portion \
        --db-instance-identifier "${DB_INSTANCE}" \
        --log-file-name "${log_file}" \
        --output text > "${EVIDENCE_DIR}/rds/${log_file//\//_}"
done

# CloudWatch Logs
echo "[*] CloudWatch Logs..."
LOG_GROUPS=(
    "/aws/lambda/lifeplan-api"
    "/aws/ecs/lifeplan-backend"
)
for log_group in "${LOG_GROUPS[@]}"; do
    aws logs filter-log-events \
        --log-group-name "${log_group}" \
        --start-time $(date -d "${START_DATE}" +%s)000 \
        --output json > "${EVIDENCE_DIR}/cloudwatch/${log_group//\//_}.json"
done

# ハッシュ計算
find "${EVIDENCE_DIR}" -type f -exec sha256sum {} \; > "${EVIDENCE_DIR}/aws_log_hashes.sha256"

echo "[*] AWS log preservation complete"
```

### 4.4 ステップ4: ディスク保全

#### 4.4.1 物理サーバー

```bash
#!/bin/bash
# disk_preservation.sh - ディスク保全スクリプト

DEVICE="${1:-/dev/sda}"
INCIDENT_ID="${2:-INC-$(date +%Y%m%d-%H%M%S)}"
EVIDENCE_DIR="/forensics/evidence/${INCIDENT_ID}/disk"

echo "[$(date -Iseconds)] Starting disk preservation for ${DEVICE}"
mkdir -p "${EVIDENCE_DIR}"

# Write Blocker確認
echo "[!] Ensure hardware write blocker is connected!"
read -p "Write blocker connected? (yes/no): " confirm
if [[ "${confirm}" != "yes" ]]; then
    echo "[ERROR] Aborting - write blocker required"
    exit 1
fi

# E01形式でイメージ作成（ewfacquire）
IMAGE_NAME="${EVIDENCE_DIR}/$(hostname)_disk_$(date +%Y%m%d_%H%M%S)"

echo "[$(date -Iseconds)] Creating forensic image..."
ewfacquire "${DEVICE}" \
    -t "${IMAGE_NAME}" \
    -C "Incident ID: ${INCIDENT_ID}" \
    -D "LifePlan Navigator Server Disk" \
    -E "CSIRT Engineer" \
    -e "csirt@example.com" \
    -N "Forensic evidence acquisition" \
    -m removable \
    -c best \
    -S 4G

# 検証
echo "[$(date -Iseconds)] Verifying image..."
ewfverify "${IMAGE_NAME}.E01"

echo "[$(date -Iseconds)] Disk preservation complete"
```

#### 4.4.2 AWS EBSボリューム

```bash
#!/bin/bash
# ebs_preservation.sh - EBSボリューム保全

VOLUME_ID="${1}"
INCIDENT_ID="${2:-INC-$(date +%Y%m%d-%H%M%S)}"

echo "[*] Creating forensic snapshot for volume: ${VOLUME_ID}"

# スナップショット作成
SNAPSHOT_ID=$(aws ec2 create-snapshot \
    --volume-id "${VOLUME_ID}" \
    --description "Forensic Evidence - ${INCIDENT_ID}" \
    --tag-specifications "ResourceType=snapshot,Tags=[
        {Key=IncidentId,Value=${INCIDENT_ID}},
        {Key=Purpose,Value=Forensics},
        {Key=CreatedAt,Value=$(date -Iseconds)},
        {Key=CreatedBy,Value=$(whoami)}
    ]" \
    --query 'SnapshotId' \
    --output text)

echo "[*] Snapshot ID: ${SNAPSHOT_ID}"

# 完了待機
echo "[*] Waiting for snapshot completion..."
aws ec2 wait snapshot-completed --snapshot-ids "${SNAPSHOT_ID}"

# スナップショットをコピー（暗号化）
echo "[*] Copying snapshot with encryption..."
ENCRYPTED_SNAPSHOT_ID=$(aws ec2 copy-snapshot \
    --source-region "$(aws configure get region)" \
    --source-snapshot-id "${SNAPSHOT_ID}" \
    --encrypted \
    --kms-key-id "alias/forensics-key" \
    --description "Encrypted Forensic Evidence - ${INCIDENT_ID}" \
    --query 'SnapshotId' \
    --output text)

echo "[*] Encrypted Snapshot ID: ${ENCRYPTED_SNAPSHOT_ID}"

# メタデータ記録
cat << EOF > "/forensics/evidence/${INCIDENT_ID}/ebs_snapshot_info.json"
{
    "incident_id": "${INCIDENT_ID}",
    "original_volume_id": "${VOLUME_ID}",
    "snapshot_id": "${SNAPSHOT_ID}",
    "encrypted_snapshot_id": "${ENCRYPTED_SNAPSHOT_ID}",
    "created_at": "$(date -Iseconds)",
    "created_by": "$(whoami)"
}
EOF

echo "[*] EBS preservation complete"
```

---

## 5. Chain of Custody（証拠保管連鎖）

### 5.1 Chain of Custody フォーム

```markdown
# CHAIN OF CUSTODY FORM

## Evidence Information
| Field | Value |
|-------|-------|
| **Evidence ID** | FOR-YYYYMMDD-XXX |
| **Incident ID** | INC-YYYYMMDD-XXX |
| **Description** | [証拠の詳細説明] |
| **Evidence Type** | Memory / Disk / Log / Network |

## Collection Information
| Field | Value |
|-------|-------|
| **Collection Date/Time** | YYYY-MM-DD HH:MM:SS JST |
| **Collection Location** | [物理的/論理的場所] |
| **Collected By** | [担当者名] |
| **Collection Method** | [使用したツール/手法] |
| **Collection Tool Version** | [ツールバージョン] |

## Integrity Verification
| Algorithm | Hash Value |
|-----------|------------|
| **SHA-256** | [64文字のハッシュ値] |
| **MD5** | [32文字のハッシュ値] |

## Storage Information
| Field | Value |
|-------|-------|
| **Current Location** | [保管場所] |
| **Storage Media** | [媒体種別] |
| **Encryption** | Yes / No (Method: _______) |
| **Access Restrictions** | [アクセス制限] |

## Transfer Log
| # | Date/Time | From | To | Reason | Hash Verified | Signatures |
|---|-----------|------|----|---------|--------------:|------------|
| 1 | YYYY-MM-DD HH:MM | [転送元] | [転送先] | [理由] | ☑ Yes / ☐ No | _______ / _______ |
| 2 | | | | | | |

## Access Log
| # | Date/Time | Accessor | Purpose | Authorized By |
|---|-----------|----------|---------|---------------|
| 1 | YYYY-MM-DD HH:MM | [アクセス者] | [目的] | [承認者] |
| 2 | | | | |

## Notes
[特記事項があれば記載]

---
**Form Version**: 1.0
**Last Updated**: 2025-12-11
```

### 5.2 Chain of Custody 記録スクリプト

```bash
#!/bin/bash
# record_chain_of_custody.sh - CoC記録スクリプト

EVIDENCE_ID="${1}"
ACTION="${2}"  # COLLECT, TRANSFER, ACCESS, VERIFY
EVIDENCE_DIR="/forensics/evidence"

COC_FILE="${EVIDENCE_DIR}/${EVIDENCE_ID}/chain_of_custody.json"

# 既存のCoCファイルを読み込むか新規作成
if [[ -f "${COC_FILE}" ]]; then
    COC=$(cat "${COC_FILE}")
else
    COC='{"evidence_id":"'"${EVIDENCE_ID}"'","records":[]}'
fi

# 新しいレコードを追加
NEW_RECORD=$(cat << EOF
{
    "timestamp": "$(date -Iseconds)",
    "action": "${ACTION}",
    "performed_by": "$(whoami)",
    "hostname": "$(hostname)",
    "ip_address": "$(hostname -I | awk '{print $1}')",
    "notes": "${3:-}"
}
EOF
)

# JSONに追加
echo "${COC}" | jq --argjson record "${NEW_RECORD}" '.records += [$record]' > "${COC_FILE}"

echo "[*] Chain of Custody updated: ${COC_FILE}"
```

---

## 6. 証拠保管要件

### 6.1 物理的保管

| 要件 | 仕様 |
|------|------|
| **保管ロッカー** | 施錠可能、二重鍵管理 |
| **アクセス制御** | 入退室ログ記録、生体認証推奨 |
| **環境条件** | 温度20-25°C、湿度40-60%RH |
| **静電気対策** | 帯電防止袋・マット使用 |
| **ラベリング** | 証拠ID、日時、担当者を明記 |

### 6.2 電子的保管

| 要件 | 仕様 |
|------|------|
| **暗号化** | AES-256以上（保存時） |
| **アクセス制御** | RBAC、最小権限の原則 |
| **完全性検証** | 定期的なハッシュ値検証（週次） |
| **バックアップ** | 3-2-1ルール（3コピー、2種類の媒体、1オフサイト） |
| **監査ログ** | 全アクセスを記録 |

### 6.3 保管期間

| 証拠種別 | 保管期間 | 根拠 |
|---------|---------|------|
| セキュリティインシデント関連 | 7年 | 法的時効考慮 |
| 訴訟関連 | 訴訟終結まで | 法務部指示 |
| 監査証跡 | 5年 | ISO 27001要件 |
| 規制報告関連 | 10年 | 金融規制 |

---

## 7. 証拠廃棄手順

### 7.1 廃棄承認フロー

```
[保管期限到来] → [廃棄申請] → [法務確認] → [CISO承認] → [廃棄実行] → [記録保存]
```

### 7.2 廃棄手順

```bash
#!/bin/bash
# evidence_disposal.sh - 証拠廃棄スクリプト

EVIDENCE_ID="${1}"
APPROVAL_REFERENCE="${2}"  # 承認番号

echo "[*] Evidence Disposal Process"
echo "[*] Evidence ID: ${EVIDENCE_ID}"
echo "[*] Approval Reference: ${APPROVAL_REFERENCE}"

# 承認確認
read -p "Disposal approved by CISO? (yes/no): " confirm
if [[ "${confirm}" != "yes" ]]; then
    echo "[ERROR] Disposal not approved"
    exit 1
fi

EVIDENCE_DIR="/forensics/evidence/${EVIDENCE_ID}"
DISPOSAL_LOG="/forensics/disposal/disposal_log.json"

# 廃棄前のハッシュ記録
echo "[*] Recording final hashes..."
find "${EVIDENCE_DIR}" -type f -exec sha256sum {} \; > "/tmp/${EVIDENCE_ID}_final_hashes.txt"

# 電子データの完全消去（DoD 5220.22-M準拠）
echo "[*] Securely erasing electronic evidence..."
find "${EVIDENCE_DIR}" -type f -exec shred -vfz -n 3 {} \;

# ディレクトリ削除
rm -rf "${EVIDENCE_DIR}"

# 廃棄記録
DISPOSAL_RECORD=$(cat << EOF
{
    "evidence_id": "${EVIDENCE_ID}",
    "disposal_timestamp": "$(date -Iseconds)",
    "approval_reference": "${APPROVAL_REFERENCE}",
    "performed_by": "$(whoami)",
    "method": "DoD 5220.22-M (3-pass overwrite)",
    "witness": "[立会者名を入力]"
}
EOF
)

echo "${DISPOSAL_RECORD}" >> "${DISPOSAL_LOG}"

echo "[*] Disposal complete. Record saved to: ${DISPOSAL_LOG}"
```

---

## 8. 検証手順

### 8.1 定期完全性検証

```bash
#!/bin/bash
# verify_evidence_integrity.sh - 証拠完全性検証

EVIDENCE_BASE="/forensics/evidence"
VERIFICATION_LOG="/forensics/verification/$(date +%Y%m%d)_verification.log"

echo "[$(date -Iseconds)] Starting evidence integrity verification" | tee -a "${VERIFICATION_LOG}"

for evidence_dir in "${EVIDENCE_BASE}"/*/; do
    EVIDENCE_ID=$(basename "${evidence_dir}")
    HASH_FILE="${evidence_dir}/file_hashes.sha256"

    if [[ -f "${HASH_FILE}" ]]; then
        echo "[*] Verifying: ${EVIDENCE_ID}" | tee -a "${VERIFICATION_LOG}"

        # ハッシュ検証
        cd "${evidence_dir}"
        if sha256sum -c "${HASH_FILE}" >> "${VERIFICATION_LOG}" 2>&1; then
            echo "[OK] ${EVIDENCE_ID}: Integrity verified" | tee -a "${VERIFICATION_LOG}"
        else
            echo "[FAIL] ${EVIDENCE_ID}: INTEGRITY VIOLATION DETECTED!" | tee -a "${VERIFICATION_LOG}"
            # アラート送信
            # send_alert "Evidence integrity violation: ${EVIDENCE_ID}"
        fi
    else
        echo "[WARN] ${EVIDENCE_ID}: No hash file found" | tee -a "${VERIFICATION_LOG}"
    fi
done

echo "[$(date -Iseconds)] Verification complete" | tee -a "${VERIFICATION_LOG}"
```

---

## 9. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_Forensic_Procedures.md | フォレンジック手順書 |
| LifePlan_Navigator_Investigation_Tools.md | 調査ツールキット |
| LifePlan_Navigator_Investigation_Checklist.md | 調査チェックリスト |

---

## 10. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | CSIRT Engineer |

---

## 11. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| 作成者 | CSIRT Engineer | 2025-12-11 | |
| レビュー | CSIRT Team Leader | | |
| 法務確認 | CLO | | |
| 承認 | CISO | | |

---

**Document Classification**: Confidential
**Review Cycle**: Quarterly
**Next Review**: 2026-03-11
