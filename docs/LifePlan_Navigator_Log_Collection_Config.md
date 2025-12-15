# LifePlan Navigator ログ収集設定書

| 項目 | 内容 |
|------|------|
| ドキュメント名 | ログ収集設定書 |
| バージョン | 1.0 |
| 作成日 | 2025-12-11 |
| 作成者 | SOC Analyst |
| レビュー | CSIRT Team Leader, Network Engineer |
| 分類 | Confidential |

---

## 1. 概要

### 1.1 目的
本ドキュメントは、LifePlan Navigator のログ収集基盤を構築するための Fluent Bit および Fluentd の設定を定義する。

### 1.2 ログ収集アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ログ収集アーキテクチャ                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Source Layer                                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │Container │ │ System   │ │ App      │ │ Security │ │ Cloud    │   │  │
│  │  │ Logs     │ │ Logs     │ │ Logs     │ │ Logs     │ │ Logs     │   │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │  │
│  └───────┼────────────┼────────────┼────────────┼────────────┼──────────┘  │
│          │            │            │            │            │             │
│          └────────────┴────────────┴────────────┴────────────┘             │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Collection Layer (Fluent Bit)                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Input → Parser → Filter → Buffer → Output                      │ │  │
│  │  │                                                                  │ │  │
│  │  │  - Tail plugin for files                                        │ │  │
│  │  │  - Forward plugin for containers                                │ │  │
│  │  │  - Systemd plugin for journal                                   │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────┬────────────────────────────┘  │
│                                            │                                │
│                                            ▼                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   Aggregation Layer (Fluentd)                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Buffer → Process → Route → Output                              │ │  │
│  │  │                                                                  │ │  │
│  │  │  - Enrichment (GeoIP, Threat Intel)                             │ │  │
│  │  │  - Normalization                                                │ │  │
│  │  │  - Routing by type/severity                                     │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────┬────────────────────────────┘  │
│                                            │                                │
│              ┌─────────────────────────────┼─────────────────────────────┐  │
│              │                             │                             │  │
│              ▼                             ▼                             ▼  │
│  ┌──────────────────┐         ┌──────────────────┐         ┌─────────────┐ │
│  │   Splunk ES      │         │   Elasticsearch  │         │ S3 Archive  │ │
│  │   (SIEM)         │         │   (Analytics)    │         │ (Long-term) │ │
│  └──────────────────┘         └──────────────────┘         └─────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fluent Bit 設定

### 2.1 メイン設定ファイル

```ini
# /etc/fluent-bit/fluent-bit.conf

[SERVICE]
    Flush           1
    Daemon          Off
    Log_Level       info
    Parsers_File    parsers.conf
    Plugins_File    plugins.conf
    HTTP_Server     On
    HTTP_Listen     0.0.0.0
    HTTP_Port       2020
    Health_Check    On
    HC_Errors_Count 5
    HC_Retry_Failure_Count 5
    HC_Period       60
    storage.path    /var/log/fluent-bit/buffer
    storage.sync    normal
    storage.checksum off
    storage.backlog.mem_limit 50M

# Include all input configurations
@INCLUDE inputs/*.conf
@INCLUDE filters/*.conf
@INCLUDE outputs/*.conf
```

### 2.2 入力設定

#### コンテナログ入力

```ini
# /etc/fluent-bit/inputs/containers.conf

# Kubernetes コンテナログ
[INPUT]
    Name              tail
    Tag               kube.*
    Path              /var/log/containers/*.log
    Parser            docker
    DB                /var/log/fluent-bit/flb_kube.db
    Mem_Buf_Limit     50MB
    Skip_Long_Lines   On
    Refresh_Interval  10
    Rotate_Wait       30
    storage.type      filesystem

# アプリケーション専用ログ
[INPUT]
    Name              tail
    Tag               app.lifeplan.*
    Path              /var/log/lifeplan/*.log
    Parser            json
    DB                /var/log/fluent-bit/flb_app.db
    Mem_Buf_Limit     50MB
    Refresh_Interval  5
    Rotate_Wait       30
    storage.type      filesystem
```

#### システムログ入力

```ini
# /etc/fluent-bit/inputs/system.conf

# Systemd Journal
[INPUT]
    Name              systemd
    Tag               host.systemd.*
    Systemd_Filter    _SYSTEMD_UNIT=docker.service
    Systemd_Filter    _SYSTEMD_UNIT=kubelet.service
    Systemd_Filter    _SYSTEMD_UNIT=sshd.service
    Read_From_Tail    On
    Strip_Underscores On
    storage.type      filesystem

# Syslog
[INPUT]
    Name              syslog
    Tag               host.syslog
    Mode              tcp
    Listen            0.0.0.0
    Port              5140
    Parser            syslog-rfc3164
    Buffer_Chunk_Size 32k
    Buffer_Max_Size   64k
```

#### セキュリティログ入力

```ini
# /etc/fluent-bit/inputs/security.conf

# 認証ログ (Linux)
[INPUT]
    Name              tail
    Tag               security.auth
    Path              /var/log/auth.log,/var/log/secure
    Parser            syslog-rfc3164
    DB                /var/log/fluent-bit/flb_auth.db
    Mem_Buf_Limit     20MB
    Refresh_Interval  5
    storage.type      filesystem

# 監査ログ
[INPUT]
    Name              tail
    Tag               security.audit
    Path              /var/log/audit/audit.log
    Parser            audit
    DB                /var/log/fluent-bit/flb_audit.db
    Mem_Buf_Limit     30MB
    Refresh_Interval  5
    storage.type      filesystem

# WAFログ
[INPUT]
    Name              tail
    Tag               security.waf
    Path              /var/log/nginx/waf_*.log
    Parser            json
    DB                /var/log/fluent-bit/flb_waf.db
    Mem_Buf_Limit     50MB
    Refresh_Interval  2
    storage.type      filesystem
```

### 2.3 パーサー設定

```ini
# /etc/fluent-bit/parsers.conf

# JSON形式
[PARSER]
    Name        json
    Format      json
    Time_Key    timestamp
    Time_Format %Y-%m-%dT%H:%M:%S.%L%z
    Time_Keep   On

# Docker形式
[PARSER]
    Name        docker
    Format      json
    Time_Key    time
    Time_Format %Y-%m-%dT%H:%M:%S.%L
    Time_Keep   On

# Syslog RFC3164
[PARSER]
    Name        syslog-rfc3164
    Format      regex
    Regex       ^(?<time>[^ ]* {1,2}[^ ]* [^ ]*) (?<host>[^ ]*) (?<ident>[a-zA-Z0-9_\/\.\-]*)(?:\[(?<pid>[0-9]+)\])?(?:[^\:]*\:)? *(?<message>.*)$
    Time_Key    time
    Time_Format %b %d %H:%M:%S
    Time_Keep   On

# Syslog RFC5424
[PARSER]
    Name        syslog-rfc5424
    Format      regex
    Regex       ^\<(?<pri>[0-9]{1,5})\>1 (?<time>[^ ]+) (?<host>[^ ]+) (?<ident>[^ ]+) (?<pid>[^ ]+) (?<msgid>[^ ]+) (?<extradata>(\[(.*?)\]|-)+) (?<message>.+)$
    Time_Key    time
    Time_Format %Y-%m-%dT%H:%M:%S.%L%z
    Time_Keep   On

# Linux Audit Log
[PARSER]
    Name        audit
    Format      regex
    Regex       ^type=(?<type>[^ ]+) msg=audit\((?<time>[0-9]+)\.[0-9]+:[0-9]+\): (?<message>.*)$
    Time_Key    time
    Time_Format %s
    Time_Keep   On

# Nginx Access Log
[PARSER]
    Name        nginx_access
    Format      regex
    Regex       ^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \[(?<time>[^\]]*)\] "(?<method>\S+)(?: +(?<path>[^\"]*?)(?: +\S*)?)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^\"]*)" "(?<agent>[^\"]*)")?$
    Time_Key    time
    Time_Format %d/%b/%Y:%H:%M:%S %z
    Time_Keep   On

# Application Log (LifePlan)
[PARSER]
    Name        lifeplan_app
    Format      json
    Time_Key    timestamp
    Time_Format %Y-%m-%dT%H:%M:%S.%LZ
    Time_Keep   On
    Types       user_id:integer request_id:string duration_ms:integer

# Keycloak Auth Log
[PARSER]
    Name        keycloak_auth
    Format      json
    Time_Key    time
    Time_Format %Y-%m-%dT%H:%M:%S.%L%z
    Time_Keep   On
```

### 2.4 フィルター設定

```ini
# /etc/fluent-bit/filters/kubernetes.conf

# Kubernetes メタデータ追加
[FILTER]
    Name                kubernetes
    Match               kube.*
    Kube_URL            https://kubernetes.default.svc:443
    Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
    Kube_Tag_Prefix     kube.var.log.containers.
    Merge_Log           On
    Merge_Log_Key       log_processed
    K8S-Logging.Parser  On
    K8S-Logging.Exclude On
    Labels              On
    Annotations         On
    Buffer_Size         0
```

```ini
# /etc/fluent-bit/filters/enrichment.conf

# 共通フィールド追加
[FILTER]
    Name          record_modifier
    Match         *
    Record        environment ${ENVIRONMENT}
    Record        cluster ${CLUSTER_NAME}
    Record        application lifeplan-navigator
    Record        collector fluent-bit

# 機密情報マスキング
[FILTER]
    Name          modify
    Match         app.lifeplan.*
    Condition     Key_value_matches password .+
    Set           password [REDACTED]

[FILTER]
    Name          modify
    Match         app.lifeplan.*
    Condition     Key_value_matches credit_card \d{13,16}
    Set           credit_card [REDACTED]

[FILTER]
    Name          modify
    Match         app.lifeplan.*
    Condition     Key_value_matches ssn \d{3}-\d{2}-\d{4}
    Set           ssn [REDACTED]

# GeoIP エンリッチメント (Lua)
[FILTER]
    Name          lua
    Match         security.*
    script        /etc/fluent-bit/scripts/geoip.lua
    call          enrich_geoip
```

```ini
# /etc/fluent-bit/filters/security.conf

# セキュリティログ分類
[FILTER]
    Name          rewrite_tag
    Match         security.*
    Rule          $event_type ^login_failure$ security.auth.failure false
    Rule          $event_type ^login_success$ security.auth.success false
    Rule          $attack_type .+ security.attack.$attack_type false

# セキュリティスコアリング
[FILTER]
    Name          lua
    Match         security.auth.failure
    script        /etc/fluent-bit/scripts/security_score.lua
    call          calculate_risk_score

# 重要度タグ付け
[FILTER]
    Name          modify
    Match         security.attack.*
    Add           severity critical
    Add           category security_incident
```

### 2.5 出力設定

```ini
# /etc/fluent-bit/outputs/forward.conf

# Fluentd へ転送 (メイン)
[OUTPUT]
    Name              forward
    Match             *
    Host              fluentd-aggregator
    Port              24224
    Retry_Limit       False
    storage.total_limit_size  1G

# バックアップ出力 (Fluentd障害時)
[OUTPUT]
    Name              forward
    Match             *
    Host              fluentd-aggregator-backup
    Port              24224
    Retry_Limit       5
    Require_ack_response True
```

```ini
# /etc/fluent-bit/outputs/metrics.conf

# Prometheus メトリクス出力
[OUTPUT]
    Name              prometheus_exporter
    Match             internal_metrics
    Host              0.0.0.0
    Port              2021

# CloudWatch メトリクス
[OUTPUT]
    Name              cloudwatch_logs
    Match             app.lifeplan.*
    region            ap-northeast-1
    log_group_name    /lifeplan/application
    log_stream_prefix fluent-bit-
    auto_create_group On
    log_retention_days 30
```

### 2.6 Lua スクリプト

```lua
-- /etc/fluent-bit/scripts/geoip.lua

local geoip = require("geoip")
local db = geoip.open("/usr/share/GeoIP/GeoLite2-City.mmdb")

function enrich_geoip(tag, timestamp, record)
    local src_ip = record["src_ip"] or record["client_ip"] or record["remote_addr"]

    if src_ip then
        local result = db:lookup(src_ip)
        if result then
            record["geo_country"] = result.country.iso_code
            record["geo_city"] = result.city.name
            record["geo_latitude"] = result.location.latitude
            record["geo_longitude"] = result.location.longitude
            record["geo_timezone"] = result.location.time_zone
        end
    end

    return 1, timestamp, record
end
```

```lua
-- /etc/fluent-bit/scripts/security_score.lua

function calculate_risk_score(tag, timestamp, record)
    local score = 0

    -- ログイン失敗回数による加点
    local failures = record["failure_count"] or 1
    score = score + (failures * 10)

    -- 異常な時間帯
    local hour = os.date("*t", timestamp).hour
    if hour >= 0 and hour <= 5 then
        score = score + 20
    end

    -- 既知の悪意あるIP
    if record["threat_intel_match"] then
        score = score + 50
    end

    -- 異常な地域
    if record["geo_country"] and not is_allowed_country(record["geo_country"]) then
        score = score + 30
    end

    record["risk_score"] = math.min(score, 100)

    -- 高リスクの場合はタグを変更
    if score >= 80 then
        record["risk_level"] = "critical"
    elseif score >= 60 then
        record["risk_level"] = "high"
    elseif score >= 40 then
        record["risk_level"] = "medium"
    else
        record["risk_level"] = "low"
    end

    return 1, timestamp, record
end

function is_allowed_country(country)
    local allowed = {JP = true, US = true, SG = true}
    return allowed[country] or false
end
```

---

## 3. Fluentd 設定

### 3.1 メイン設定ファイル

```xml
<!-- /etc/fluentd/fluent.conf -->

<system>
  log_level info
  workers 4
  root_dir /var/log/fluentd
</system>

# Include configurations
@include sources/*.conf
@include filters/*.conf
@include outputs/*.conf
@include monitoring.conf
```

### 3.2 ソース設定

```xml
<!-- /etc/fluentd/sources/forward.conf -->

# Fluent Bit からの受信
<source>
  @type forward
  @id input_forward
  port 24224
  bind 0.0.0.0

  <transport tls>
    cert_path /etc/fluentd/certs/server.crt
    private_key_path /etc/fluentd/certs/server.key
    ca_path /etc/fluentd/certs/ca.crt
  </transport>

  <security>
    self_hostname fluentd-aggregator
    shared_key ${FLUENTD_SHARED_KEY}
  </security>
</source>

# HTTP 入力 (外部システム連携)
<source>
  @type http
  @id input_http
  port 9880
  bind 0.0.0.0
  body_size_limit 32m
  keepalive_timeout 10s

  <parse>
    @type json
  </parse>
</source>
```

### 3.3 フィルター設定

```xml
<!-- /etc/fluentd/filters/enrichment.conf -->

# タイムスタンプ正規化
<filter **>
  @type record_transformer
  enable_ruby true
  <record>
    @timestamp ${time.strftime('%Y-%m-%dT%H:%M:%S.%LZ')}
    ingestion_time ${Time.now.strftime('%Y-%m-%dT%H:%M:%S.%LZ')}
  </record>
</filter>

# 脅威インテリジェンス照合
<filter security.**>
  @type threat_intel
  @id filter_threat_intel

  # IOC データベース設定
  ioc_database_path /var/lib/fluentd/threat_intel/ioc.db
  update_interval 3600

  # 照合フィールド
  <match_field>
    source src_ip
    type ip
  </match_field>
  <match_field>
    source domain
    type domain
  </match_field>
  <match_field>
    source file_hash
    type hash
  </match_field>
</filter>

# ユーザーコンテキスト追加
<filter app.lifeplan.**>
  @type enrichment
  @id filter_user_context

  <lookup>
    type redis
    host redis-cache
    port 6379
    key_prefix user:context:
    lookup_field user_id
    output_field user_context
  </lookup>
</filter>
```

```xml
<!-- /etc/fluentd/filters/parsing.conf -->

# アプリケーションログパース
<filter app.lifeplan.**>
  @type parser
  key_name log
  reserve_data true
  remove_key_name_field true

  <parse>
    @type json
    time_key timestamp
    time_format %Y-%m-%dT%H:%M:%S.%LZ
  </parse>
</filter>

# セキュリティイベント正規化
<filter security.**>
  @type record_transformer
  enable_ruby true
  <record>
    # CEF形式への正規化
    cef_version CEF:0
    cef_vendor LifePlan
    cef_product Navigator
    cef_version 1.0
    cef_signature_id ${record["event_type"] || "unknown"}
    cef_name ${record["event_name"] || record["message"]}
    cef_severity ${record["severity"] || "5"}
  </record>
</filter>

# ログレベル抽出
<filter app.lifeplan.**>
  @type record_transformer
  enable_ruby true
  <record>
    log_level ${record["level"] || record["severity"] || "INFO"}
    log_level_num ${
      case record["level"]&.upcase
      when "FATAL", "CRITICAL" then 50
      when "ERROR" then 40
      when "WARN", "WARNING" then 30
      when "INFO" then 20
      when "DEBUG" then 10
      else 20
      end
    }
  </record>
</filter>
```

### 3.4 出力設定

```xml
<!-- /etc/fluentd/outputs/splunk.conf -->

# Splunk ES への送信 (セキュリティログ)
<match security.**>
  @type splunk_hec
  @id output_splunk_security

  hec_host splunk-hec.internal
  hec_port 8088
  hec_token ${SPLUNK_HEC_TOKEN}

  # SSL設定
  use_ssl true
  ssl_verify true
  ca_file /etc/fluentd/certs/splunk-ca.crt

  # インデックス設定
  index lifeplan_security
  sourcetype _json

  # バッファ設定
  <buffer>
    @type file
    path /var/log/fluentd/buffer/splunk_security
    flush_mode interval
    flush_interval 5s
    retry_max_interval 30s
    retry_forever true
    chunk_limit_size 10MB
    total_limit_size 1GB
  </buffer>

  # フォーマット
  <format>
    @type json
  </format>
</match>

# Splunk への送信 (アプリケーションログ)
<match app.lifeplan.**>
  @type splunk_hec
  @id output_splunk_app

  hec_host splunk-hec.internal
  hec_port 8088
  hec_token ${SPLUNK_HEC_TOKEN}

  use_ssl true
  index lifeplan_app
  sourcetype _json

  <buffer>
    @type file
    path /var/log/fluentd/buffer/splunk_app
    flush_mode interval
    flush_interval 10s
    chunk_limit_size 10MB
    total_limit_size 2GB
  </buffer>
</match>
```

```xml
<!-- /etc/fluentd/outputs/elasticsearch.conf -->

# Elasticsearch への送信 (分析用)
<match **>
  @type elasticsearch
  @id output_elasticsearch

  hosts elasticsearch-cluster:9200
  user ${ES_USER}
  password ${ES_PASSWORD}
  scheme https
  ssl_verify true
  ca_file /etc/fluentd/certs/es-ca.crt

  # インデックス設定
  index_name lifeplan-logs
  type_name _doc
  logstash_format true
  logstash_prefix lifeplan
  logstash_dateformat %Y.%m.%d

  # ILM設定
  ilm_policy_id lifeplan-logs-policy
  ilm_policy_overwrite false
  template_name lifeplan-logs
  template_file /etc/fluentd/templates/lifeplan-logs.json
  template_overwrite false

  # バッファ設定
  <buffer tag, time>
    @type file
    path /var/log/fluentd/buffer/elasticsearch
    timekey 1h
    timekey_wait 5m
    flush_mode interval
    flush_interval 30s
    retry_max_interval 60s
    retry_forever true
    chunk_limit_size 50MB
    total_limit_size 5GB
    compress gzip
  </buffer>

  # リトライ設定
  reconnect_on_error true
  reload_on_failure true
  reload_connections false
  request_timeout 60s
</match>
```

```xml
<!-- /etc/fluentd/outputs/s3_archive.conf -->

# S3 への長期保存
<match **>
  @type s3
  @id output_s3

  aws_key_id ${AWS_ACCESS_KEY_ID}
  aws_sec_key ${AWS_SECRET_ACCESS_KEY}
  s3_bucket lifeplan-logs-archive
  s3_region ap-northeast-1

  # パス設定
  path logs/${tag}/%Y/%m/%d/
  s3_object_key_format %{path}%{time_slice}_%{index}.%{file_extension}

  # ファイル設定
  <buffer tag, time>
    @type file
    path /var/log/fluentd/buffer/s3
    timekey 1h
    timekey_wait 10m
    timekey_use_utc true
    chunk_limit_size 256MB
    total_limit_size 10GB
    compress gzip
  </buffer>

  # フォーマット
  <format>
    @type json
  </format>

  # メタデータ
  store_as gzip
  storage_class STANDARD_IA
</match>
```

### 3.5 ルーティング設定

```xml
<!-- /etc/fluentd/routing.conf -->

# ログルーティング
<match **>
  @type copy

  # セキュリティログ → 全宛先
  <store>
    @type relabel
    @label @SECURITY
  </store>

  # アプリログ → 分析用
  <store>
    @type relabel
    @label @APPLICATION
  </store>

  # 全ログ → アーカイブ
  <store>
    @type relabel
    @label @ARCHIVE
  </store>
</match>

<label @SECURITY>
  <match security.**>
    @type copy

    # Splunk (リアルタイム)
    <store>
      @type splunk_hec
      # ... Splunk設定
    </store>

    # PagerDuty (Critical)
    <store>
      @type pagerduty
      @id output_pagerduty

      <filter>
        @type grep
        <regexp>
          key severity
          pattern ^(critical|high)$
        </regexp>
      </filter>

      service_key ${PAGERDUTY_SERVICE_KEY}
    </store>
  </match>
</label>

<label @APPLICATION>
  <match app.**>
    @type elasticsearch
    # ... Elasticsearch設定
  </match>
</label>

<label @ARCHIVE>
  <match **>
    @type s3
    # ... S3設定
  </match>
</label>
```

---

## 4. Kubernetes デプロイ設定

### 4.1 Fluent Bit DaemonSet

```yaml
# fluent-bit-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
  labels:
    app: fluent-bit
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "2020"
        prometheus.io/path: "/api/v1/metrics/prometheus"
    spec:
      serviceAccountName: fluent-bit
      tolerations:
        - key: node-role.kubernetes.io/master
          effect: NoSchedule
      containers:
        - name: fluent-bit
          image: fluent/fluent-bit:2.2.0
          imagePullPolicy: Always
          ports:
            - containerPort: 2020
              name: metrics
            - containerPort: 2021
              name: prometheus
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: CLUSTER_NAME
              value: "lifeplan-production"
            - name: ENVIRONMENT
              value: "production"
          resources:
            limits:
              memory: 500Mi
              cpu: 500m
            requests:
              memory: 100Mi
              cpu: 100m
          volumeMounts:
            - name: varlog
              mountPath: /var/log
              readOnly: true
            - name: varlibdockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true
            - name: fluent-bit-config
              mountPath: /fluent-bit/etc/
            - name: fluent-bit-buffer
              mountPath: /var/log/fluent-bit/buffer
          livenessProbe:
            httpGet:
              path: /api/v1/health
              port: 2020
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/v1/health
              port: 2020
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
        - name: fluent-bit-config
          configMap:
            name: fluent-bit-config
        - name: fluent-bit-buffer
          emptyDir: {}
```

### 4.2 Fluentd Deployment

```yaml
# fluentd-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fluentd-aggregator
  namespace: logging
  labels:
    app: fluentd-aggregator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fluentd-aggregator
  template:
    metadata:
      labels:
        app: fluentd-aggregator
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "24231"
    spec:
      serviceAccountName: fluentd
      containers:
        - name: fluentd
          image: fluent/fluentd:v1.16-debian
          imagePullPolicy: Always
          ports:
            - containerPort: 24224
              name: forward
            - containerPort: 9880
              name: http
            - containerPort: 24231
              name: prometheus
          env:
            - name: FLUENTD_CONF
              value: "fluent.conf"
            - name: SPLUNK_HEC_TOKEN
              valueFrom:
                secretKeyRef:
                  name: fluentd-secrets
                  key: splunk-hec-token
            - name: ES_USER
              valueFrom:
                secretKeyRef:
                  name: fluentd-secrets
                  key: es-user
            - name: ES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: fluentd-secrets
                  key: es-password
          resources:
            limits:
              memory: 2Gi
              cpu: 1000m
            requests:
              memory: 512Mi
              cpu: 200m
          volumeMounts:
            - name: fluentd-config
              mountPath: /fluentd/etc/
            - name: fluentd-buffer
              mountPath: /var/log/fluentd/buffer
            - name: fluentd-certs
              mountPath: /etc/fluentd/certs
              readOnly: true
          livenessProbe:
            httpGet:
              path: /fluentd.healthcheck?json=%7B%22ping%22%3A+%22pong%22%7D
              port: 9880
            initialDelaySeconds: 30
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /fluentd.healthcheck?json=%7B%22ping%22%3A+%22pong%22%7D
              port: 9880
            initialDelaySeconds: 10
            periodSeconds: 10
      volumes:
        - name: fluentd-config
          configMap:
            name: fluentd-config
        - name: fluentd-buffer
          persistentVolumeClaim:
            claimName: fluentd-buffer-pvc
        - name: fluentd-certs
          secret:
            secretName: fluentd-certs
---
apiVersion: v1
kind: Service
metadata:
  name: fluentd-aggregator
  namespace: logging
spec:
  selector:
    app: fluentd-aggregator
  ports:
    - name: forward
      port: 24224
      targetPort: 24224
    - name: http
      port: 9880
      targetPort: 9880
  type: ClusterIP
```

---

## 5. 監視・運用

### 5.1 メトリクス収集

```yaml
# Prometheus ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluent-bit
  endpoints:
    - port: metrics
      interval: 30s
      path: /api/v1/metrics/prometheus

---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: fluentd-aggregator
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluentd-aggregator
  endpoints:
    - port: prometheus
      interval: 30s
```

### 5.2 アラート設定

```yaml
# Prometheus Alert Rules for Logging
groups:
  - name: logging_alerts
    rules:
      - alert: FluentBitDown
        expr: up{job="fluent-bit"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Fluent Bit is down"
          description: "Fluent Bit on {{ $labels.instance }} is not responding"

      - alert: FluentdBufferHigh
        expr: fluentd_output_status_buffer_total_bytes / fluentd_output_status_buffer_available_space_ratio > 0.8
        for: 10m
        labels:
          severity: high
        annotations:
          summary: "Fluentd buffer is filling up"
          description: "Fluentd buffer usage is {{ $value | humanizePercentage }}"

      - alert: LogIngestionLag
        expr: rate(fluentd_output_status_emit_count[5m]) < 100
        for: 15m
        labels:
          severity: medium
        annotations:
          summary: "Log ingestion rate is low"
          description: "Log ingestion rate has dropped below expected threshold"
```

---

## 6. 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| LifePlan_Navigator_SOC_Monitoring_Design.md | SOC監視設計書 |
| LifePlan_Navigator_Alert_Implementation.md | アラート実装設定書 |
| LifePlan_Navigator_Dashboard_Design.md | ダッシュボード設計書 |

---

## 7. 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|--------|
| 1.0 | 2025-12-11 | 初版作成 | SOC Analyst |

---

## 8. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| 作成者 | SOC Analyst | 2025-12-11 | |
| レビュー | CSIRT Team Leader | | |
| レビュー | Network Engineer | | |
| 承認 | CISO | | |
