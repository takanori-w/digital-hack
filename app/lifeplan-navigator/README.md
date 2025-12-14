# LifePlan Navigator

**あなたの人生をナビゲートする** - ライフプラン管理アプリケーション

日本の補助金、税制優遇、各種制度をあなたのライフステージに合わせてご案内する次世代ライフプラン管理アプリです。

## 特徴

### Zoo テーマ
アプリ全体で動物キャラクターがあなたをサポート！10種類の動物から選んで、あなただけのパートナーと一緒にライフプランを立てましょう。

- ライオン - リーダーシップ
- フクロウ - 知恵・学び
- リス - 貯蓄・計画性
- ペンギン - 家族・協力
- キツネ - 適応力・知恵
- コアラ - 安定・リラックス
- ウサギ - 成長・繁栄
- イヌ - 忠誠・信頼
- ネコ - 独立・自由
- カメ - 安定・長寿

### 8ステップ オンボーディング
ユーザー情報を段階的に収集し、最適な情報をお届け：
1. 基本情報（名前、生年月日、性別）
2. 連絡先（メールアドレス）
3. 家族構成（婚姻状況、子供の有無）
4. お仕事（職業、年収）
5. お住まい（都道府県、住居形態 - 賃貸/持ち家/実家/社宅/その他）
6. 今後の予定（副業開始、転職、住宅購入、相続、結婚、出産など）
7. 目標設定
8. アニマルパートナー選択

### ダッシュボード機能
- 潜在的な節約額の表示
- やることリスト（ネクストアクション）
- ライフステージに応じたおすすめ制度
- 同年収帯との統計比較
- 資産シミュレーション

### 通知機能
- 法改正のお知らせ
- 補助金・制度の締め切りリマインド
- アクションリマインダー

## 技術スタック

- **フレームワーク**: Next.js 14.2.0 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **グラフ描画**: Recharts
- **アイコン**: Lucide React

## ローカル環境での起動方法

### 前提条件
- Node.js 18.0.0 以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/takanori-w/digital-hack.git
cd digital-hack/app/lifeplan-navigator

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### アクセス

ブラウザで http://localhost:3000 を開きます。

### ビルド

```bash
# プロダクションビルド
npm run build

# ビルドしたアプリを起動
npm start
```

## ディレクトリ構成

```
app/lifeplan-navigator/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes
│   │   │   ├── auth/       # 認証API
│   │   │   ├── benefits/   # 補助金検索API
│   │   │   ├── email/      # メール送信API
│   │   │   ├── settings/   # 設定API
│   │   │   └── user/       # ユーザーAPI
│   │   ├── benefits/       # 補助金一覧ページ
│   │   ├── login/          # ログインページ
│   │   ├── onboarding/     # オンボーディングページ
│   │   ├── register/       # 登録ページ
│   │   ├── settings/       # 設定ページ
│   │   ├── layout.tsx      # ルートレイアウト
│   │   └── page.tsx        # トップページ
│   ├── components/          # Reactコンポーネント
│   │   ├── AnimalIcons.tsx # 動物アイコン（SVG）
│   │   ├── BenefitCard.tsx # 補助金カード
│   │   ├── Dashboard.tsx   # ダッシュボード
│   │   ├── LandingPage.tsx # ランディングページ
│   │   ├── NextActionList.tsx
│   │   ├── NotificationPanel.tsx
│   │   ├── Onboarding.tsx  # オンボーディング
│   │   ├── SimulationChart.tsx
│   │   └── StatisticsComparison.tsx
│   ├── data/               # モックデータ
│   ├── lib/                # ユーティリティ
│   │   ├── simulation.ts   # シミュレーション計算
│   │   └── store.ts        # Zustand ストア
│   └── types/              # TypeScript 型定義
│       └── index.ts
├── public/                  # 静的ファイル
├── data/                    # データファイル
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 主要な型定義

```typescript
// 動物タイプ
type AnimalType = 'lion' | 'owl' | 'squirrel' | 'penguin' | 'fox' |
                  'koala' | 'rabbit' | 'dog' | 'cat' | 'turtle';

// 今後の予定
type FuturePlan = 'side_job' | 'job_change' | 'housing_purchase' |
                  'inheritance' | 'marriage' | 'childbirth' |
                  'child_education' | 'retirement' | 'startup' |
                  'investment' | 'none';

// 住居タイプ
type HousingType = 'rent' | 'own' | 'with_parents' | 'company_housing' | 'other';

// ユーザープロファイル
interface UserProfile {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  prefecture: string;
  city: string;
  occupation: string;
  annualIncome: number;
  householdSize: number;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  hasChildren: boolean;
  numberOfChildren: number;
  childrenAges: number[];
  housingType: HousingType;
  futurePlans: FuturePlan[];
  favoriteAnimal: AnimalType;
  createdAt: string;
  updatedAt: string;
}
```

## 今後の拡張予定

- [ ] e-Gov法令API連携（法令MCP）
- [ ] プッシュ通知対応
- [ ] PWA対応
- [ ] 多言語対応

## ライセンス

MIT License

## 開発チーム

Organization Unicorn Team - Global Security Governance System

---

Built with Next.js and Tailwind CSS
