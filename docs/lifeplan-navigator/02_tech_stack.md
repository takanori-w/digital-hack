# LifePlan Navigator - 技術スタック決定書

## 1. 技術スタック概要

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Frontend | Next.js | 14.x | App Router, RSC対応、優れたSEO |
| Frontend | React | 18.x | Concurrent Features, Suspense |
| Frontend | TypeScript | 5.x | 型安全性、開発効率向上 |
| UI Framework | Tailwind CSS | 3.x | ユーティリティファースト、高速開発 |
| UI Components | shadcn/ui | latest | アクセシブル、カスタマイズ可能 |
| State Management | Zustand | 4.x | 軽量、シンプルなAPI |
| Backend | FastAPI | 0.109+ | 高性能、自動OpenAPI生成 |
| Backend | Python | 3.11+ | 型ヒント、パフォーマンス改善 |
| ORM | SQLAlchemy | 2.x | 非同期対応、成熟したエコシステム |
| Database | PostgreSQL | 15.x | JSONB、高度なインデックス |
| Cache | Redis | 7.x | セッション、キャッシュ、キュー |
| Search | Elasticsearch | 8.x | 全文検索、ファセット検索 |
| Task Queue | Celery | 5.x | 分散タスク処理 |
| Auth | NextAuth.js | 5.x | OAuth統合、セッション管理 |

## 2. フロントエンド詳細

### 2.1 プロジェクト構成

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証関連ページ
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/        # ダッシュボード
│   │   │   ├── dashboard/
│   │   │   ├── life-events/
│   │   │   ├── subsidies/
│   │   │   ├── simulation/
│   │   │   ├── notifications/
│   │   │   └── layout.tsx
│   │   ├── api/                # API Routes
│   │   │   └── auth/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── forms/              # フォームコンポーネント
│   │   ├── charts/             # グラフコンポーネント
│   │   └── layouts/            # レイアウトコンポーネント
│   ├── hooks/                  # カスタムフック
│   ├── lib/                    # ユーティリティ
│   │   ├── api-client.ts       # APIクライアント
│   │   ├── auth.ts             # 認証ヘルパー
│   │   └── utils.ts
│   ├── stores/                 # Zustand stores
│   │   ├── user-store.ts
│   │   ├── life-event-store.ts
│   │   └── notification-store.ts
│   └── types/                  # TypeScript型定義
├── public/
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

### 2.2 主要ライブラリ

```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-auth": "^5.0.0-beta",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.17.0",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "recharts": "^2.10.4",
    "date-fns": "^3.2.0",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "@types/react": "^18.2.48",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2"
  }
}
```

## 3. バックエンド詳細

### 3.1 プロジェクト構成

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── life_events.py
│   │   │   │   ├── subsidies.py
│   │   │   │   ├── simulations.py
│   │   │   │   └── notifications.py
│   │   │   └── router.py
│   │   └── deps.py             # 依存性注入
│   ├── core/
│   │   ├── config.py           # 設定管理
│   │   ├── security.py         # 認証・認可
│   │   └── exceptions.py       # 例外定義
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── init_db.py
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py
│   │   ├── life_event.py
│   │   ├── subsidy.py
│   │   ├── simulation.py
│   │   └── notification.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── user.py
│   │   ├── life_event.py
│   │   ├── subsidy.py
│   │   ├── simulation.py
│   │   └── notification.py
│   ├── services/               # ビジネスロジック
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── life_event_service.py
│   │   ├── subsidy_service.py
│   │   ├── simulation_service.py
│   │   ├── notification_service.py
│   │   └── external_api/
│   │       ├── estat_client.py
│   │       ├── kurashimuki_client.py
│   │       └── toyo_keizai_client.py
│   ├── workers/                # Celery tasks
│   │   ├── data_sync.py
│   │   ├── notification.py
│   │   └── simulation.py
│   └── main.py
├── tests/
├── alembic/                    # マイグレーション
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

### 3.2 主要ライブラリ

```txt
# requirements.txt
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.3
pydantic-settings>=2.1.0
sqlalchemy>=2.0.25
asyncpg>=0.29.0
alembic>=1.13.1
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
httpx>=0.26.0
celery>=5.3.6
redis>=5.0.1
elasticsearch>=8.12.0
tenacity>=8.2.3
structlog>=24.1.0
sentry-sdk[fastapi]>=1.39.2
pytest>=7.4.4
pytest-asyncio>=0.23.3
```

## 4. データベース詳細

### 4.1 PostgreSQL設定

```yaml
# PostgreSQL 15 Configuration
postgresql:
  version: "15"
  parameters:
    max_connections: 200
    shared_buffers: 256MB
    effective_cache_size: 768MB
    maintenance_work_mem: 64MB
    checkpoint_completion_target: 0.9
    wal_buffers: 7864kB
    default_statistics_target: 100
    random_page_cost: 1.1
    effective_io_concurrency: 200
    work_mem: 1310kB
    min_wal_size: 1GB
    max_wal_size: 4GB
  extensions:
    - uuid-ossp
    - pg_trgm
    - btree_gin
```

### 4.2 Redis設定

```yaml
# Redis 7 Configuration
redis:
  version: "7"
  maxmemory: 256mb
  maxmemory-policy: allkeys-lru
  databases:
    0: sessions        # セッション管理
    1: cache           # APIキャッシュ
    2: rate_limit      # レート制限
    3: celery_broker   # Celeryブローカー
    4: celery_result   # Celery結果
```

## 5. 外部API連携仕様

### 5.1 e-Stat API (統計ダッシュボード)

```python
# 接続仕様
ESTAT_API_BASE = "https://dashboard.e-stat.go.jp/api/1.0"
ESTAT_APP_ID = os.getenv("ESTAT_APP_ID")

# 主要エンドポイント
endpoints = {
    "population": "/regionRank",      # 人口統計
    "income": "/timeSeries",          # 収入時系列
    "social_security": "/regionRank"  # 社会保障
}

# レート制限: 300 requests/hour
```

### 5.2 都民のくらしむきAPI

```python
# 接続仕様
KURASHIMUKI_BASE = "https://api.kurashimuki.metro.tokyo.lg.jp/v1"

# 主要エンドポイント
endpoints = {
    "living_cost": "/cost",           # 生活費
    "housing": "/housing",            # 住居費
    "price_index": "/price"           # 物価指数
}
```

### 5.3 東洋経済データAPI

```python
# 接続仕様
TOYO_KEIZAI_BASE = "https://api.toyokeizai.net/v1"
TOYO_KEIZAI_KEY = os.getenv("TOYO_KEIZAI_API_KEY")

# 主要エンドポイント
endpoints = {
    "economic_index": "/economy",     # 経済指標
    "region_data": "/region",         # 地域データ
    "industry": "/industry"           # 業界動向
}
```

## 6. 開発環境

### 6.1 Docker Compose構成

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/lifeplan
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app

  worker:
    build: ./backend
    command: celery -A app.workers worker -l info
    depends_on:
      - backend
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=lifeplan
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

volumes:
  postgres_data:
```

## 7. CI/CDパイプライン

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm test

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pytest

  deploy:
    needs: [test-frontend, test-backend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
      - run: # Deploy to ECS
```

---
**作成日**: 2024-XX-XX
**バージョン**: 1.0
**作成者**: CTO (Chief Technology Officer)
