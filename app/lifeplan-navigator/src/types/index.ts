// 動物タイプ（Zoo テーマ）
export type AnimalType =
  | 'lion'
  | 'owl'
  | 'squirrel'
  | 'penguin'
  | 'fox'
  | 'koala'
  | 'rabbit'
  | 'dog'
  | 'cat'
  | 'turtle';

// 今後の予定
export type FuturePlan =
  | 'side_job'        // 副業開始
  | 'job_change'      // 転職
  | 'housing_purchase' // 住宅購入
  | 'inheritance'     // 相続
  | 'marriage'        // 結婚
  | 'childbirth'      // 出産
  | 'child_education' // 子供の進学
  | 'retirement'      // 退職
  | 'startup'         // 起業
  | 'investment'      // 投資開始
  | 'none';           // 特になし

// 住居タイプ（社宅追加）
export type HousingType = 'rent' | 'own' | 'with_parents' | 'company_housing' | 'other';

// 財務情報
export interface FinancialInfo {
  currentSavings: number;           // 現在の貯蓄額（円）
  monthlySavingsAmount: number;     // 月々の貯蓄額（円）
  investmentAssets: number;         // 投資資産（円）
  monthlyHousingCost: number;       // 月々の住居費（円）
  hasLifeInsurance: boolean;        // 生命保険加入
  hasHealthInsurance: boolean;      // 医療保険加入
  hasPensionInsurance: boolean;     // 個人年金保険加入
  hasIdeco: boolean;                // iDeCo加入
  hasNisa: boolean;                 // NISA活用
  annualMedicalExpenses: number;    // 年間医療費（円）
}

// ユーザープロファイル
export interface UserProfile {
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
  goals: string[];
  favoriteAnimal: AnimalType;
  // 財務情報
  financialInfo?: FinancialInfo;
  createdAt: string;
  updatedAt: string;
}

// ライフステージ
export type LifeStage =
  | 'student'
  | 'new_graduate'
  | 'working_single'
  | 'engaged'
  | 'newlywed'
  | 'expecting'
  | 'child_rearing'
  | 'child_education'
  | 'empty_nest'
  | 'pre_retirement'
  | 'retired';

export interface LifeStageInfo {
  stage: LifeStage;
  label: string;
  description: string;
  icon: string;
  ageRange: [number, number];
}

// お得情報
export interface BenefitInfo {
  id: string;
  title: string;
  description: string;
  category: 'subsidy' | 'tax' | 'campaign' | 'insurance' | 'investment';
  amount?: number;
  deadline?: string;
  targetLifeStages: LifeStage[];
  targetPrefectures: string[];
  targetIncomeRange?: [number, number];
  applicationUrl?: string;
  source: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

// ネクストアクション
export interface NextAction {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'application' | 'research' | 'decision' | 'appointment';
  relatedBenefitId?: string;
  completed: boolean;
  createdAt: string;
}

// シミュレーション
export interface SimulationParams {
  currentAge: number;
  retirementAge: number;
  currentIncome: number;
  incomeGrowthRate: number;
  currentSavings: number;
  monthlySavingsRate: number;
  investmentReturnRate: number;
  inflationRate: number;
}

export interface SimulationResult {
  year: number;
  age: number;
  income: number;
  expenses: number;
  savings: number;
  investmentValue: number;
  totalAssets: number;
}

export type SimulationScenario = 'conservative' | 'moderate' | 'aggressive';

export interface ScenarioConfig {
  name: string;
  label: string;
  description: string;
  color: string;
  incomeGrowthRate: number;
  investmentReturnRate: number;
  savingsRate: number;
}

// 統計比較
export interface StatisticsComparison {
  category: string;
  userValue: number;
  averageValue: number;
  sameIncomeValue: number;
  percentile: number;
}

// 通知
export interface Notification {
  id: string;
  type: 'law_change' | 'benefit_deadline' | 'action_reminder' | 'news';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// 認証関連
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  agreeToTerms: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  message: string;
}

export interface AuthError {
  error: string;
  field?: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

// オンボーディング
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface OnboardingAnswers {
  // 基本情報（フル）
  name: string;
  email: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: UserProfile['gender'];
  // 住所情報
  prefecture: string;
  city: string;
  // 家族構成
  maritalStatus: UserProfile['maritalStatus'];
  hasChildren: boolean;
  numberOfChildren?: number;
  childrenAges?: number[];
  householdSize: number;
  // 職業・収入
  occupation: string;
  annualIncome: number;
  // 住居
  housingType: HousingType;
  monthlyHousingCost: number;
  // 資産・家計
  currentSavings: number;
  monthlySavingsAmount: number;
  investmentAssets: number;
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  hasPensionInsurance: boolean;
  hasIdeco: boolean;
  hasNisa: boolean;
  annualMedicalExpenses: number;
  // 目標
  goals: string[];
  // 今後の予定（新規追加）
  futurePlans: FuturePlan[];
  // お気に入りの動物（Zoo テーマ）
  favoriteAnimal: AnimalType;
}

// 法律理解度チェック
export interface LawQuizItem {
  id: string;
  lawId: string;
  category: 'tax' | 'labor' | 'social_security' | 'housing' | 'family';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficultyLevel: 1 | 2 | 3;
  impactOnFinance: 'high' | 'medium' | 'low';
  potentialSavings?: number;
}

export interface LawQuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  understanding: 'low' | 'medium' | 'high';
  recommendations: string[];
  answers: { questionId: string; userAnswer: number; isCorrect: boolean }[];
}

// 損得評価
export interface FinancialEvaluation {
  overallScore: number;
  potentialSavings: number;
  missedOpportunities: MissedOpportunity[];
  currentBenefits: CurrentBenefit[];
  status: 'losing' | 'neutral' | 'gaining';
  summary: string;
}

export interface MissedOpportunity {
  id: string;
  name: string;
  description: string;
  potentialBenefit: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionUrl?: string;
  howToApply: string;
}

export interface CurrentBenefit {
  id: string;
  name: string;
  description: string;
  currentBenefit: number;
  category: string;
}

// メール設定
export interface EmailSettings {
  provider: 'sendgrid' | 'mailgun' | 'ses' | 'none';
  apiKey: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

// アプリ設定
export interface AppSettings {
  user: UserProfile | null;
  email: EmailSettings;
  notifications: NotificationSettings;
  onboardingCompleted: boolean;
  updatedAt: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  lawChangeAlerts: boolean;
  deadlineReminders: boolean;
  weeklyDigest: boolean;
}

// セキュリティ設定
export interface SecuritySettings {
  mfaEnabled: boolean;
  mfaMethod: 'totp' | 'sms' | 'email' | null;
  mfaVerified: boolean;
  passkeyEnabled: boolean;
  passkeyRegistered: boolean;
  lastPasswordChange: string | null;
  loginHistory: LoginHistoryEntry[];
  trustedDevices: TrustedDevice[];
}

export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  success: boolean;
}

export interface TrustedDevice {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastUsed: string;
  isCurrent: boolean;
}

// 認証状態
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  securitySettings: SecuritySettings;
}

// 補助金・制度検索
export interface BenefitSearchParams {
  keyword?: string;
  category?: BenefitInfo['category'][];
  prefecture?: string;
  lifeStage?: LifeStage;
  incomeRange?: [number, number];
  sortBy?: 'relevance' | 'deadline' | 'amount';
  page?: number;
  limit?: number;
}

export interface BenefitSearchResult {
  benefits: BenefitInfo[];
  total: number;
  page: number;
  totalPages: number;
}
