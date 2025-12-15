# LifePlan Navigator - API設計書

## 1. API概要

### 1.1 基本仕様

| 項目 | 値 |
|------|-----|
| Base URL | `https://api.lifeplan-navigator.jp/v1` |
| プロトコル | HTTPS (TLS 1.3) |
| 認証方式 | Bearer Token (JWT) |
| コンテンツタイプ | application/json |
| 文字コード | UTF-8 |
| バージョニング | URL Path (v1, v2...) |

### 1.2 共通レスポンス形式

```json
// 成功レスポンス
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}

// エラーレスポンス
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 1.3 HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | リソース作成成功 |
| 204 | 削除成功（レスポンスボディなし） |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 403 | 認可エラー |
| 404 | リソースなし |
| 422 | バリデーションエラー |
| 429 | レート制限超過 |
| 500 | サーバーエラー |

---

## 2. 認証API

### 2.1 ユーザー登録

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "山田 太郎",
  "birth_date": "1990-01-15",
  "prefecture": "東京都"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "山田 太郎",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
      "expires_in": 900
    }
  }
}
```

### 2.2 ログイン

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "山田 太郎"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
      "expires_in": 900
    }
  }
}
```

### 2.3 トークンリフレッシュ

```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "expires_in": 900
  }
}
```

### 2.4 ログアウト

```
POST /auth/logout
Authorization: Bearer {access_token}
```

**Response (204):** No Content

---

## 3. ユーザーAPI

### 3.1 プロファイル取得

```
GET /users/me
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "山田 太郎",
    "birth_date": "1990-01-15",
    "prefecture": "東京都",
    "profile": {
      "occupation": "会社員",
      "industry": "IT",
      "annual_income": 5000000,
      "household_size": 3,
      "marital_status": "married",
      "has_children": true,
      "children_count": 1
    },
    "notification_settings": {
      "email_enabled": true,
      "push_enabled": true,
      "categories": ["subsidy", "law_change", "tips"]
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:00:00Z"
  }
}
```

### 3.2 プロファイル更新

```
PATCH /users/me
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "山田 太郎",
  "prefecture": "神奈川県",
  "profile": {
    "occupation": "会社員",
    "industry": "IT",
    "annual_income": 6000000,
    "household_size": 4
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "name": "山田 太郎",
    "prefecture": "神奈川県",
    "updated_at": "2024-01-25T09:00:00Z"
  }
}
```

---

## 4. ライフイベントAPI

### 4.1 イベント一覧取得

```
GET /life-events
Authorization: Bearer {access_token}
```

**Query Parameters:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| status | string | No | pending, completed, cancelled |
| category | string | No | marriage, birth, job, housing, education |
| from_date | date | No | 開始日 |
| to_date | date | No | 終了日 |
| page | int | No | ページ番号 (default: 1) |
| limit | int | No | 取得件数 (default: 20, max: 100) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "evt_abc123",
        "category": "birth",
        "title": "第一子出産",
        "description": "長女誕生",
        "event_date": "2024-06-15",
        "status": "pending",
        "related_subsidies": [
          {
            "id": "sub_xyz789",
            "name": "出産育児一時金",
            "amount": 500000
          }
        ],
        "created_at": "2024-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 5,
      "total_pages": 1
    }
  }
}
```

### 4.2 イベント登録

```
POST /life-events
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "category": "marriage",
  "title": "結婚",
  "description": "入籍予定",
  "event_date": "2024-04-01",
  "metadata": {
    "partner_income": 4000000,
    "will_change_job": false
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "evt_def456",
    "category": "marriage",
    "title": "結婚",
    "event_date": "2024-04-01",
    "status": "pending",
    "recommended_actions": [
      {
        "action": "配偶者控除の確認",
        "deadline": "2024-12-31",
        "priority": "high"
      },
      {
        "action": "健康保険の変更届",
        "deadline": "2024-04-15",
        "priority": "medium"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### 4.3 イベント更新

```
PATCH /life-events/{event_id}
Authorization: Bearer {access_token}
```

### 4.4 イベント削除

```
DELETE /life-events/{event_id}
Authorization: Bearer {access_token}
```

---

## 5. 補助金・制度API

### 5.1 補助金検索

```
GET /subsidies
Authorization: Bearer {access_token}
```

**Query Parameters:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| q | string | No | キーワード検索 |
| category | string | No | childbirth, housing, education, employment, medical |
| prefecture | string | No | 都道府県 |
| municipality | string | No | 市区町村 |
| life_event | string | No | 関連ライフイベント |
| eligible_only | boolean | No | 適用可能なもののみ (default: true) |
| page | int | No | ページ番号 |
| limit | int | No | 取得件数 |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "sub_abc123",
        "name": "出産育児一時金",
        "category": "childbirth",
        "description": "健康保険に加入している方が出産したときに支給される一時金",
        "amount": {
          "type": "fixed",
          "value": 500000,
          "unit": "JPY"
        },
        "eligibility": {
          "summary": "健康保険加入者",
          "conditions": [
            "健康保険に加入していること",
            "妊娠4ヶ月（85日）以上で出産すること"
          ]
        },
        "application": {
          "method": "online",
          "deadline": "出産日から2年以内",
          "required_documents": [
            "健康保険証",
            "出産証明書",
            "振込先口座情報"
          ]
        },
        "source": {
          "organization": "全国健康保険協会",
          "url": "https://www.kyoukaikenpo.or.jp/..."
        },
        "user_eligibility": {
          "is_eligible": true,
          "match_score": 95,
          "missing_conditions": []
        },
        "updated_at": "2024-01-10T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 15,
      "total_pages": 1
    },
    "facets": {
      "categories": [
        {"name": "childbirth", "count": 8},
        {"name": "housing", "count": 5},
        {"name": "education", "count": 2}
      ],
      "prefectures": [
        {"name": "東京都", "count": 10},
        {"name": "全国共通", "count": 5}
      ]
    }
  }
}
```

### 5.2 補助金詳細取得

```
GET /subsidies/{subsidy_id}
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "sub_abc123",
    "name": "出産育児一時金",
    "category": "childbirth",
    "description": "健康保険に加入している方が出産したときに支給される一時金",
    "full_description": "出産育児一時金は、健康保険の被保険者またはその被扶養者が...",
    "amount": {
      "type": "fixed",
      "value": 500000,
      "unit": "JPY",
      "notes": "産科医療補償制度加入機関で出産の場合"
    },
    "eligibility": {
      "summary": "健康保険加入者",
      "conditions": [
        {
          "condition": "健康保険に加入していること",
          "required": true
        },
        {
          "condition": "妊娠4ヶ月（85日）以上で出産すること",
          "required": true
        }
      ]
    },
    "application": {
      "method": "online",
      "methods_available": ["online", "mail", "window"],
      "deadline": "出産日から2年以内",
      "processing_time": "約2週間〜1ヶ月",
      "required_documents": [
        {
          "name": "健康保険証",
          "description": "本人確認のため"
        },
        {
          "name": "出産証明書",
          "description": "医療機関発行のもの"
        },
        {
          "name": "振込先口座情報",
          "description": "通帳のコピー等"
        }
      ],
      "application_url": "https://www.kyoukaikenpo.or.jp/...",
      "contact": {
        "organization": "全国健康保険協会",
        "phone": "0570-xxx-xxx",
        "hours": "平日 9:00-17:00"
      }
    },
    "related_subsidies": [
      {
        "id": "sub_def456",
        "name": "出産手当金",
        "relation": "併用可能"
      }
    ],
    "changelog": [
      {
        "date": "2023-04-01",
        "change": "支給額が42万円から50万円に増額"
      }
    ],
    "user_eligibility": {
      "is_eligible": true,
      "match_score": 95,
      "matched_conditions": ["健康保険加入"],
      "missing_conditions": [],
      "estimated_amount": 500000
    }
  }
}
```

### 5.3 おすすめ補助金取得

```
GET /subsidies/recommended
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "sub_abc123",
        "name": "出産育児一時金",
        "category": "childbirth",
        "match_score": 95,
        "reason": "「第一子出産」イベントに基づく推奨",
        "estimated_amount": 500000,
        "deadline": "2026-06-15"
      }
    ]
  }
}
```

---

## 6. シミュレーションAPI

### 6.1 シミュレーション実行

```
POST /simulations
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "出産後のライフプラン",
  "target_years": 10,
  "base_assumptions": {
    "inflation_rate": 2.0,
    "salary_growth_rate": 2.5
  },
  "life_events": [
    {
      "event_id": "evt_abc123",
      "include": true
    }
  ],
  "custom_parameters": {
    "additional_expenses": [
      {
        "name": "保育費",
        "amount": 50000,
        "start_year": 1,
        "end_year": 6
      }
    ]
  }
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "simulation_id": "sim_xyz789",
    "status": "processing",
    "estimated_completion": "2024-01-15T10:31:00Z"
  }
}
```

### 6.2 シミュレーション結果取得

```
GET /simulations/{simulation_id}
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "sim_xyz789",
    "name": "出産後のライフプラン",
    "status": "completed",
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:30:45Z",
    "scenarios": {
      "optimistic": {
        "label": "楽観シナリオ",
        "description": "給与上昇率3.5%、インフレ1.5%を想定",
        "assumptions": {
          "salary_growth_rate": 3.5,
          "inflation_rate": 1.5,
          "investment_return": 5.0
        },
        "yearly_projections": [
          {
            "year": 2024,
            "income": 6000000,
            "expenses": 4800000,
            "savings": 1200000,
            "cumulative_assets": 3200000,
            "subsidies_received": 500000
          },
          {
            "year": 2025,
            "income": 6210000,
            "expenses": 4872000,
            "savings": 1338000,
            "cumulative_assets": 4698000,
            "subsidies_received": 0
          }
        ],
        "summary": {
          "total_income": 72000000,
          "total_expenses": 58000000,
          "total_savings": 14000000,
          "final_assets": 18000000,
          "total_subsidies": 1500000
        }
      },
      "baseline": {
        "label": "基本シナリオ",
        "description": "給与上昇率2.5%、インフレ2.0%を想定",
        "assumptions": {
          "salary_growth_rate": 2.5,
          "inflation_rate": 2.0,
          "investment_return": 3.0
        },
        "yearly_projections": [...],
        "summary": {
          "total_income": 68000000,
          "total_expenses": 60000000,
          "total_savings": 8000000,
          "final_assets": 12000000,
          "total_subsidies": 1500000
        }
      },
      "conservative": {
        "label": "保守シナリオ",
        "description": "給与上昇率1.0%、インフレ3.0%を想定",
        "assumptions": {
          "salary_growth_rate": 1.0,
          "inflation_rate": 3.0,
          "investment_return": 1.0
        },
        "yearly_projections": [...],
        "summary": {
          "total_income": 62000000,
          "total_expenses": 65000000,
          "total_savings": -3000000,
          "final_assets": 2000000,
          "total_subsidies": 1500000
        }
      }
    },
    "insights": [
      {
        "type": "warning",
        "title": "保守シナリオでの収支",
        "message": "保守シナリオでは年間収支がマイナスになる年があります。緊急資金の確保をお勧めします。"
      },
      {
        "type": "opportunity",
        "title": "活用可能な補助金",
        "message": "児童手当を含めると、10年間で約150万円の補助金を受給できます。"
      }
    ],
    "applicable_subsidies": [
      {
        "id": "sub_abc123",
        "name": "出産育児一時金",
        "year": 2024,
        "amount": 500000
      },
      {
        "id": "sub_def456",
        "name": "児童手当",
        "years": "2024-2034",
        "total_amount": 1000000
      }
    ]
  }
}
```

### 6.3 シミュレーション一覧取得

```
GET /simulations
Authorization: Bearer {access_token}
```

### 6.4 シミュレーション削除

```
DELETE /simulations/{simulation_id}
Authorization: Bearer {access_token}
```

---

## 7. 通知API

### 7.1 通知一覧取得

```
GET /notifications
Authorization: Bearer {access_token}
```

**Query Parameters:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| status | string | No | unread, read, all |
| category | string | No | subsidy, law_change, tips, system |
| page | int | No | ページ番号 |
| limit | int | No | 取得件数 |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ntf_abc123",
        "category": "subsidy",
        "title": "新しい補助金があります",
        "message": "お住まいの地域で「子育て支援給付金」の申請が開始されました。",
        "priority": "high",
        "action": {
          "type": "link",
          "url": "/subsidies/sub_xyz789",
          "label": "詳細を見る"
        },
        "is_read": false,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 8,
      "total_pages": 1
    },
    "unread_count": 3
  }
}
```

### 7.2 通知既読更新

```
PATCH /notifications/{notification_id}/read
Authorization: Bearer {access_token}
```

### 7.3 全通知既読

```
POST /notifications/read-all
Authorization: Bearer {access_token}
```

### 7.4 通知設定更新

```
PATCH /users/me/notification-settings
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "email_enabled": true,
  "push_enabled": true,
  "categories": ["subsidy", "law_change"]
}
```

---

## 8. 統計・ダッシュボードAPI

### 8.1 ダッシュボードサマリー取得

```
GET /dashboard/summary
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "upcoming_events": [
      {
        "id": "evt_abc123",
        "title": "第一子出産",
        "event_date": "2024-06-15",
        "days_remaining": 150
      }
    ],
    "available_subsidies": {
      "count": 5,
      "total_potential_amount": 1500000
    },
    "recent_notifications": {
      "unread_count": 3,
      "latest": [...]
    },
    "financial_snapshot": {
      "projected_year_end_savings": 1200000,
      "subsidies_this_year": 500000,
      "next_deadline": {
        "subsidy": "確定申告",
        "date": "2024-03-15"
      }
    }
  }
}
```

---

## 9. レート制限

| エンドポイント | 制限 |
|---------------|------|
| POST /auth/* | 10 requests/minute |
| GET /* | 100 requests/minute |
| POST /simulations | 10 requests/hour |
| その他POST/PATCH/DELETE | 30 requests/minute |

**レート制限ヘッダー:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

---

## 10. Webhook (将来拡張)

```
POST /webhooks
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["subsidy.new", "law.changed"],
  "secret": "your_webhook_secret"
}
```

---
**作成日**: 2024-XX-XX
**バージョン**: 1.0
**作成者**: CTO (Chief Technology Officer)
