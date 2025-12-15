# LifePlan Navigator 復旧手順書

**Version**: 1.0
**Last Updated**: 2025-12-11
**Document Owner**: CSIRT Engineer
**Classification**: Internal Use Only

---

## 1. 概要

### 1.1 目的
本文書は、LifePlan Navigator（個人ライフプラン支援Webアプリ）においてセキュリティインシデント発生後、システムを安全かつ迅速に復旧するための手順を定義する。

### 1.2 復旧フェーズ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        復旧プロセス概要                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐ │
│   │  根絶   │ → │ 復旧準備 │ → │  復旧   │ → │  検証   │ → │ 再開判断 │ │
│   │Eradicate│   │ Prepare │   │ Recover │   │ Verify  │   │ Decision │ │
│   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘ │
│       │             │             │             │             │         │
│       ▼             ▼             ▼             ▼             ▼         │
│   マルウェア    バックアップ    システム     セキュリティ    サービス    │
│   除去・      確認・         再構築・      スキャン・      再開       │
│   パッチ適用   復旧計画       データ復元    ペネトレ       承認       │
│                                           テスト                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 関連フレームワーク

- NIST SP 800-61 Rev.2 (Computer Security Incident Handling Guide)
- SANS PICERL (Recovery Phase)
- ISO 27035 (Information Security Incident Management)

---

## 2. 根絶フェーズ（Eradication）

### 2.1 マルウェア除去手順

#### 2.1.1 感染ホストの特定と隔離確認

```bash
#!/bin/bash
# verify_isolation.sh - 隔離状態の確認

INFECTED_HOSTS="host1 host2 host3"

for HOST in $INFECTED_HOSTS; do
    echo "[*] Checking isolation status for $HOST..."

    # ネットワーク接続確認
    ping -c 1 -W 2 $HOST > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "[!] WARNING: $HOST is still reachable!"
    else
        echo "[+] $HOST is isolated (not reachable)"
    fi

    # EDRエージェント経由での確認（CrowdStrike例）
    # falcon_query --host $HOST --check-isolation
done
```

#### 2.1.2 マルウェア除去手順（Linux/LifePlan Navigator サーバー）

```bash
#!/bin/bash
# malware_removal.sh - マルウェア除去スクリプト

# 注意: フォレンジック完了後に実行すること

IOC_FILE=$1  # IoC一覧ファイル

if [ -z "$IOC_FILE" ]; then
    echo "Usage: $0 <ioc_file>"
    exit 1
fi

echo "[*] Starting malware removal process..."
echo "[*] IOC File: $IOC_FILE"

# 1. 悪意のあるプロセスの停止
echo "[*] Killing malicious processes..."
while read -r IOC; do
    if [[ $IOC == process:* ]]; then
        PROC_NAME=${IOC#process:}
        pkill -9 -f "$PROC_NAME" 2>/dev/null
        echo "[+] Killed process: $PROC_NAME"
    fi
done < $IOC_FILE

# 2. 悪意のあるファイルの削除
echo "[*] Removing malicious files..."
while read -r IOC; do
    if [[ $IOC == file:* ]]; then
        FILE_PATH=${IOC#file:}
        if [ -f "$FILE_PATH" ]; then
            # バックアップ（解析用）
            cp "$FILE_PATH" "/forensics/quarantine/$(basename $FILE_PATH).$(date +%s)"
            rm -f "$FILE_PATH"
            echo "[+] Removed file: $FILE_PATH"
        fi
    fi
done < $IOC_FILE

# 3. 悪意のあるcron/systemdの削除
echo "[*] Removing malicious scheduled tasks..."
while read -r IOC; do
    if [[ $IOC == cron:* ]]; then
        CRON_ENTRY=${IOC#cron:}
        crontab -l | grep -v "$CRON_ENTRY" | crontab -
        echo "[+] Removed cron entry: $CRON_ENTRY"
    fi
    if [[ $IOC == systemd:* ]]; then
        SERVICE_NAME=${IOC#systemd:}
        systemctl stop "$SERVICE_NAME" 2>/dev/null
        systemctl disable "$SERVICE_NAME" 2>/dev/null
        rm -f "/etc/systemd/system/$SERVICE_NAME"
        systemctl daemon-reload
        echo "[+] Removed systemd service: $SERVICE_NAME"
    fi
done < $IOC_FILE

# 4. 不正なユーザーアカウントの削除
echo "[*] Removing unauthorized accounts..."
while read -r IOC; do
    if [[ $IOC == user:* ]]; then
        USERNAME=${IOC#user:}
        userdel -r "$USERNAME" 2>/dev/null
        echo "[+] Removed user: $USERNAME"
    fi
done < $IOC_FILE

# 5. SSH authorized_keys のクリーンアップ
echo "[*] Cleaning SSH authorized_keys..."
find /home -name "authorized_keys" -exec grep -l "suspicious_key" {} \; | while read -r KEYFILE; do
    cp "$KEYFILE" "$KEYFILE.backup.$(date +%s)"
    grep -v "suspicious_key" "$KEYFILE" > "$KEYFILE.clean"
    mv "$KEYFILE.clean" "$KEYFILE"
    echo "[+] Cleaned: $KEYFILE"
done

echo "[*] Malware removal complete."
echo "[!] System reboot recommended."
```

### 2.2 脆弱性修正・パッチ適用

#### 2.2.1 緊急パッチ適用手順

```bash
#!/bin/bash
# emergency_patch.sh - 緊急パッチ適用

echo "[*] Starting emergency patching..."

# 1. パッケージ更新
echo "[*] Updating system packages..."
apt-get update
apt-get upgrade -y --security

# 2. LifePlan Navigator アプリケーション更新
echo "[*] Updating LifePlan Navigator application..."
cd /opt/lifeplan-navigator

# バックアップ
cp -r . ../lifeplan-navigator.backup.$(date +%Y%m%d)

# 最新版取得（セキュリティブランチ）
git fetch origin
git checkout security/hotfix-YYYYMMDD
npm install --production

# 3. Node.js / npm 脆弱性修正
echo "[*] Auditing and fixing npm vulnerabilities..."
npm audit fix --force

# 4. 設定ファイルのハードニング
echo "[*] Applying security hardening..."
# 例: デバッグモード無効化
sed -i 's/DEBUG=true/DEBUG=false/' /opt/lifeplan-navigator/.env
sed -i 's/NODE_ENV=development/NODE_ENV=production/' /opt/lifeplan-navigator/.env

echo "[*] Patching complete."
```

#### 2.2.2 Webサーバー（Nginx）セキュリティ強化

```nginx
# /etc/nginx/conf.d/security.conf - セキュリティ強化設定

# HTTPヘッダーセキュリティ
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# SSL/TLS強化
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# リクエスト制限
client_body_buffer_size 1k;
client_header_buffer_size 1k;
client_max_body_size 10m;
large_client_header_buffers 2 1k;

# 接続制限
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;

server {
    # ...
    limit_conn conn_limit 10;
    limit_req zone=req_limit burst=20 nodelay;
}
```

### 2.3 認証情報のリセット

```bash
#!/bin/bash
# credential_reset.sh - 認証情報リセット

echo "[*] Starting credential reset process..."

# 1. データベースパスワードリセット
echo "[*] Resetting database passwords..."
NEW_DB_PASS=$(openssl rand -base64 32)
sudo -u postgres psql -c "ALTER USER lifeplan_app PASSWORD '$NEW_DB_PASS';"
echo "DB_PASSWORD=$NEW_DB_PASS" >> /tmp/new_credentials.txt

# 2. アプリケーションAPIキーのローテーション
echo "[*] Rotating API keys..."
NEW_API_KEY=$(openssl rand -hex 32)
NEW_JWT_SECRET=$(openssl rand -base64 64)
echo "API_KEY=$NEW_API_KEY" >> /tmp/new_credentials.txt
echo "JWT_SECRET=$NEW_JWT_SECRET" >> /tmp/new_credentials.txt

# 3. 環境変数更新
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASS/" /opt/lifeplan-navigator/.env
sed -i "s/API_KEY=.*/API_KEY=$NEW_API_KEY/" /opt/lifeplan-navigator/.env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" /opt/lifeplan-navigator/.env

# 4. AWS認証情報ローテーション
echo "[*] Rotating AWS credentials..."
# IAMユーザーのアクセスキーローテーション
aws iam create-access-key --user-name lifeplan-app-user > /tmp/new_aws_key.json
OLD_KEY=$(aws iam list-access-keys --user-name lifeplan-app-user --query 'AccessKeyMetadata[0].AccessKeyId' --output text)
# 新しいキーが動作確認後、古いキーを削除
# aws iam delete-access-key --user-name lifeplan-app-user --access-key-id $OLD_KEY

# 5. SSHキーのローテーション
echo "[*] Rotating SSH keys..."
for USER in $(cat /etc/passwd | grep -E '/home' | cut -d: -f1); do
    if [ -d "/home/$USER/.ssh" ]; then
        # 古いキーをバックアップ
        mv /home/$USER/.ssh/authorized_keys /home/$USER/.ssh/authorized_keys.backup.$(date +%s) 2>/dev/null
        echo "[+] Cleared authorized_keys for $USER"
    fi
done

echo "[*] Credential reset complete."
echo "[!] New credentials saved to /tmp/new_credentials.txt - SECURE AND DELETE AFTER USE"
```

---

## 3. 復旧準備フェーズ

### 3.1 バックアップ検証

#### 3.1.1 バックアップ整合性確認

```bash
#!/bin/bash
# verify_backup.sh - バックアップ整合性確認

BACKUP_DIR=$1
VERIFY_DIR="/tmp/backup_verify_$(date +%s)"

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

mkdir -p $VERIFY_DIR

echo "[*] Verifying backup integrity..."

# 1. バックアップファイル一覧
echo "[*] Listing backup files..."
ls -la $BACKUP_DIR/

# 2. チェックサム検証
echo "[*] Verifying checksums..."
if [ -f "$BACKUP_DIR/checksums.sha256" ]; then
    cd $BACKUP_DIR
    sha256sum -c checksums.sha256
    if [ $? -ne 0 ]; then
        echo "[!] CHECKSUM VERIFICATION FAILED!"
        exit 1
    fi
    echo "[+] Checksum verification passed."
else
    echo "[!] No checksum file found. Manual verification required."
fi

# 3. データベースバックアップ検証
echo "[*] Verifying database backup..."
DB_BACKUP=$(ls -t $BACKUP_DIR/*.sql.gz 2>/dev/null | head -1)
if [ -n "$DB_BACKUP" ]; then
    gunzip -t "$DB_BACKUP"
    if [ $? -eq 0 ]; then
        echo "[+] Database backup is valid: $DB_BACKUP"

        # テスト復元（別DBへ）
        gunzip -c "$DB_BACKUP" | psql -U postgres -d lifeplan_verify 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "[+] Database test restore successful."
            psql -U postgres -c "DROP DATABASE lifeplan_verify;" 2>/dev/null
        fi
    else
        echo "[!] Database backup is corrupted!"
        exit 1
    fi
fi

# 4. アプリケーションバックアップ検証
echo "[*] Verifying application backup..."
APP_BACKUP=$(ls -t $BACKUP_DIR/app_*.tar.gz 2>/dev/null | head -1)
if [ -n "$APP_BACKUP" ]; then
    tar -tzf "$APP_BACKUP" > /dev/null
    if [ $? -eq 0 ]; then
        echo "[+] Application backup is valid: $APP_BACKUP"
    else
        echo "[!] Application backup is corrupted!"
        exit 1
    fi
fi

# 5. バックアップのマルウェアスキャン
echo "[*] Scanning backup for malware..."
tar -xzf "$APP_BACKUP" -C $VERIFY_DIR
clamscan -r --infected $VERIFY_DIR
if [ $? -eq 1 ]; then
    echo "[!] MALWARE DETECTED IN BACKUP!"
    exit 1
fi

echo "[+] Backup verification complete. Safe to use."
rm -rf $VERIFY_DIR
```

#### 3.1.2 クリーンバックアップの特定

```markdown
## クリーンバックアップ特定基準

### 確認事項
1. **バックアップ日時**: インシデント発生前（侵入前）であること
2. **整合性**: チェックサム検証に合格していること
3. **マルウェア**: スキャンでクリーンであること
4. **データ完全性**: テスト復元で正常動作すること

### 推奨バックアップ選択
| 優先度 | バックアップ種別 | 条件 |
|--------|----------------|------|
| 1 | 直近のクリーンバックアップ | 侵入前 + マルウェアスキャンクリア |
| 2 | オフサイトバックアップ | 侵入の影響を受けていない |
| 3 | AWS S3 バージョニング | 特定時点の復元 |
| 4 | RDSスナップショット | 侵入前の時点 |
```

### 3.2 復旧計画策定

#### 3.2.1 復旧計画テンプレート

```markdown
# LifePlan Navigator 復旧計画

## 1. 概要

| 項目 | 内容 |
|------|------|
| **Incident ID** | INC-YYYYMMDD-XXX |
| **計画作成者** | CSIRT Engineer |
| **承認者** | CISO |
| **計画日** | YYYY-MM-DD |
| **復旧開始予定** | YYYY-MM-DD HH:MM |

## 2. 復旧対象

| コンポーネント | 復旧方法 | 優先度 | 所要時間 |
|--------------|---------|--------|---------|
| Web Server (Nginx) | クリーンインストール + 設定復元 | P1 | 1h |
| App Server (Node.js) | バックアップからの復元 | P1 | 2h |
| Database (PostgreSQL) | RDSスナップショット復元 | P1 | 1h |
| Redis Cache | 再構築（データ不要） | P2 | 30m |
| File Storage (S3) | バージョニングからの復元 | P2 | 1h |

## 3. 復旧手順

### Phase 1: インフラ再構築
- [ ] 新規EC2インスタンスのプロビジョニング
- [ ] セキュリティグループの確認・強化
- [ ] VPCネットワーク設定の検証

### Phase 2: アプリケーション復元
- [ ] クリーンなアプリケーションコードのデプロイ
- [ ] 設定ファイルの復元（セキュリティ強化版）
- [ ] 依存パッケージのインストール（脆弱性修正済み）

### Phase 3: データ復元
- [ ] データベースの復元
- [ ] ファイルストレージの復元
- [ ] データ整合性の確認

### Phase 4: 検証
- [ ] 機能テスト
- [ ] セキュリティスキャン
- [ ] ペネトレーションテスト

### Phase 5: サービス再開
- [ ] DNS切り替え / ロードバランサー有効化
- [ ] 監視の有効化
- [ ] ユーザー通知

## 4. ロールバック計画

復旧後に問題が発生した場合:
1. 即座にメンテナンスモードに移行
2. 前回の安定版に切り戻し
3. 問題の調査・修正後に再度復旧を試行

## 5. コミュニケーション計画

| タイミング | 対象 | 内容 | 担当 |
|-----------|------|------|------|
| 復旧開始前 | 経営層 | 復旧計画承認依頼 | CISO |
| 復旧開始時 | 全社 | メンテナンス開始通知 | CMO |
| 復旧完了時 | 経営層 | 復旧完了報告 | CISO |
| 復旧完了時 | ユーザー | サービス再開通知 | CMO |
```

---

## 4. システム復旧手順

### 4.1 インフラ再構築（AWS環境）

#### 4.1.1 Terraformによるクリーン環境構築

```hcl
# main.tf - LifePlan Navigator 復旧用インフラ

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

# 復旧用VPC（既存VPCが侵害された場合）
resource "aws_vpc" "recovery" {
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "lifeplan-recovery-vpc"
    Environment = "recovery"
    IncidentID  = var.incident_id
  }
}

# セキュリティグループ（強化版）
resource "aws_security_group" "app_server" {
  name        = "lifeplan-recovery-app-sg"
  description = "Security group for LifePlan Navigator app server (hardened)"
  vpc_id      = aws_vpc.recovery.id

  # インバウンド: HTTPSのみ（ALB経由）
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTPS from ALB only"
  }

  # SSH: 踏み台サーバーからのみ
  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
    description     = "SSH from bastion only"
  }

  # アウトバウンド: 必要最小限
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }

  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.database.id]
    description     = "PostgreSQL to RDS"
  }

  tags = {
    Name = "lifeplan-recovery-app-sg"
  }
}

# EC2インスタンス（クリーンAMIから）
resource "aws_instance" "app_server" {
  ami                    = var.clean_ami_id  # 事前検証済みのクリーンAMI
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.private.id
  vpc_security_group_ids = [aws_security_group.app_server.id]
  iam_instance_profile   = aws_iam_instance_profile.app_server.name

  # IMDSv2強制
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # EBSの暗号化
  root_block_device {
    encrypted   = true
    volume_type = "gp3"
    volume_size = 50
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    app_version = var.app_version
  }))

  tags = {
    Name        = "lifeplan-recovery-app"
    Environment = "recovery"
  }
}

# RDS復元（スナップショットから）
resource "aws_db_instance" "database" {
  identifier             = "lifeplan-recovery-db"
  snapshot_identifier    = var.clean_snapshot_id  # クリーンなスナップショット
  instance_class         = "db.t3.medium"
  db_subnet_group_name   = aws_db_subnet_group.database.name
  vpc_security_group_ids = [aws_security_group.database.id]
  storage_encrypted      = true
  deletion_protection    = true
  skip_final_snapshot    = false

  # セキュリティ強化
  publicly_accessible    = false
  auto_minor_version_upgrade = true

  tags = {
    Name = "lifeplan-recovery-db"
  }
}

variable "incident_id" {
  description = "Incident ID for tracking"
  type        = string
}

variable "clean_ami_id" {
  description = "Verified clean AMI ID"
  type        = string
}

variable "clean_snapshot_id" {
  description = "Verified clean RDS snapshot ID"
  type        = string
}

variable "app_version" {
  description = "Application version to deploy"
  type        = string
}
```

#### 4.1.2 ユーザーデータスクリプト（初期設定）

```bash
#!/bin/bash
# user_data.sh - EC2初期化スクリプト

set -e

# ログ設定
exec > >(tee /var/log/user-data.log) 2>&1
echo "[$(date)] Starting instance initialization..."

# システム更新
apt-get update
apt-get upgrade -y

# 必須パッケージインストール
apt-get install -y \
    curl \
    git \
    nginx \
    nodejs \
    npm \
    postgresql-client \
    awscli \
    fail2ban \
    ufw

# セキュリティ強化
echo "[$(date)] Applying security hardening..."

# UFW設定
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 443/tcp
ufw --force enable

# fail2ban設定
cat << 'EOF' > /etc/fail2ban/jail.local
[sshd]
enabled = true
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true
maxretry = 3
bantime = 3600
EOF
systemctl enable fail2ban
systemctl start fail2ban

# SSHハードニング
sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config
systemctl restart sshd

# アプリケーションデプロイ
echo "[$(date)] Deploying application..."
mkdir -p /opt/lifeplan-navigator
cd /opt/lifeplan-navigator

# S3からアプリケーションパッケージ取得
aws s3 cp s3://lifeplan-deploy/releases/${app_version}/app.tar.gz .
tar -xzf app.tar.gz
rm app.tar.gz

# 依存関係インストール
npm ci --production

# サービス設定
cat << 'EOF' > /etc/systemd/system/lifeplan.service
[Unit]
Description=LifePlan Navigator Application
After=network.target

[Service]
Type=simple
User=lifeplan
WorkingDirectory=/opt/lifeplan-navigator
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# アプリケーションユーザー作成
useradd -r -s /bin/false lifeplan
chown -R lifeplan:lifeplan /opt/lifeplan-navigator

systemctl daemon-reload
systemctl enable lifeplan

echo "[$(date)] Initialization complete. Ready for configuration."
```

### 4.2 データ復旧手順

#### 4.2.1 データベース復元

```bash
#!/bin/bash
# restore_database.sh - データベース復元スクリプト

BACKUP_FILE=$1
DB_HOST=$2
DB_NAME="lifeplan_prod"
DB_USER="lifeplan_app"

if [ -z "$BACKUP_FILE" ] || [ -z "$DB_HOST" ]; then
    echo "Usage: $0 <backup_file.sql.gz> <db_host>"
    exit 1
fi

echo "[*] Starting database restoration..."

# 1. バックアップの検証
echo "[*] Verifying backup file..."
gunzip -t "$BACKUP_FILE"
if [ $? -ne 0 ]; then
    echo "[!] Backup file is corrupted!"
    exit 1
fi

# 2. 既存データベースの確認
echo "[*] Checking existing database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1
if [ $? -eq 0 ]; then
    echo "[*] Existing database found. Creating backup before overwrite..."
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U postgres -d $DB_NAME | gzip > /tmp/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz

    echo "[*] Dropping existing database..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -c "DROP DATABASE $DB_NAME;"
fi

# 3. データベース作成
echo "[*] Creating database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# 4. データ復元
echo "[*] Restoring data..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -d $DB_NAME

if [ $? -eq 0 ]; then
    echo "[+] Database restoration successful."
else
    echo "[!] Database restoration failed!"
    exit 1
fi

# 5. 整合性確認
echo "[*] Verifying restoration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM users;"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM life_plans;"

# 6. インデックス再構築
echo "[*] Rebuilding indexes..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -d $DB_NAME -c "REINDEX DATABASE $DB_NAME;"

# 7. 統計情報更新
echo "[*] Updating statistics..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -d $DB_NAME -c "ANALYZE;"

echo "[+] Database restoration complete."
```

#### 4.2.2 ファイルストレージ復元（S3）

```bash
#!/bin/bash
# restore_s3.sh - S3バケット復元スクリプト

SOURCE_BUCKET=$1  # バックアップバケットまたはバージョニング元
TARGET_BUCKET=$2
RESTORE_DATE=$3   # YYYY-MM-DD形式

if [ -z "$SOURCE_BUCKET" ] || [ -z "$TARGET_BUCKET" ]; then
    echo "Usage: $0 <source_bucket> <target_bucket> [restore_date]"
    exit 1
fi

echo "[*] Starting S3 restoration..."

# バージョニングからの復元の場合
if [ -n "$RESTORE_DATE" ]; then
    echo "[*] Restoring from version history to date: $RESTORE_DATE"

    # 指定日時点のバージョンを特定して復元
    aws s3api list-object-versions --bucket $SOURCE_BUCKET --query "Versions[?LastModified<='${RESTORE_DATE}T23:59:59Z']" --output json > /tmp/versions.json

    # 各オブジェクトの最新バージョン（指定日時点）を復元
    cat /tmp/versions.json | jq -r '.[] | "\(.Key) \(.VersionId)"' | while read -r KEY VERSION; do
        echo "[*] Restoring: $KEY (version: $VERSION)"
        aws s3api copy-object \
            --bucket $TARGET_BUCKET \
            --key "$KEY" \
            --copy-source "$SOURCE_BUCKET/$KEY?versionId=$VERSION"
    done
else
    # 単純なバケット間コピー
    echo "[*] Copying from backup bucket..."
    aws s3 sync s3://$SOURCE_BUCKET s3://$TARGET_BUCKET --delete
fi

# 復元後の検証
echo "[*] Verifying restoration..."
SOURCE_COUNT=$(aws s3 ls s3://$SOURCE_BUCKET --recursive | wc -l)
TARGET_COUNT=$(aws s3 ls s3://$TARGET_BUCKET --recursive | wc -l)

echo "[*] Source objects: $SOURCE_COUNT"
echo "[*] Target objects: $TARGET_COUNT"

if [ "$SOURCE_COUNT" -eq "$TARGET_COUNT" ]; then
    echo "[+] S3 restoration successful."
else
    echo "[!] Warning: Object count mismatch. Manual verification required."
fi
```

### 4.3 アプリケーション復元

```bash
#!/bin/bash
# restore_application.sh - アプリケーション復元スクリプト

APP_DIR="/opt/lifeplan-navigator"
BACKUP_FILE=$1
CONFIG_BACKUP=$2

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <app_backup.tar.gz> [config_backup.tar.gz]"
    exit 1
fi

echo "[*] Starting application restoration..."

# 1. 既存アプリケーションのバックアップ
if [ -d "$APP_DIR" ]; then
    echo "[*] Backing up existing application..."
    tar -czf /tmp/app_pre_restore_$(date +%Y%m%d_%H%M%S).tar.gz -C $(dirname $APP_DIR) $(basename $APP_DIR)
fi

# 2. アプリケーションの停止
echo "[*] Stopping application..."
systemctl stop lifeplan 2>/dev/null || true

# 3. アプリケーションの展開
echo "[*] Extracting application..."
rm -rf $APP_DIR/*
tar -xzf "$BACKUP_FILE" -C $APP_DIR

# 4. 設定ファイルの復元（セキュリティ強化版を適用）
echo "[*] Restoring configuration..."
if [ -n "$CONFIG_BACKUP" ] && [ -f "$CONFIG_BACKUP" ]; then
    tar -xzf "$CONFIG_BACKUP" -C $APP_DIR
fi

# セキュリティ設定の上書き
cat << 'EOF' > $APP_DIR/.env.security
# Security-hardened settings
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info
CORS_ORIGIN=https://lifeplan-navigator.example.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECURE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict
EOF

# 5. 依存関係の再インストール
echo "[*] Installing dependencies..."
cd $APP_DIR
npm ci --production

# 6. パーミッション設定
echo "[*] Setting permissions..."
chown -R lifeplan:lifeplan $APP_DIR
chmod 600 $APP_DIR/.env*

# 7. アプリケーションの起動
echo "[*] Starting application..."
systemctl start lifeplan

# 8. 起動確認
sleep 5
if systemctl is-active --quiet lifeplan; then
    echo "[+] Application started successfully."
else
    echo "[!] Application failed to start. Check logs."
    journalctl -u lifeplan -n 50
    exit 1
fi
```

---

## 5. サービス再開判断基準

### 5.1 再開前チェックリスト

```markdown
## サービス再開判断チェックリスト

### 1. 技術的検証

#### 1.1 セキュリティ検証
- [ ] 全IoC（侵害指標）の除去確認
- [ ] 脆弱性スキャン結果: Critical/High = 0
- [ ] ペネトレーションテスト合格
- [ ] WAFルールの有効化確認
- [ ] EDR/監視の有効化確認

#### 1.2 機能検証
- [ ] 主要機能の動作確認（スモークテスト）
- [ ] 認証・認可機能の正常動作
- [ ] データ整合性の確認
- [ ] パフォーマンステスト合格
- [ ] ログ出力の確認

#### 1.3 インフラ検証
- [ ] 全サーバーのヘルスチェック正常
- [ ] データベース接続正常
- [ ] キャッシュサーバー正常
- [ ] ロードバランサー設定確認
- [ ] SSL証明書有効期限確認

### 2. 運用準備

- [ ] 監視ダッシュボードの準備
- [ ] アラート閾値の設定
- [ ] オンコール体制の確立
- [ ] ロールバック手順の確認
- [ ] サポートチームへの情報共有

### 3. コミュニケーション準備

- [ ] ユーザー向け通知文の準備
- [ ] 問い合わせ対応QA準備
- [ ] プレスリリース（必要な場合）
- [ ] 関係部門への事前連絡

### 4. 承認

| 承認者 | 役職 | 署名 | 日時 |
|--------|------|------|------|
| | CISO | | |
| | CTO | | |
| | CEO（Critical時） | | |
```

### 5.2 段階的再開手順

```markdown
## 段階的サービス再開プロセス

### Stage 1: 内部テスト環境
- 対象: 開発チームのみ
- 期間: 4時間
- 確認項目: 全機能の動作確認

### Stage 2: 限定公開（カナリアリリース）
- 対象: 10%のトラフィック
- 期間: 24時間
- 確認項目:
  - エラー率 < 0.1%
  - レスポンスタイム < 200ms
  - セキュリティアラート = 0

### Stage 3: 段階的拡大
- 対象: 25% → 50% → 75%のトラフィック
- 各段階: 4時間
- ロールバック基準:
  - エラー率 > 1%
  - レスポンスタイム > 500ms
  - セキュリティアラート発生

### Stage 4: 完全復旧
- 対象: 100%のトラフィック
- 監視強化期間: 72時間
```

### 5.3 ロールバック手順

```bash
#!/bin/bash
# rollback.sh - 緊急ロールバックスクリプト

echo "[!] INITIATING EMERGENCY ROLLBACK"

# 1. トラフィック遮断
echo "[*] Redirecting traffic to maintenance page..."
aws elbv2 modify-listener \
    --listener-arn $ALB_LISTENER_ARN \
    --default-actions Type=fixed-response,FixedResponseConfig={StatusCode=503,ContentType=text/html,MessageBody="<h1>Maintenance in Progress</h1>"}

# 2. アプリケーション停止
echo "[*] Stopping application..."
systemctl stop lifeplan

# 3. 前バージョンへの切り替え
echo "[*] Rolling back to previous version..."
PREV_VERSION=$(cat /opt/lifeplan-navigator/.version.prev)
tar -xzf /opt/backups/app_${PREV_VERSION}.tar.gz -C /opt/lifeplan-navigator

# 4. データベースロールバック（必要な場合）
if [ "$ROLLBACK_DB" = "true" ]; then
    echo "[*] Rolling back database..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='lifeplan_prod';"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -c "DROP DATABASE lifeplan_prod;"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -c "ALTER DATABASE lifeplan_prod_backup RENAME TO lifeplan_prod;"
fi

# 5. アプリケーション再起動
echo "[*] Starting previous version..."
systemctl start lifeplan

# 6. ヘルスチェック
sleep 10
curl -s http://localhost:3000/health | grep -q "ok"
if [ $? -eq 0 ]; then
    echo "[+] Application is healthy."

    # 7. トラフィック再開
    echo "[*] Restoring traffic..."
    aws elbv2 modify-listener \
        --listener-arn $ALB_LISTENER_ARN \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN

    echo "[+] Rollback complete."
else
    echo "[!] Application health check failed. Manual intervention required."
    exit 1
fi
```

---

## 6. 事後対応

### 6.1 監視強化（復旧後72時間）

```yaml
# enhanced_monitoring.yaml - 復旧後の強化監視設定

alerts:
  # セキュリティアラート
  - name: "Security - Suspicious Authentication"
    condition: "auth_failure_count > 5 in 5m"
    severity: "high"
    notify: ["csirt", "soc"]

  - name: "Security - Unusual Data Access"
    condition: "db_query_rows > 1000"
    severity: "medium"
    notify: ["csirt"]

  - name: "Security - Known IoC Communication"
    condition: "destination_ip in ioc_list"
    severity: "critical"
    notify: ["csirt", "ciso"]

  # パフォーマンスアラート
  - name: "Performance - High Error Rate"
    condition: "error_rate > 0.5%"
    severity: "high"
    notify: ["ops"]

  - name: "Performance - Slow Response"
    condition: "p99_latency > 1000ms"
    severity: "medium"
    notify: ["ops"]

  # リソースアラート
  - name: "Resource - CPU High"
    condition: "cpu_usage > 80%"
    severity: "warning"
    notify: ["ops"]

  - name: "Resource - Memory High"
    condition: "memory_usage > 85%"
    severity: "warning"
    notify: ["ops"]

dashboards:
  - name: "Recovery Monitoring"
    panels:
      - title: "Request Rate"
        type: "graph"
      - title: "Error Rate"
        type: "graph"
      - title: "Response Time (p50, p95, p99)"
        type: "graph"
      - title: "Security Events"
        type: "table"
      - title: "Active Sessions"
        type: "stat"
```

### 6.2 Post-Mortem レポートテンプレート

```markdown
# インシデント Post-Mortem レポート

## 基本情報

| 項目 | 内容 |
|------|------|
| **Incident ID** | INC-YYYYMMDD-XXX |
| **インシデント種別** | [ランサムウェア/データ漏洩/etc.] |
| **発生日時** | YYYY-MM-DD HH:MM |
| **検知日時** | YYYY-MM-DD HH:MM |
| **復旧完了日時** | YYYY-MM-DD HH:MM |
| **影響期間** | XX時間 |
| **Severity** | Critical / High / Medium / Low |

## タイムライン

| 日時 | イベント | 担当 |
|------|---------|------|
| YYYY-MM-DD HH:MM | 初期侵入 | - |
| YYYY-MM-DD HH:MM | 検知 | SOC |
| YYYY-MM-DD HH:MM | 封じ込め完了 | CSIRT |
| YYYY-MM-DD HH:MM | 根絶完了 | CSIRT Engineer |
| YYYY-MM-DD HH:MM | 復旧完了 | CSIRT Engineer |
| YYYY-MM-DD HH:MM | サービス再開 | CSIRT Leader |

## 根本原因分析

### 直接原因
[直接的な原因を記載]

### 根本原因（5 Whys）
1. Why: [なぜ問題が発生したか]
2. Why: [その原因は何か]
3. Why: [さらにその原因は何か]
4. Why: [さらに深い原因]
5. Why: [根本原因]

### Contributing Factors
- [寄与要因1]
- [寄与要因2]

## 影響範囲

### ビジネス影響
- サービス停止時間: XX時間
- 影響ユーザー数: XX名
- 収益影響: 約XXX万円
- レピュテーション影響: [評価]

### 技術的影響
- 侵害されたシステム: X台
- 影響を受けたデータ: [種別と量]
- 漏洩したデータ: [有無と内容]

## What Went Well

1. [良かった点1]
2. [良かった点2]
3. [良かった点3]

## What Went Wrong

1. [改善すべき点1]
2. [改善すべき点2]
3. [改善すべき点3]

## Action Items

| ID | アクション | 担当 | 期限 | ステータス |
|----|----------|------|------|----------|
| AI-001 | [具体的なアクション] | [担当者] | YYYY-MM-DD | Open |
| AI-002 | [具体的なアクション] | [担当者] | YYYY-MM-DD | Open |
| AI-003 | [具体的なアクション] | [担当者] | YYYY-MM-DD | Open |

## Lessons Learned

1. [学んだ教訓1]
2. [学んだ教訓2]
3. [学んだ教訓3]

## 承認

| 役職 | 氏名 | 署名 | 日付 |
|------|------|------|------|
| CSIRT Leader | | | |
| CISO | | | |
| CTO | | | |
```

---

## 7. 付録

### 7.1 緊急連絡先

| 役割 | 担当者 | 連絡先 |
|------|--------|--------|
| CSIRT Team Leader | - | [内線/携帯] |
| Network Engineer | - | [内線/携帯] |
| CISO | - | [内線/携帯] |
| AWS サポート | - | [サポートID] |
| 外部復旧支援業者 | - | [緊急連絡先] |

### 7.2 関連文書

- LifePlan_Navigator_Forensic_Procedures.md（フォレンジック手順書）
- LifePlan_Navigator_Investigation_Capabilities.md（調査能力構築）
- LifePlan_Navigator_Investigation_Checklist.md（調査チェックリスト）

### 7.3 改訂履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-11 | CSIRT Engineer | 初版作成 |

---

**Document Classification**: Internal Use Only
**Review Cycle**: Quarterly
**Next Review**: 2026-03-11
