# LifePlan Navigator 調査能力構築ガイド

**Version**: 1.0
**Last Updated**: 2025-12-11
**Document Owner**: CSIRT Engineer
**Classification**: Internal Use Only

---

## 1. 概要

### 1.1 目的
本文書は、LifePlan Navigator（個人ライフプラン支援Webアプリ）のセキュリティインシデント調査に必要な能力（マルウェア解析、ログ分析、タイムライン作成）を構築・維持するための手順とベストプラクティスを定義する。

### 1.2 調査能力の要素

```
┌─────────────────────────────────────────────────────────────────┐
│                    調査能力フレームワーク                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│   │  マルウェア  │   │   ログ分析   │   │ タイムライン │         │
│   │    解析     │   │             │   │    作成     │         │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘         │
│          │                 │                 │                 │
│          ▼                 ▼                 ▼                 │
│   ┌─────────────────────────────────────────────────────┐     │
│   │              統合調査プラットフォーム                 │     │
│   │     (Velociraptor / SIEM / Forensic Workstation)    │     │
│   └─────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. マルウェア解析環境

### 2.1 解析環境アーキテクチャ

```
┌────────────────────────────────────────────────────────────────────┐
│                    マルウェア解析環境                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   Air-Gapped Network                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │   静的解析    │  │   動的解析    │  │  リバース     │      │  │
│  │  │   ワーク      │  │   サンド      │  │  エンジニア   │      │  │
│  │  │   ステーション │  │   ボックス    │  │  リング      │      │  │
│  │  │              │  │  (Cuckoo)    │  │  (Ghidra)    │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  │         ↓                 ↓                 ↓              │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │         解析結果リポジトリ (SQLite/Elastic)          │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              ↓ (One-way transfer)                 │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Corporate Network (Restricted)                 │  │
│  │              - IoC Database                                 │  │
│  │              - SIEM Integration                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 静的解析手順

#### 2.2.1 初期トリアージ

```bash
#!/bin/bash
# malware_triage.sh - マルウェア初期トリアージスクリプト

SAMPLE=$1
OUTPUT_DIR="/analysis/$(date +%Y%m%d)_$(basename $SAMPLE .exe)"

mkdir -p $OUTPUT_DIR

echo "=== Malware Triage Report ===" > $OUTPUT_DIR/triage_report.txt
echo "Sample: $SAMPLE" >> $OUTPUT_DIR/triage_report.txt
echo "Analysis Date: $(date -Iseconds)" >> $OUTPUT_DIR/triage_report.txt
echo "" >> $OUTPUT_DIR/triage_report.txt

# 1. ハッシュ値計算
echo "=== Hash Values ===" >> $OUTPUT_DIR/triage_report.txt
md5sum $SAMPLE >> $OUTPUT_DIR/triage_report.txt
sha1sum $SAMPLE >> $OUTPUT_DIR/triage_report.txt
sha256sum $SAMPLE >> $OUTPUT_DIR/triage_report.txt
ssdeep $SAMPLE >> $OUTPUT_DIR/triage_report.txt

# 2. ファイルタイプ特定
echo "" >> $OUTPUT_DIR/triage_report.txt
echo "=== File Type ===" >> $OUTPUT_DIR/triage_report.txt
file $SAMPLE >> $OUTPUT_DIR/triage_report.txt

# 3. PE/ELFヘッダー解析
echo "" >> $OUTPUT_DIR/triage_report.txt
echo "=== PE/ELF Analysis ===" >> $OUTPUT_DIR/triage_report.txt
if file $SAMPLE | grep -q "PE32"; then
    pefile $SAMPLE >> $OUTPUT_DIR/triage_report.txt
    exiftool $SAMPLE >> $OUTPUT_DIR/triage_report.txt
elif file $SAMPLE | grep -q "ELF"; then
    readelf -h $SAMPLE >> $OUTPUT_DIR/triage_report.txt
fi

# 4. 文字列抽出
echo "" >> $OUTPUT_DIR/triage_report.txt
echo "=== Interesting Strings ===" >> $OUTPUT_DIR/triage_report.txt
strings -a $SAMPLE | grep -E "(http|https|ftp|ssh|cmd|powershell|/bin/|password|key|token|api)" >> $OUTPUT_DIR/triage_report.txt

# 5. YARAルールスキャン
echo "" >> $OUTPUT_DIR/triage_report.txt
echo "=== YARA Matches ===" >> $OUTPUT_DIR/triage_report.txt
yara -r /opt/yara-rules/index.yar $SAMPLE >> $OUTPUT_DIR/triage_report.txt

# 6. パッカー検出
echo "" >> $OUTPUT_DIR/triage_report.txt
echo "=== Packer Detection ===" >> $OUTPUT_DIR/triage_report.txt
die $SAMPLE >> $OUTPUT_DIR/triage_report.txt 2>/dev/null || echo "DIE not installed" >> $OUTPUT_DIR/triage_report.txt

echo "Triage complete: $OUTPUT_DIR/triage_report.txt"
```

#### 2.2.2 PEヘッダー詳細解析（Windows実行ファイル）

```python
#!/usr/bin/env python3
# pe_analyzer.py - PE詳細解析スクリプト

import pefile
import hashlib
import sys
import json
from datetime import datetime

def analyze_pe(filepath):
    result = {
        "file": filepath,
        "analysis_date": datetime.now().isoformat(),
        "hashes": {},
        "pe_info": {},
        "imports": [],
        "exports": [],
        "sections": [],
        "suspicious_indicators": []
    }

    # ハッシュ計算
    with open(filepath, 'rb') as f:
        data = f.read()
        result["hashes"]["md5"] = hashlib.md5(data).hexdigest()
        result["hashes"]["sha256"] = hashlib.sha256(data).hexdigest()

    try:
        pe = pefile.PE(filepath)

        # 基本情報
        result["pe_info"]["machine"] = hex(pe.FILE_HEADER.Machine)
        result["pe_info"]["timestamp"] = datetime.fromtimestamp(
            pe.FILE_HEADER.TimeDateStamp
        ).isoformat()
        result["pe_info"]["subsystem"] = pe.OPTIONAL_HEADER.Subsystem
        result["pe_info"]["dll"] = pe.is_dll()
        result["pe_info"]["exe"] = pe.is_exe()

        # インポート関数
        if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
            for entry in pe.DIRECTORY_ENTRY_IMPORT:
                dll_imports = {
                    "dll": entry.dll.decode('utf-8'),
                    "functions": []
                }
                for imp in entry.imports:
                    if imp.name:
                        dll_imports["functions"].append(imp.name.decode('utf-8'))
                result["imports"].append(dll_imports)

        # セクション情報
        for section in pe.sections:
            sec_info = {
                "name": section.Name.decode('utf-8').rstrip('\x00'),
                "virtual_address": hex(section.VirtualAddress),
                "virtual_size": section.Misc_VirtualSize,
                "raw_size": section.SizeOfRawData,
                "entropy": section.get_entropy()
            }
            result["sections"].append(sec_info)

            # 高エントロピーセクション検出（パッカーの兆候）
            if sec_info["entropy"] > 7.0:
                result["suspicious_indicators"].append(
                    f"High entropy section: {sec_info['name']} ({sec_info['entropy']:.2f})"
                )

        # 不審なインポート検出
        suspicious_apis = [
            "VirtualAlloc", "VirtualProtect", "CreateRemoteThread",
            "WriteProcessMemory", "ReadProcessMemory", "NtUnmapViewOfSection",
            "SetWindowsHookEx", "GetAsyncKeyState", "InternetOpen",
            "URLDownloadToFile", "WinExec", "ShellExecute"
        ]

        for imp_entry in result["imports"]:
            for func in imp_entry["functions"]:
                if func in suspicious_apis:
                    result["suspicious_indicators"].append(
                        f"Suspicious API: {imp_entry['dll']}!{func}"
                    )

        pe.close()

    except Exception as e:
        result["error"] = str(e)

    return result

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <pe_file>")
        sys.exit(1)

    result = analyze_pe(sys.argv[1])
    print(json.dumps(result, indent=2))
```

### 2.3 動的解析手順

#### 2.3.1 Cuckoo Sandboxセットアップ

```yaml
# cuckoo_config.yaml - Cuckoo Sandbox設定

cuckoo:
  version_check: false
  max_analysis_count: 0
  max_machines_count: 5
  max_vmstartup_count: 2
  freespace: 1024
  tmppath: /tmp

machinery: virtualbox

virtualbox:
  mode: headless
  path: /usr/bin/VBoxManage
  interface: vboxnet0
  machines:
    - win10_analysis
    - win7_analysis
    - ubuntu_analysis

memory:
  enabled: true
  basic: true
  strings: true
  dumptls: true

network:
  type: inetsim

processing:
  analysis_size_limit: 134217728
  memory: true
  dropped: true
  static: true

reporting:
  jsondump:
    enabled: true
    indent: 4
  reporthtml:
    enabled: true
```

#### 2.3.2 動的解析実行スクリプト

```bash
#!/bin/bash
# dynamic_analysis.sh - 動的解析実行スクリプト

SAMPLE=$1
TIMEOUT=${2:-300}  # デフォルト5分

if [ -z "$SAMPLE" ]; then
    echo "Usage: $0 <malware_sample> [timeout_seconds]"
    exit 1
fi

# 1. サンプルをCuckooに投入
echo "[*] Submitting sample to Cuckoo Sandbox..."
TASK_ID=$(cuckoo submit --timeout $TIMEOUT $SAMPLE | grep -oP 'task #\K\d+')

echo "[*] Task ID: $TASK_ID"
echo "[*] Waiting for analysis to complete..."

# 2. 解析完了を待機
while true; do
    STATUS=$(cuckoo api tasks view $TASK_ID | jq -r '.task.status')
    if [ "$STATUS" == "reported" ]; then
        break
    fi
    sleep 10
done

echo "[*] Analysis complete. Generating report..."

# 3. レポート取得
REPORT_DIR="/analysis/cuckoo_reports/task_$TASK_ID"
mkdir -p $REPORT_DIR

cuckoo api tasks report $TASK_ID > $REPORT_DIR/report.json

# 4. IoC抽出
echo "[*] Extracting IoCs..."
cat $REPORT_DIR/report.json | jq '{
    network: {
        domains: [.network.domains[].domain],
        hosts: [.network.hosts[].ip],
        http_requests: [.network.http[].uri]
    },
    signatures: [.signatures[].description],
    dropped_files: [.dropped[].sha256],
    registry_keys: [.behavior.regkey_written[]],
    mutex: [.behavior.mutex[]]
}' > $REPORT_DIR/iocs.json

echo "[*] Report saved to: $REPORT_DIR"
echo "[*] IoCs saved to: $REPORT_DIR/iocs.json"
```

### 2.4 リバースエンジニアリング手順

#### 2.4.1 Ghidraプロジェクトセットアップ

```python
#!/usr/bin/env python3
# ghidra_headless_analysis.py - Ghidraヘッドレス解析スクリプト

"""
Ghidraヘッドレス解析用Pythonスクリプト
Usage: analyzeHeadless <project_dir> <project_name> -import <file> -postScript ghidra_headless_analysis.py
"""

from ghidra.app.decompiler import DecompInterface
from ghidra.util.task import ConsoleTaskMonitor
import json

def analyze_functions():
    """関数の解析と不審なパターンの検出"""
    results = {
        "functions": [],
        "suspicious_patterns": [],
        "strings": []
    }

    fm = currentProgram.getFunctionManager()

    # デコンパイラ初期化
    decomp = DecompInterface()
    decomp.openProgram(currentProgram)

    for func in fm.getFunctions(True):
        func_info = {
            "name": func.getName(),
            "entry_point": str(func.getEntryPoint()),
            "is_thunk": func.isThunk(),
            "calling_convention": func.getCallingConventionName()
        }

        # デコンパイル
        try:
            decomp_result = decomp.decompileFunction(func, 60, ConsoleTaskMonitor())
            if decomp_result.decompileCompleted():
                decompiled = decomp_result.getDecompiledFunction()
                if decompiled:
                    func_info["decompiled_signature"] = decompiled.getSignature()
        except:
            pass

        results["functions"].append(func_info)

        # 不審なパターン検出
        suspicious_names = ["crypt", "encode", "decode", "shell", "inject", "hook"]
        for pattern in suspicious_names:
            if pattern.lower() in func.getName().lower():
                results["suspicious_patterns"].append({
                    "type": "suspicious_function_name",
                    "function": func.getName(),
                    "address": str(func.getEntryPoint())
                })

    # 文字列抽出
    data_type_manager = currentProgram.getDataTypeManager()
    listing = currentProgram.getListing()

    for data in listing.getDefinedData(True):
        if data.hasStringValue():
            string_value = data.getValue()
            if string_value and len(str(string_value)) > 4:
                results["strings"].append({
                    "address": str(data.getAddress()),
                    "value": str(string_value)
                })

    return results

# メイン実行
if __name__ == "__main__":
    results = analyze_functions()

    # 結果をファイルに出力
    output_path = str(currentProgram.getExecutablePath()) + "_analysis.json"
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"[*] Analysis complete. Results saved to: {output_path}")
```

### 2.5 マルウェア解析レポートテンプレート

```markdown
# マルウェア解析レポート

## 1. 基本情報

| 項目 | 値 |
|------|-----|
| **検体名** | [ファイル名] |
| **MD5** | [ハッシュ値] |
| **SHA256** | [ハッシュ値] |
| **ファイルサイズ** | [サイズ] bytes |
| **ファイルタイプ** | [PE32/ELF/etc.] |
| **解析日** | YYYY-MM-DD |
| **解析者** | CSIRT Engineer |

## 2. 静的解析結果

### 2.1 パッカー/プロテクター
- 検出結果: [UPX / VMProtect / None]
- アンパック状態: [済 / 未実施]

### 2.2 インポート解析
| DLL | 不審な関数 |
|-----|----------|
| kernel32.dll | VirtualAlloc, CreateRemoteThread |
| ws2_32.dll | connect, send, recv |

### 2.3 文字列解析
```
[不審な文字列を列挙]
- C2サーバー候補: http://xxx.xxx.xxx
- レジストリキー: HKCU\Software\...
- ファイルパス: C:\Windows\Temp\...
```

## 3. 動的解析結果

### 3.1 ネットワーク通信
| 通信先 | ポート | プロトコル | 内容 |
|--------|-------|----------|------|
| x.x.x.x | 443 | HTTPS | C2通信 |
| x.x.x.x | 53 | DNS | ドメイン解決 |

### 3.2 ファイルシステム操作
| 操作 | パス | 説明 |
|------|-----|------|
| Create | C:\Temp\svc.exe | 自己コピー |
| Delete | [パス] | 痕跡消去 |

### 3.3 レジストリ操作
| 操作 | キー | 値 | 説明 |
|------|-----|-----|------|
| Create | HKCU\...\Run | [値] | 永続化 |

### 3.4 プロセス操作
| 操作 | 対象プロセス | 説明 |
|------|------------|------|
| Inject | explorer.exe | コードインジェクション |

## 4. IoC（侵害指標）

### 4.1 ファイルハッシュ
```
MD5: [hash]
SHA1: [hash]
SHA256: [hash]
```

### 4.2 ネットワークIoC
```
IP: x.x.x.x (C2 Server)
Domain: evil.example.com
URL: http://evil.example.com/beacon
```

### 4.3 ホストベースIoC
```
File Path: C:\Windows\Temp\svc.exe
Registry: HKCU\Software\Microsoft\Windows\CurrentVersion\Run\[name]
Mutex: Global\M$Malware
Service: [サービス名]
```

## 5. MITRE ATT&CK マッピング

| Tactic | Technique | ID | 説明 |
|--------|-----------|-----|------|
| Initial Access | Phishing | T1566 | メール添付で配布 |
| Execution | PowerShell | T1059.001 | PowerShellでペイロード実行 |
| Persistence | Registry Run Keys | T1547.001 | Run キーで永続化 |
| Defense Evasion | Process Injection | T1055 | explorer.exeへインジェクション |
| C2 | Web Protocols | T1071.001 | HTTPS で C2通信 |

## 6. 結論と推奨事項

### 6.1 マルウェア分類
- **ファミリー**: [マルウェアファミリー名]
- **種別**: [RAT / Ransomware / Stealer / etc.]
- **脅威レベル**: Critical / High / Medium / Low

### 6.2 推奨対応
1. IoC を SIEM/EDR に登録
2. 対象 IP/Domain を Firewall でブロック
3. 感染端末の隔離と再イメージング
4. 横展開の有無を確認
```

---

## 3. ログ分析手順

### 3.1 ログ収集アーキテクチャ（LifePlan Navigator）

```
┌─────────────────────────────────────────────────────────────────────┐
│                   LifePlan Navigator ログ収集                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │  Web Server │  │   App Server │  │  DB Server  │                │
│  │   (Nginx)   │  │   (Node.js)  │  │ (PostgreSQL)│                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                │                        │
│         ▼                ▼                ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Fluent Bit / Filebeat                    │  │
│  │              (ログ収集・フォワーディング)                     │  │
│  └─────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│                             ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Elasticsearch Cluster                    │  │
│  │                    (ログストレージ)                          │  │
│  └─────────────────────────┬───────────────────────────────────┘  │
│                             │                                      │
│           ┌─────────────────┼─────────────────┐                   │
│           ▼                 ▼                 ▼                   │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │
│  │   Kibana    │   │    SIEM     │   │  Forensic   │            │
│  │ (可視化)    │   │  (検知)     │   │  (調査)     │            │
│  └─────────────┘   └─────────────┘   └─────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 ログ種別と分析ポイント

#### 3.2.1 Webサーバーログ（Nginx）

```bash
# アクセスログ解析 - 不審なリクエストパターン検出

# 1. SQLインジェクション試行検出
grep -E "(union|select|insert|update|delete|drop|--|'|\")" /var/log/nginx/access.log | \
  awk '{print $1, $4, $7}' | sort | uniq -c | sort -rn | head -20

# 2. ディレクトリトラバーサル検出
grep -E "(\.\./|\.\.%2[fF]|%252[eE])" /var/log/nginx/access.log

# 3. 大量アクセス（DDoS/ブルートフォース）検出
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# 4. 特定時間帯のアクセス抽出
awk -v start="11/Dec/2025:00:00" -v end="11/Dec/2025:23:59" \
  '$4 >= "["start && $4 <= "["end' /var/log/nginx/access.log

# 5. 4xx/5xx エラー分析
grep -E "\" (4[0-9]{2}|5[0-9]{2}) " /var/log/nginx/access.log | \
  awk '{print $9, $7}' | sort | uniq -c | sort -rn
```

#### 3.2.2 アプリケーションログ（Node.js / LifePlan Navigator）

```javascript
// ログ解析用クエリ例（Elasticsearch）

// 1. 認証失敗の検出
{
  "query": {
    "bool": {
      "must": [
        { "match": { "event.type": "authentication" }},
        { "match": { "event.outcome": "failure" }}
      ],
      "filter": [
        { "range": { "@timestamp": { "gte": "now-24h" }}}
      ]
    }
  },
  "aggs": {
    "by_user": {
      "terms": { "field": "user.name.keyword", "size": 10 }
    },
    "by_ip": {
      "terms": { "field": "source.ip", "size": 10 }
    }
  }
}

// 2. 機密データアクセスの検出
{
  "query": {
    "bool": {
      "must": [
        { "match": { "event.category": "database" }},
        { "terms": { "database.table": ["users", "financial_data", "personal_info"] }}
      ]
    }
  },
  "sort": [{ "@timestamp": "desc" }]
}

// 3. エラー急増の検出
{
  "query": {
    "bool": {
      "must": [
        { "match": { "log.level": "error" }}
      ],
      "filter": [
        { "range": { "@timestamp": { "gte": "now-1h" }}}
      ]
    }
  },
  "aggs": {
    "errors_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "5m"
      }
    }
  }
}
```

#### 3.2.3 データベースログ（PostgreSQL）

```sql
-- 監査ログ分析クエリ

-- 1. 特定期間の全データ変更操作
SELECT
    event_time,
    user_name,
    client_addr,
    command_tag,
    object_type,
    object_name,
    statement
FROM pg_audit_log
WHERE event_time BETWEEN '2025-12-10 00:00:00' AND '2025-12-11 23:59:59'
  AND command_tag IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
ORDER BY event_time DESC;

-- 2. 大量データ取得の検出
SELECT
    event_time,
    user_name,
    client_addr,
    statement,
    rows_returned
FROM pg_stat_statements_log
WHERE rows_returned > 1000
  AND event_time > NOW() - INTERVAL '24 hours'
ORDER BY rows_returned DESC;

-- 3. 特権操作の監査
SELECT
    event_time,
    user_name,
    client_addr,
    command_tag,
    statement
FROM pg_audit_log
WHERE command_tag IN ('GRANT', 'REVOKE', 'CREATE ROLE', 'DROP ROLE', 'ALTER ROLE')
ORDER BY event_time DESC;

-- 4. 接続元IPの分析
SELECT
    client_addr,
    COUNT(*) as connection_count,
    array_agg(DISTINCT user_name) as users
FROM pg_audit_log
WHERE event_time > NOW() - INTERVAL '7 days'
GROUP BY client_addr
ORDER BY connection_count DESC;
```

#### 3.2.4 AWS CloudTrailログ分析

```bash
#!/bin/bash
# cloudtrail_analysis.sh - CloudTrailログ分析スクリプト

LOG_DIR="/forensics/aws/cloudtrail"
OUTPUT_DIR="/forensics/analysis/cloudtrail"
mkdir -p $OUTPUT_DIR

# 1. 全ログをJSONとして結合・展開
echo "[*] Merging CloudTrail logs..."
find $LOG_DIR -name "*.json.gz" -exec zcat {} \; | \
  jq -s '[.[].Records[]]' > $OUTPUT_DIR/all_events.json

# 2. IAM関連イベント抽出
echo "[*] Extracting IAM events..."
jq '[.[] | select(.eventSource == "iam.amazonaws.com")]' \
  $OUTPUT_DIR/all_events.json > $OUTPUT_DIR/iam_events.json

# 3. コンソールログイン分析
echo "[*] Analyzing console logins..."
jq '[.[] | select(.eventName == "ConsoleLogin")] |
    group_by(.sourceIPAddress) |
    map({ip: .[0].sourceIPAddress, count: length, users: [.[].userIdentity.userName] | unique})' \
  $OUTPUT_DIR/all_events.json > $OUTPUT_DIR/console_logins.json

# 4. エラーイベント抽出
echo "[*] Extracting error events..."
jq '[.[] | select(.errorCode != null)] |
    group_by(.errorCode) |
    map({error: .[0].errorCode, count: length, events: [.[].eventName] | unique})' \
  $OUTPUT_DIR/all_events.json > $OUTPUT_DIR/error_events.json

# 5. 機密操作の抽出
echo "[*] Extracting sensitive operations..."
jq '[.[] | select(
    .eventName == "CreateAccessKey" or
    .eventName == "DeleteAccessKey" or
    .eventName == "CreateUser" or
    .eventName == "DeleteUser" or
    .eventName == "AttachUserPolicy" or
    .eventName == "PutBucketPolicy" or
    .eventName == "ModifyDBInstance" or
    .eventName == "CreateDBSnapshot"
)]' $OUTPUT_DIR/all_events.json > $OUTPUT_DIR/sensitive_operations.json

# 6. 時系列サマリー
echo "[*] Generating timeline summary..."
jq 'group_by(.eventTime[:13]) |
    map({hour: .[0].eventTime[:13], count: length})' \
  $OUTPUT_DIR/all_events.json > $OUTPUT_DIR/hourly_activity.json

echo "[*] Analysis complete. Results in: $OUTPUT_DIR"
```

### 3.3 ログ相関分析

```python
#!/usr/bin/env python3
# log_correlation.py - 複数ログソースの相関分析

import json
import pandas as pd
from datetime import datetime, timedelta

def load_logs(log_sources):
    """複数のログソースを読み込み"""
    combined_events = []

    for source_name, filepath in log_sources.items():
        with open(filepath, 'r') as f:
            events = json.load(f)
            for event in events:
                event['_source'] = source_name
                combined_events.append(event)

    return pd.DataFrame(combined_events)

def correlate_by_ip(df, target_ip, time_window_minutes=60):
    """特定IPに関連するイベントを時間軸で相関"""

    # IPでフィルタリング（複数のIPフィールドに対応）
    ip_columns = ['source.ip', 'client_addr', 'sourceIPAddress', 'remote_addr']

    ip_events = df[df.apply(
        lambda row: any(row.get(col) == target_ip for col in ip_columns if col in row.index),
        axis=1
    )]

    # タイムスタンプでソート
    ip_events = ip_events.sort_values('timestamp')

    return ip_events

def detect_attack_pattern(df):
    """攻撃パターンの検出"""
    patterns = []

    # パターン1: 認証失敗後の成功（ブルートフォース成功の兆候）
    auth_events = df[df['event.type'] == 'authentication'].copy()
    auth_events = auth_events.sort_values(['source.ip', 'timestamp'])

    for ip, group in auth_events.groupby('source.ip'):
        failures = group[group['event.outcome'] == 'failure']
        successes = group[group['event.outcome'] == 'success']

        if len(failures) > 5 and len(successes) > 0:
            patterns.append({
                'pattern': 'brute_force_success',
                'ip': ip,
                'failure_count': len(failures),
                'first_failure': failures.iloc[0]['timestamp'],
                'success_time': successes.iloc[0]['timestamp']
            })

    # パターン2: データ大量アクセス（データ窃取の兆候）
    data_events = df[df['event.category'] == 'database'].copy()

    for user, group in data_events.groupby('user.name'):
        if group['rows_returned'].sum() > 10000:
            patterns.append({
                'pattern': 'mass_data_access',
                'user': user,
                'total_rows': group['rows_returned'].sum(),
                'tables_accessed': group['database.table'].unique().tolist()
            })

    return patterns

def generate_correlation_report(log_sources, output_path):
    """相関分析レポート生成"""

    df = load_logs(log_sources)

    report = {
        'analysis_date': datetime.now().isoformat(),
        'total_events': len(df),
        'event_sources': df['_source'].value_counts().to_dict(),
        'attack_patterns': detect_attack_pattern(df),
        'unique_ips': df['source.ip'].nunique() if 'source.ip' in df.columns else 0,
        'unique_users': df['user.name'].nunique() if 'user.name' in df.columns else 0
    }

    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)

    return report

# 使用例
if __name__ == "__main__":
    log_sources = {
        'nginx': '/forensics/logs/nginx_parsed.json',
        'app': '/forensics/logs/app_parsed.json',
        'cloudtrail': '/forensics/aws/cloudtrail/all_events.json'
    }

    report = generate_correlation_report(log_sources, '/forensics/analysis/correlation_report.json')
    print(json.dumps(report, indent=2))
```

---

## 4. タイムライン作成手順

### 4.1 タイムライン作成の目的

- インシデントの時系列での全体像把握
- 攻撃者の行動パターン（TTP）の特定
- 侵入経路と横展開の追跡
- 影響範囲の正確な特定

### 4.2 Plaso（log2timeline）によるタイムライン作成

#### 4.2.1 アーティファクト収集

```bash
#!/bin/bash
# timeline_extraction.sh - タイムライン作成用アーティファクト収集

EVIDENCE_PATH=$1  # ディスクイメージまたはマウントポイント
OUTPUT_DIR="/forensics/timeline/$(date +%Y%m%d)"

mkdir -p $OUTPUT_DIR

# 1. log2timeline でアーティファクト抽出
echo "[*] Starting log2timeline extraction..."
log2timeline.py \
  --storage-file $OUTPUT_DIR/plaso.dump \
  --parsers "all" \
  --hashers "md5,sha256" \
  --logfile $OUTPUT_DIR/log2timeline.log \
  $EVIDENCE_PATH

# 2. psort でフィルタリング・出力
echo "[*] Creating filtered timeline..."

# 全イベント（CSV形式）
psort.py \
  -o l2tcsv \
  -w $OUTPUT_DIR/timeline_full.csv \
  $OUTPUT_DIR/plaso.dump

# 特定期間のイベント（インシデント発生前後）
psort.py \
  -o l2tcsv \
  -w $OUTPUT_DIR/timeline_incident.csv \
  --slice "2025-12-10T00:00:00,2025-12-11T23:59:59" \
  $OUTPUT_DIR/plaso.dump

# 3. TLN形式（タイムライン可視化ツール用）
psort.py \
  -o tln \
  -w $OUTPUT_DIR/timeline.tln \
  $OUTPUT_DIR/plaso.dump

echo "[*] Timeline extraction complete: $OUTPUT_DIR"
```

#### 4.2.2 タイムラインフィルタリング

```bash
# タイムラインから重要イベントを抽出

# 1. プログラム実行イベント
grep -E "(prefetch|shimcache|amcache|userassist)" timeline_full.csv > timeline_execution.csv

# 2. ファイル操作イベント
grep -E "(FILE|MFT|NTFS)" timeline_full.csv > timeline_filesystem.csv

# 3. ネットワーク関連
grep -E "(firewall|network|connection|socket)" timeline_full.csv > timeline_network.csv

# 4. ユーザー認証
grep -E "(logon|logoff|authentication|session)" timeline_full.csv > timeline_auth.csv

# 5. レジストリ変更
grep -E "(registry|HKEY)" timeline_full.csv > timeline_registry.csv
```

### 4.3 統合タイムラインテンプレート

```markdown
# インシデントタイムライン

**Incident ID**: INC-YYYYMMDD-XXX
**Timeline Period**: YYYY-MM-DD HH:MM - YYYY-MM-DD HH:MM
**Created By**: CSIRT Engineer
**Last Updated**: YYYY-MM-DD HH:MM

---

## フェーズ別タイムライン

### Phase 1: Initial Access（初期侵入）
| 日時 | イベント | ソース | 詳細 | IoC |
|------|---------|--------|------|-----|
| YYYY-MM-DD HH:MM:SS | フィッシングメール開封 | Email Log | user@example.comが添付ファイルを開く | evil.pdf |
| YYYY-MM-DD HH:MM:SS | マルウェア実行 | Prefetch | invoice.pdf.exeが初回実行 | SHA256:xxx |

### Phase 2: Execution（実行）
| 日時 | イベント | ソース | 詳細 | IoC |
|------|---------|--------|------|-----|
| YYYY-MM-DD HH:MM:SS | PowerShell起動 | EventLog | エンコードされたコマンド実行 | -enc base64... |
| YYYY-MM-DD HH:MM:SS | ペイロードダウンロード | Proxy Log | evil.example.com/payload.exe | C2 domain |

### Phase 3: Persistence（永続化）
| 日時 | イベント | ソース | 詳細 | IoC |
|------|---------|--------|------|-----|
| YYYY-MM-DD HH:MM:SS | Runキー作成 | Registry | HKCU\Software\...\Run\svc | RegKey |
| YYYY-MM-DD HH:MM:SS | スケジュールタスク | EventLog | Task: SystemUpdate | TaskName |

### Phase 4: Privilege Escalation（権限昇格）
| 日時 | イベント | ソース | 詳細 | IoC |
|------|---------|--------|------|-----|
| YYYY-MM-DD HH:MM:SS | mimikatz実行 | Memory | 認証情報ダンプ | mimikatz.exe |
| YYYY-MM-DD HH:MM:SS | ローカル管理者追加 | EventLog | net localgroup administrators | User: attacker |

### Phase 5: Lateral Movement（横展開）
| 日時 | イベント | ソース | 詳細 | IoC |
|------|---------|--------|------|-----|
| YYYY-MM-DD HH:MM:SS | RDPログイン | EventLog (4624) | Server-DBへType10ログオン | Source: PC-01 |
| YYYY-MM-DD HH:MM:SS | PsExec使用 | EventLog | リモートサービス作成 | PSEXESVC |

### Phase 6: Collection & Exfiltration（収集・窃取）
| 日時 | イベント | ソース | 詳細 | IoC |
|------|---------|--------|------|-----|
| YYYY-MM-DD HH:MM:SS | データベースアクセス | DB Audit Log | SELECT * FROM users | Query |
| YYYY-MM-DD HH:MM:SS | データ圧縮 | File System | data.7z作成 | 100MB |
| YYYY-MM-DD HH:MM:SS | 外部送信 | Proxy Log | POST to evil.com/upload | 100MB upload |

---

## 視覚的タイムライン

```
Dec 10                Dec 11                Dec 12
|-----|-----|-----|-----|-----|-----|-----|-----|
        ↓                     ↓
     [Initial]            [Detected]
      Access              & Contained
        |                     |
        └──[Execution]────────┘
           [Persistence]
           [Priv Escalation]
           [Lateral Movement]
           [Exfiltration]
```

---

## MITRE ATT&CK マッピング

| Tactic | Technique | Evidence |
|--------|-----------|----------|
| Initial Access | T1566.001 Phishing: Attachment | Email log, Prefetch |
| Execution | T1059.001 PowerShell | EventLog 4104 |
| Persistence | T1547.001 Registry Run Keys | Registry hive |
| Privilege Escalation | T1003.001 LSASS Memory | Memory dump |
| Lateral Movement | T1021.001 RDP | EventLog 4624 |
| Exfiltration | T1041 Exfiltration Over C2 | Proxy log |

---

## 結論

### 攻撃概要
[インシデントの概要を記載]

### 根本原因
[Root Causeを記載]

### 影響範囲
- 侵害されたホスト: X台
- 漏洩したデータ: [データ種別]
- 影響を受けたユーザー: X名

### 推奨事項
1. [推奨事項1]
2. [推奨事項2]
3. [推奨事項3]
```

---

## 5. 調査能力の維持・向上

### 5.1 定期訓練計画

| 訓練内容 | 頻度 | 担当 |
|---------|------|------|
| マルウェア解析演習 | 月次 | CSIRT Engineer |
| ログ分析ドリル | 週次 | SOC + CSIRT |
| タイムライン作成演習 | 月次 | CSIRT Engineer |
| インシデント対応シミュレーション | 四半期 | CSIRT全体 |

### 5.2 ツールアップデート管理

```bash
#!/bin/bash
# forensic_tools_update.sh - フォレンジックツール更新スクリプト

echo "[*] Updating forensic tools..."

# Volatility
pip3 install --upgrade volatility3

# YARA rules
cd /opt/yara-rules && git pull

# Cuckoo Sandbox
pip3 install --upgrade cuckoo

# Plaso/log2timeline
pip3 install --upgrade plaso

# Ghidra (manual update check)
echo "[!] Check Ghidra updates: https://ghidra-sre.org/"

echo "[*] Update complete."
```

### 5.3 IoC フィードの自動更新

```yaml
# ioc_feeds.yaml - IoC フィード設定

feeds:
  - name: "AlienVault OTX"
    url: "https://otx.alienvault.com/api/v1/pulses/subscribed"
    format: "json"
    update_interval: "1h"

  - name: "Abuse.ch URLhaus"
    url: "https://urlhaus.abuse.ch/downloads/csv_recent/"
    format: "csv"
    update_interval: "30m"

  - name: "Malware Bazaar"
    url: "https://bazaar.abuse.ch/export/txt/sha256/recent/"
    format: "txt"
    update_interval: "1h"

output:
  yara_rules: "/opt/yara-rules/ioc_rules.yar"
  siem_import: "/forensics/ioc/latest.json"
```

---

## 6. 付録

### 6.1 関連文書

- LifePlan_Navigator_Forensic_Procedures.md（フォレンジック手順書）
- LifePlan_Navigator_Recovery_Procedures.md（復旧手順書）
- LifePlan_Navigator_Investigation_Checklist.md（調査チェックリスト）

### 6.2 改訂履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-11 | CSIRT Engineer | 初版作成 |

---

**Document Classification**: Internal Use Only
**Review Cycle**: Quarterly
**Next Review**: 2026-03-11
