# LifePlan Navigator フォレンジック手順書

**Version**: 1.0
**Last Updated**: 2025-12-11
**Document Owner**: CSIRT Engineer
**Classification**: Internal Use Only

---

## 1. 概要

### 1.1 目的
本文書は、LifePlan Navigator（個人ライフプラン支援Webアプリ）においてセキュリティインシデント発生時に、デジタル証拠を適切に保全・収集し、法的証拠能力を担保しながら調査を実施するための手順を定義する。

### 1.2 適用範囲
- LifePlan Navigator 本番環境（AWS/Azure/GCP）
- 開発・ステージング環境
- 関連するエンドポイント（管理者端末、開発端末）
- モバイルアプリ（iOS/Android）
- 連携するサードパーティサービス

### 1.3 関連フレームワーク
- NIST SP 800-86 (Guide to Integrating Forensic Techniques)
- ISO/IEC 27037 (Digital Evidence Handling)
- SANS PICERL (Incident Response Framework)

---

## 2. 証拠保全手順

### 2.1 揮発性順序（Order of Volatility）

証拠収集は揮発性の高いデータから順に実施する。

| Priority | データ種別 | 保持期間 | 収集優先度 |
|----------|-----------|----------|------------|
| 1 | CPUレジスタ・キャッシュ | ミリ秒 | 最優先 |
| 2 | システムメモリ（RAM） | 電源供給中のみ | 最優先 |
| 3 | ネットワーク接続状態 | 動的 | 高 |
| 4 | プロセステーブル | 動的 | 高 |
| 5 | 一時ファイル | セッション中 | 中 |
| 6 | ディスク（HDD/SSD） | 永続 | 中 |
| 7 | リモートログ・監視データ | 保持ポリシー依存 | 低 |
| 8 | バックアップメディア | 永続 | 低 |

### 2.2 メモリダンプ取得手順

#### 2.2.1 Linux/Ubuntuサーバー（LifePlan Navigator本番環境）

```bash
# 1. 調査用ディレクトリ作成
sudo mkdir -p /forensics/$(date +%Y%m%d_%H%M%S)
cd /forensics/$(date +%Y%m%d_%H%M%S)

# 2. LiME (Linux Memory Extractor) によるメモリダンプ
# 事前にLiMEモジュールをコンパイルしておくこと
sudo insmod /opt/forensics/lime-$(uname -r).ko "path=/forensics/$(date +%Y%m%d_%H%M%S)/memory.lime format=lime"

# 3. ハッシュ値計算（整合性検証用）
sha256sum memory.lime > memory.lime.sha256
md5sum memory.lime > memory.lime.md5

# 4. 証拠ラベル作成
cat << EOF > evidence_label.txt
Evidence ID: MEM-$(date +%Y%m%d%H%M%S)
Hostname: $(hostname)
IP Address: $(hostname -I | awk '{print $1}')
Collection Date: $(date -Iseconds)
Collector: [調査担当者名]
SHA256: $(cat memory.lime.sha256)
EOF
```

#### 2.2.2 Windows Server（管理端末等）

```powershell
# 1. DumpIt または WinPMEM を使用
# 管理者権限で実行

# DumpIt使用の場合
.\DumpIt.exe /OUTPUT C:\Forensics\%COMPUTERNAME%_memory.dmp

# WinPMEM使用の場合
.\winpmem_mini_x64.exe C:\Forensics\%COMPUTERNAME%_memory.raw

# 2. ハッシュ値計算
Get-FileHash -Algorithm SHA256 C:\Forensics\*_memory.* | Out-File C:\Forensics\hash_values.txt
```

#### 2.2.3 AWS EC2インスタンス

```bash
# 1. SSM経由でメモリダンプ
aws ssm send-command \
  --instance-ids "i-xxxxxxxxxx" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo insmod /opt/lime/lime.ko path=/tmp/memory.lime format=lime"]'

# 2. S3へ証拠転送（暗号化）
aws s3 cp /tmp/memory.lime s3://forensics-evidence-bucket/incident-$(date +%Y%m%d)/ \
  --sse aws:kms --sse-kms-key-id alias/forensics-key

# 3. EC2スナップショット取得（ディスクイメージ代替）
aws ec2 create-snapshot \
  --volume-id vol-xxxxxxxxxx \
  --description "Forensic snapshot - Incident $(date +%Y%m%d)" \
  --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Purpose,Value=Forensics},{Key=IncidentID,Value=INC-YYYYMMDD-XXX}]'
```

### 2.3 ディスクイメージ取得手順

#### 2.3.1 物理サーバー/オンプレミス環境

```bash
# 1. Write Blocker接続確認
# Tableau T35u等のハードウェアWrite Blockerを使用

# 2. ddコマンドによるビットストリームコピー
sudo dd if=/dev/sda of=/forensics/disk_image.dd bs=64K conv=noerror,sync status=progress

# 3. E01形式での取得（ewfacquire使用 - 推奨）
sudo ewfacquire /dev/sda \
  -t /forensics/disk_image \
  -C "Incident ID: INC-YYYYMMDD-XXX" \
  -D "LifePlan Navigator Production Server" \
  -E "CSIRT Engineer" \
  -e "investigator@example.com" \
  -N "Forensic evidence acquisition" \
  -m removable \
  -c best \
  -S 4G

# 4. 整合性検証
ewfverify /forensics/disk_image.E01
```

#### 2.3.2 クラウド環境（AWS）

```bash
# 1. EBSボリュームのスナップショット作成
aws ec2 create-snapshot \
  --volume-id vol-xxxxxxxxxx \
  --description "Forensic Evidence - $(date +%Y%m%d)" \
  --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Chain-of-Custody,Value=Initiated}]'

# 2. スナップショットからフォレンジック用ボリューム作成
aws ec2 create-volume \
  --snapshot-id snap-xxxxxxxxxx \
  --availability-zone ap-northeast-1a \
  --volume-type gp3 \
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Purpose,Value=Forensics}]'

# 3. 隔離されたフォレンジックEC2にアタッチ（Read-Only推奨）
aws ec2 attach-volume \
  --volume-id vol-yyyyyyyyyy \
  --instance-id i-forensics-workstation \
  --device /dev/sdf
```

### 2.4 ログ収集手順

#### 2.4.1 アプリケーションログ（LifePlan Navigator）

```bash
# 1. Webアプリケーションログ
cp -rp /var/log/lifeplan-navigator/ /forensics/logs/app/

# 2. Nginx/Apache アクセスログ
cp -rp /var/log/nginx/ /forensics/logs/webserver/
cp -rp /var/log/apache2/ /forensics/logs/webserver/

# 3. データベース監査ログ
# PostgreSQL
cp -rp /var/lib/postgresql/*/main/pg_log/ /forensics/logs/database/

# MySQL
cp -rp /var/log/mysql/ /forensics/logs/database/

# 4. ハッシュ値一覧作成
find /forensics/logs -type f -exec sha256sum {} \; > /forensics/logs_hash_manifest.txt
```

#### 2.4.2 AWSログ収集

```bash
# 1. CloudTrail ログ取得
aws s3 sync s3://cloudtrail-bucket/AWSLogs/ /forensics/aws/cloudtrail/ \
  --include "*.json.gz" \
  --exclude "*" \
  --start-time $(date -d '7 days ago' +%Y-%m-%d)

# 2. VPC Flow Logs 取得
aws logs filter-log-events \
  --log-group-name "/aws/vpc/flowlogs" \
  --start-time $(date -d '48 hours ago' +%s)000 \
  --output json > /forensics/aws/vpc_flowlogs.json

# 3. RDS監査ログ取得
aws rds download-db-log-file-portion \
  --db-instance-identifier lifeplan-db-prod \
  --log-file-name audit/audit.log \
  --output text > /forensics/aws/rds_audit.log

# 4. CloudWatch Logs（アプリケーション）
aws logs get-log-events \
  --log-group-name "/aws/lambda/lifeplan-api" \
  --log-stream-name "$(date +%Y/%m/%d)" \
  --output json > /forensics/aws/lambda_logs.json
```

### 2.5 Chain of Custody（証拠保管連鎖）記録

#### 2.5.1 証拠保管連鎖フォーム

| フィールド | 内容 |
|-----------|------|
| **Evidence ID** | FOR-YYYYMMDD-XXX |
| **Incident ID** | INC-YYYYMMDD-XXX |
| **Description** | [証拠の説明] |
| **Collection Date/Time** | YYYY-MM-DD HH:MM:SS JST |
| **Collected By** | [担当者名] |
| **Collection Method** | [使用ツール・手法] |
| **Original Location** | [取得元の場所・パス] |
| **Hash (SHA-256)** | [ハッシュ値] |
| **Hash (MD5)** | [ハッシュ値] |
| **Storage Location** | [保管場所] |
| **Access Log** | [アクセス記録] |

#### 2.5.2 証拠転送記録

```markdown
## Evidence Transfer Log

### Transfer #1
- From: [転送元担当者]
- To: [転送先担当者]
- Date/Time: YYYY-MM-DD HH:MM:SS
- Reason: [転送理由]
- Verification: [ハッシュ値検証結果]
- Signature: [双方の署名]
```

---

## 3. 調査ツールキット

### 3.1 必須ツール一覧

#### 3.1.1 メモリフォレンジック
| ツール | 用途 | 対応OS |
|--------|------|--------|
| Volatility 3 | メモリ解析フレームワーク | Windows/Linux/macOS |
| LiME | Linuxメモリダンプ取得 | Linux |
| WinPMEM | Windowsメモリダンプ取得 | Windows |
| Rekall | メモリフォレンジック | マルチプラットフォーム |

#### 3.1.2 ディスクフォレンジック
| ツール | 用途 | 対応OS |
|--------|------|--------|
| Autopsy | ディスク解析GUI | Windows/Linux |
| Sleuth Kit | ディスク解析CLI | マルチプラットフォーム |
| FTK Imager | イメージ取得・解析 | Windows |
| ewftools | E01形式イメージ処理 | Linux |

#### 3.1.3 ネットワークフォレンジック
| ツール | 用途 | 対応OS |
|--------|------|--------|
| Wireshark | パケット解析 | マルチプラットフォーム |
| NetworkMiner | ネットワーク証拠抽出 | Windows/Linux |
| Zeek (Bro) | ネットワーク監視・ログ | Linux |
| tcpdump | パケットキャプチャ | Linux/macOS |

#### 3.1.4 マルウェア解析
| ツール | 用途 | 対応OS |
|--------|------|--------|
| Ghidra | リバースエンジニアリング | マルチプラットフォーム |
| YARA | マルウェアパターン検出 | マルチプラットフォーム |
| Cuckoo Sandbox | 動的解析 | Linux |
| VirusTotal | マルウェアスキャン | Web |

#### 3.1.5 ログ解析
| ツール | 用途 | 対応OS |
|--------|------|--------|
| Splunk | ログ集約・解析 | マルチプラットフォーム |
| ELK Stack | ログ可視化 | Linux |
| Plaso (log2timeline) | タイムライン生成 | Linux |
| jq | JSON解析 | マルチプラットフォーム |

### 3.2 フォレンジックワークステーション構成

```yaml
# フォレンジックワークステーション推奨構成
hardware:
  cpu: "Intel Core i9 / AMD Ryzen 9 (16+ cores)"
  memory: "128GB RAM"
  storage:
    - type: "NVMe SSD"
      size: "2TB"
      purpose: "OS + Tools"
    - type: "NVMe SSD"
      size: "8TB"
      purpose: "Evidence Processing"
  network:
    - "Air-gapped network capable"
    - "Dedicated forensics VLAN"

software:
  os: "Ubuntu 22.04 LTS / SIFT Workstation"
  forensic_suites:
    - "Autopsy 4.x"
    - "Sleuth Kit 4.x"
    - "Volatility 3.x"
  malware_analysis:
    - "REMnux (VM)"
    - "FlareVM (VM)"
  virtualization:
    - "VMware Workstation Pro"
    - "VirtualBox"
```

### 3.3 Velociraptor リモート収集設定

```yaml
# Velociraptor Hunt Configuration for LifePlan Navigator
name: "LifePlan_Navigator_Triage"
description: "Collect forensic artifacts from LifePlan Navigator infrastructure"

artifacts:
  - "Linux.Sys.Users"
  - "Linux.Sys.Crontab"
  - "Linux.Proc.Pslist"
  - "Linux.Network.Netstat"
  - "Linux.Forensics.Timeline"
  - "Linux.Applications.Docker.Containers"
  - "Generic.Forensic.LocalHashes.Glob"

parameters:
  glob_patterns:
    - "/var/log/lifeplan-navigator/**"
    - "/opt/lifeplan-navigator/**"
    - "/etc/nginx/**"
    - "/var/lib/postgresql/**"
```

---

## 4. 証拠保管要件

### 4.1 保管環境

#### 4.1.1 物理的保管
- **証拠保管ロッカー**: 施錠可能、アクセスログ記録
- **温度・湿度管理**: 20-25°C、40-60%RH
- **静電気対策**: 帯電防止袋使用
- **ラベリング**: 証拠ID、取得日時、担当者を明記

#### 4.1.2 電子的保管
- **暗号化**: AES-256以上
- **アクセス制御**: 最小権限の原則
- **整合性検証**: 定期的なハッシュ値検証
- **バックアップ**: 3-2-1ルール適用

### 4.2 保管期間

| 証拠種別 | 保管期間 | 根拠 |
|---------|---------|------|
| インシデント関連 | 7年 | 法的時効を考慮 |
| 訴訟関連 | 訴訟終結まで | 法務指示に従う |
| 監査証跡 | 5年 | ISO 27001要件 |
| 通常ログ | 1年 | 運用要件 |

### 4.3 証拠廃棄手順

```bash
# 証拠廃棄手順（CISO承認後に実施）

# 1. 廃棄承認記録の確認
cat /forensics/disposal/approval_INC-YYYYMMDD-XXX.pdf

# 2. 電子データの完全消去（DoD 5220.22-M準拠）
shred -vfz -n 3 /forensics/evidence/FOR-YYYYMMDD-XXX/*

# 3. 廃棄記録の作成
cat << EOF > /forensics/disposal/disposal_record_$(date +%Y%m%d).txt
Evidence ID: FOR-YYYYMMDD-XXX
Disposal Date: $(date -Iseconds)
Method: DoD 5220.22-M (3-pass)
Performed By: [担当者名]
Approved By: CISO
Witness: [立会者名]
EOF
```

---

## 5. 連携手順

### 5.1 CSIRT Team Leader への報告

#### 5.1.1 初動報告フォーマット

```markdown
## フォレンジック初動報告

**報告日時**: YYYY-MM-DD HH:MM
**インシデントID**: INC-YYYYMMDD-XXX
**報告者**: CSIRT Engineer

### 証拠保全状況
| 対象 | ステータス | 完了時刻 |
|-----|----------|---------|
| メモリダンプ | ✅ 完了 | HH:MM |
| ディスクイメージ | 🔄 進行中 | - |
| ログ収集 | ⏳ 待機中 | - |

### 事実（Fact）
- [確認された事実を箇条書き]

### 推定（Hypothesis）
- [確度とともに推定を記載]
- 確度: 高/中/低

### 推奨アクション
1. [推奨する次のアクション]
2. [追加の封じ込め措置など]
```

#### 5.1.2 調査進捗報告フォーマット

```markdown
## フォレンジック調査進捗報告

**報告日時**: YYYY-MM-DD HH:MM
**インシデントID**: INC-YYYYMMDD-XXX

### 解析完了項目
- [x] メモリ解析 - 不審プロセス特定
- [x] ディスク解析 - マルウェア検体抽出
- [ ] タイムライン分析 - 進行中 (60%)

### 発見事項
1. **侵入経路**: [特定された侵入経路]
2. **マルウェア**: [検出されたマルウェアの詳細]
3. **影響範囲**: [データ漏洩の有無、影響を受けたシステム]

### IoC（侵害指標）
| Type | Value | Description |
|------|-------|-------------|
| IP | x.x.x.x | C2サーバー |
| Hash | sha256:xxxx | マルウェア検体 |
| Domain | evil.example.com | C2ドメイン |
```

### 5.2 Network Engineer への連携

#### 5.2.1 ネットワーク証拠依頼

```markdown
## ネットワーク証拠収集依頼

**依頼日時**: YYYY-MM-DD HH:MM
**依頼者**: CSIRT Engineer
**優先度**: P0 / P1 / P2

### 依頼内容
- [ ] 特定IPアドレスとの通信ログ（過去48時間）
- [ ] パケットキャプチャ（対象: x.x.x.x）
- [ ] NetFlowデータ（対象セグメント: 192.168.10.0/24）

### 対象情報
- **調査対象IP**: [対象IPアドレス]
- **時間範囲**: YYYY-MM-DD HH:MM ～ YYYY-MM-DD HH:MM
- **関連ポート**: 443, 8080, 4444

### 収集後の処理
- 収集データは /forensics/network/ に保存
- SHA256ハッシュ値を計算して報告
```

#### 5.2.2 隔離実施後の調整

```markdown
## 隔離実施後のフォレンジック調整

**対象ホスト**: [ホスト名/IP]
**隔離方法**: VLAN隔離 / ポートシャットダウン / ネットワーク遮断

### 調整事項
1. **リモートアクセス確保**: 隔離VLANからのSSHアクセス許可
2. **証拠転送経路**: 隔離ネットワーク → フォレンジックサーバー
3. **タイミング**: メモリダンプ完了後に物理電源断を許可

### 確認事項
- [ ] 証拠保全完了の連絡をNetwork Engineerに送信
- [ ] 電源断の許可をCSIRT Leaderから取得
```

### 5.3 CLO（法務）への証拠報告

```markdown
## 証拠保全完了報告

**報告日時**: YYYY-MM-DD HH:MM
**インシデントID**: INC-YYYYMMDD-XXX
**報告者**: CSIRT Engineer

### 証拠一覧
| Evidence ID | 種別 | 取得日時 | SHA-256 | 保管場所 |
|-------------|------|---------|---------|---------|
| FOR-001 | メモリダンプ | YYYY-MM-DD HH:MM | [hash] | ロッカー#3 |
| FOR-002 | ディスクイメージ | YYYY-MM-DD HH:MM | [hash] | 証拠サーバー |
| FOR-003 | アクセスログ | YYYY-MM-DD HH:MM | [hash] | 証拠サーバー |

### Chain of Custody
- 全証拠について保管連鎖記録を維持
- 記録簿: /forensics/custody/INC-YYYYMMDD-XXX_custody.pdf

### 証拠能力
- 取得手順: 標準SOPに準拠
- Write Blocker: 使用（物理メディアの場合）
- ハッシュ検証: 取得時と検証時で一致確認済み
- 法的手続きでの使用: **可能**
```

---

## 6. 付録

### 6.1 緊急連絡先

| 役割 | 担当者 | 連絡先 |
|------|--------|--------|
| CSIRT Team Leader | - | [内線/携帯] |
| Network Engineer | - | [内線/携帯] |
| CISO | - | [内線/携帯] |
| CLO | - | [内線/携帯] |
| 外部フォレンジック業者 | - | [緊急連絡先] |

### 6.2 関連文書

- LifePlan_Navigator_Investigation_Capabilities.md（調査能力構築）
- LifePlan_Navigator_Recovery_Procedures.md（復旧手順書）
- LifePlan_Navigator_Investigation_Checklist.md（調査チェックリスト）

### 6.3 改訂履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-11 | CSIRT Engineer | 初版作成 |

---

**Document Classification**: Internal Use Only
**Review Cycle**: Quarterly
**Next Review**: 2026-03-11
