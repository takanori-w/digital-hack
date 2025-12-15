# LifePlan Navigator - データベース設計書

## 1. ER図

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIP DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      users       │       │   user_profiles  │       │ user_preferences │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │──1:1──│ PK id            │       │ PK id            │
│    email         │       │ FK user_id       │──1:1──│ FK user_id       │
│    password_hash │       │    occupation    │       │    email_notif   │
│    name          │       │    industry      │       │    push_notif    │
│    birth_date    │       │    annual_income │       │    categories    │
│    prefecture    │       │    household_size│       │    created_at    │
│    status        │       │    marital_status│       │    updated_at    │
│    created_at    │       │    has_children  │       └──────────────────┘
│    updated_at    │       │    children_count│
└──────────────────┘       │    created_at    │
         │                 │    updated_at    │
         │                 └──────────────────┘
         │
         │ 1:N
         │
┌────────┴─────────┐       ┌──────────────────┐       ┌──────────────────┐
│   life_events    │       │    subsidies     │       │ subsidy_categories│
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │──N:1──│ PK id            │
│ FK user_id       │       │ FK category_id   │       │    name          │
│    category      │       │    name          │       │    slug          │
│    title         │       │    description   │       │    description   │
│    description   │  N:M  │    amount_type   │       │    icon          │
│    event_date    │───────│    amount_value  │       │    sort_order    │
│    status        │       │    prefecture    │       └──────────────────┘
│    metadata      │       │    municipality  │
│    created_at    │       │    eligibility   │
│    updated_at    │       │    application   │
└──────────────────┘       │    source_url    │
         │                 │    is_active     │
         │ 1:N             │    start_date    │
         │                 │    end_date      │
┌────────┴─────────┐       │    created_at    │
│ event_subsidies  │       │    updated_at    │
├──────────────────┤       └──────────────────┘
│ PK id            │               │
│ FK event_id      │               │ 1:N
│ FK subsidy_id    │               │
│    is_applied    │       ┌───────┴──────────┐
│    applied_at    │       │subsidy_conditions│
│    created_at    │       ├──────────────────┤
└──────────────────┘       │ PK id            │
                           │ FK subsidy_id    │
         │                 │    condition_text│
         │ 1:N             │    is_required   │
         │                 │    sort_order    │
┌────────┴─────────┐       └──────────────────┘
│   simulations    │
├──────────────────┤
│ PK id            │
│ FK user_id       │
│    name          │
│    target_years  │
│    assumptions   │
│    results       │
│    status        │
│    created_at    │
│    completed_at  │
└──────────────────┘
         │
         │ 1:N
         │
┌────────┴─────────┐       ┌──────────────────┐
│simulation_events │       │  notifications   │
├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │
│ FK simulation_id │       │ FK user_id       │
│ FK event_id      │       │    category      │
│    include       │       │    title         │
│    created_at    │       │    message       │
└──────────────────┘       │    priority      │
                           │    action_type   │
                           │    action_url    │
                           │    is_read       │
                           │    created_at    │
                           │    read_at       │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   oauth_accounts │       │  refresh_tokens  │
├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │
│ FK user_id       │       │ FK user_id       │
│    provider      │       │    token_hash    │
│    provider_id   │       │    expires_at    │
│    access_token  │       │    created_at    │
│    refresh_token │       │    revoked_at    │
│    expires_at    │       └──────────────────┘
│    created_at    │
│    updated_at    │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  external_data   │       │   audit_logs     │
├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │
│    source        │       │ FK user_id       │
│    data_type     │       │    action        │
│    data          │       │    resource_type │
│    fetched_at    │       │    resource_id   │
│    expires_at    │       │    ip_address    │
│    created_at    │       │    user_agent    │
└──────────────────┘       │    metadata      │
                           │    created_at    │
                           └──────────────────┘
```

## 2. テーブル定義

### 2.1 users（ユーザー）

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),  -- NULLの場合はOAuth専用
    name            VARCHAR(100) NOT NULL,
    birth_date      DATE NOT NULL,
    prefecture      VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_status_check
        CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_prefecture ON users(prefecture);
CREATE INDEX idx_users_status ON users(status);
```

### 2.2 user_profiles（ユーザープロファイル）

```sql
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    occupation      VARCHAR(100),
    industry        VARCHAR(100),
    annual_income   INTEGER,  -- 万円単位ではなく円単位
    household_size  SMALLINT DEFAULT 1,
    marital_status  VARCHAR(20) DEFAULT 'single',
    has_children    BOOLEAN DEFAULT FALSE,
    children_count  SMALLINT DEFAULT 0,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_profiles_marital_status_check
        CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    CONSTRAINT user_profiles_income_check
        CHECK (annual_income IS NULL OR annual_income >= 0),
    CONSTRAINT user_profiles_household_check
        CHECK (household_size >= 1)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_annual_income ON user_profiles(annual_income);
```

### 2.3 user_preferences（ユーザー設定）

```sql
CREATE TABLE user_preferences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notification  BOOLEAN NOT NULL DEFAULT TRUE,
    push_notification   BOOLEAN NOT NULL DEFAULT TRUE,
    notification_categories TEXT[] NOT NULL DEFAULT ARRAY['subsidy', 'law_change', 'tips'],
    language            VARCHAR(10) NOT NULL DEFAULT 'ja',
    timezone            VARCHAR(50) NOT NULL DEFAULT 'Asia/Tokyo',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### 2.4 life_events（ライフイベント）

```sql
CREATE TABLE life_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    event_date      DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT life_events_category_check
        CHECK (category IN ('marriage', 'birth', 'job_change', 'housing',
                           'education', 'retirement', 'medical', 'other')),
    CONSTRAINT life_events_status_check
        CHECK (status IN ('pending', 'completed', 'cancelled'))
);

CREATE INDEX idx_life_events_user_id ON life_events(user_id);
CREATE INDEX idx_life_events_category ON life_events(category);
CREATE INDEX idx_life_events_event_date ON life_events(event_date);
CREATE INDEX idx_life_events_status ON life_events(status);
CREATE INDEX idx_life_events_user_date ON life_events(user_id, event_date);
```

### 2.5 subsidy_categories（補助金カテゴリ）

```sql
CREATE TABLE subsidy_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    icon            VARCHAR(50),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subsidy_categories_slug ON subsidy_categories(slug);

-- 初期データ
INSERT INTO subsidy_categories (name, slug, description, icon, sort_order) VALUES
('出産・育児', 'childbirth', '出産・育児に関する補助金・給付金', 'baby', 1),
('住宅', 'housing', '住宅購入・リフォームに関する補助金', 'home', 2),
('教育', 'education', '教育・学費に関する補助金・奨学金', 'graduation-cap', 3),
('就労', 'employment', '就労・転職に関する支援金', 'briefcase', 4),
('医療', 'medical', '医療・介護に関する補助金', 'heart-pulse', 5),
('その他', 'other', 'その他の補助金・支援制度', 'circle-dot', 99);
```

### 2.6 subsidies（補助金・制度）

```sql
CREATE TABLE subsidies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID NOT NULL REFERENCES subsidy_categories(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    full_description TEXT,
    amount_type     VARCHAR(20) NOT NULL,
    amount_value    INTEGER,  -- 円単位
    amount_max      INTEGER,
    amount_formula  TEXT,  -- 計算式（例: "income * 0.1"）
    prefecture      VARCHAR(50),  -- NULLの場合は全国共通
    municipality    VARCHAR(100),
    eligibility_summary TEXT NOT NULL,
    application_method VARCHAR(20)[] NOT NULL DEFAULT ARRAY['window'],
    application_deadline TEXT,
    processing_time TEXT,
    required_documents JSONB DEFAULT '[]',
    application_url TEXT,
    contact_info    JSONB DEFAULT '{}',
    source_organization VARCHAR(200),
    source_url      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT subsidies_amount_type_check
        CHECK (amount_type IN ('fixed', 'variable', 'formula', 'range'))
);

CREATE INDEX idx_subsidies_category_id ON subsidies(category_id);
CREATE INDEX idx_subsidies_prefecture ON subsidies(prefecture);
CREATE INDEX idx_subsidies_is_active ON subsidies(is_active);
CREATE INDEX idx_subsidies_name_search ON subsidies USING gin(to_tsvector('japanese', name));
CREATE INDEX idx_subsidies_description_search ON subsidies USING gin(to_tsvector('japanese', description));
```

### 2.7 subsidy_conditions（補助金条件）

```sql
CREATE TABLE subsidy_conditions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subsidy_id      UUID NOT NULL REFERENCES subsidies(id) ON DELETE CASCADE,
    condition_text  TEXT NOT NULL,
    condition_type  VARCHAR(50),  -- income, age, residence, family, etc.
    condition_value JSONB,  -- 構造化された条件値
    is_required     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subsidy_conditions_subsidy_id ON subsidy_conditions(subsidy_id);
```

### 2.8 event_subsidies（イベント-補助金関連）

```sql
CREATE TABLE event_subsidies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES life_events(id) ON DELETE CASCADE,
    subsidy_id      UUID NOT NULL REFERENCES subsidies(id) ON DELETE CASCADE,
    is_applied      BOOLEAN NOT NULL DEFAULT FALSE,
    applied_at      TIMESTAMPTZ,
    application_status VARCHAR(20) DEFAULT 'not_started',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT event_subsidies_unique UNIQUE (event_id, subsidy_id),
    CONSTRAINT event_subsidies_status_check
        CHECK (application_status IN ('not_started', 'in_progress', 'submitted',
                                       'approved', 'rejected', 'received'))
);

CREATE INDEX idx_event_subsidies_event_id ON event_subsidies(event_id);
CREATE INDEX idx_event_subsidies_subsidy_id ON event_subsidies(subsidy_id);
```

### 2.9 simulations（シミュレーション）

```sql
CREATE TABLE simulations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    target_years    SMALLINT NOT NULL DEFAULT 10,
    base_assumptions JSONB NOT NULL DEFAULT '{}',
    custom_parameters JSONB DEFAULT '{}',
    results         JSONB,  -- 3シナリオの結果
    insights        JSONB DEFAULT '[]',  -- AIが生成したインサイト
    applicable_subsidies JSONB DEFAULT '[]',
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,

    CONSTRAINT simulations_status_check
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT simulations_target_years_check
        CHECK (target_years BETWEEN 1 AND 50)
);

CREATE INDEX idx_simulations_user_id ON simulations(user_id);
CREATE INDEX idx_simulations_status ON simulations(status);
CREATE INDEX idx_simulations_created_at ON simulations(created_at DESC);
```

### 2.10 simulation_events（シミュレーション-イベント関連）

```sql
CREATE TABLE simulation_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES life_events(id) ON DELETE CASCADE,
    include         BOOLEAN NOT NULL DEFAULT TRUE,
    custom_data     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT simulation_events_unique UNIQUE (simulation_id, event_id)
);

CREATE INDEX idx_simulation_events_simulation_id ON simulation_events(simulation_id);
```

### 2.11 notifications（通知）

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    priority        VARCHAR(10) NOT NULL DEFAULT 'normal',
    action_type     VARCHAR(20),
    action_url      TEXT,
    action_label    VARCHAR(100),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ,

    CONSTRAINT notifications_category_check
        CHECK (category IN ('subsidy', 'law_change', 'tips', 'system', 'reminder')),
    CONSTRAINT notifications_priority_check
        CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read)
    WHERE is_read = FALSE;
```

### 2.12 oauth_accounts（OAuth連携）

```sql
CREATE TABLE oauth_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    access_token    TEXT,
    refresh_token   TEXT,
    token_type      VARCHAR(50),
    scope           TEXT,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT oauth_accounts_unique UNIQUE (provider, provider_account_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider, provider_account_id);
```

### 2.13 refresh_tokens（リフレッシュトークン）

```sql
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    device_info     JSONB DEFAULT '{}',
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ,

    CONSTRAINT refresh_tokens_valid CHECK (
        revoked_at IS NULL OR revoked_at <= NOW()
    )
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### 2.14 external_data（外部データキャッシュ）

```sql
CREATE TABLE external_data (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          VARCHAR(50) NOT NULL,
    data_type       VARCHAR(100) NOT NULL,
    data_key        VARCHAR(255) NOT NULL,
    data            JSONB NOT NULL,
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT external_data_unique UNIQUE (source, data_type, data_key)
);

CREATE INDEX idx_external_data_source ON external_data(source);
CREATE INDEX idx_external_data_expires ON external_data(expires_at);
CREATE INDEX idx_external_data_lookup ON external_data(source, data_type, data_key);
```

### 2.15 audit_logs（監査ログ）

```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     UUID,
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- パーティショニング（月次）
-- 本番環境では以下のようにパーティショニングを検討
-- CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 3. マイグレーション

### 3.1 Alembic設定

```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.db.base import Base
from app.core.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()
```

### 3.2 初期マイグレーション生成

```bash
# マイグレーション生成
alembic revision --autogenerate -m "initial_schema"

# マイグレーション実行
alembic upgrade head

# ロールバック
alembic downgrade -1
```

## 4. インデックス戦略

### 4.1 パフォーマンス最適化インデックス

```sql
-- 複合インデックス（よく使われるクエリ用）
CREATE INDEX idx_life_events_user_category_date
    ON life_events(user_id, category, event_date);

CREATE INDEX idx_subsidies_active_prefecture
    ON subsidies(is_active, prefecture)
    WHERE is_active = TRUE;

CREATE INDEX idx_notifications_user_unread_category
    ON notifications(user_id, category, created_at DESC)
    WHERE is_read = FALSE;

-- 部分インデックス
CREATE INDEX idx_simulations_pending
    ON simulations(user_id, created_at)
    WHERE status = 'processing';

-- GINインデックス（JSONB検索用）
CREATE INDEX idx_life_events_metadata
    ON life_events USING gin(metadata);

CREATE INDEX idx_subsidies_required_documents
    ON subsidies USING gin(required_documents);
```

## 5. データ保持ポリシー

| テーブル | 保持期間 | アーカイブ方法 |
|---------|----------|---------------|
| users | 退会後5年 | コールドストレージ |
| life_events | 無期限 | - |
| simulations | 3年 | S3へアーカイブ |
| notifications | 1年 | 削除 |
| audit_logs | 7年 | S3へアーカイブ |
| external_data | TTLに従う | 自動削除 |
| refresh_tokens | 失効後30日 | 削除 |

---
**作成日**: 2024-XX-XX
**バージョン**: 1.0
**作成者**: CTO (Chief Technology Officer)
