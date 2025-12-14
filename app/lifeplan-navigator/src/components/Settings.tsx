'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Save,
  RefreshCw,
  Compass,
  Check,
  AlertCircle,
  Send,
  Key,
  Eye,
  EyeOff,
  Users,
  Briefcase,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  Wallet,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Stethoscope,
  Target,
  Rocket,
  Heart,
  Building,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { validateEmail, validateName } from '@/lib/validation';
import { UserProfile, EmailSettings, NotificationSettings, AppSettings, FuturePlan, AnimalType, HousingType } from '@/types';
import { AnimalIcons, animalDescriptions } from './AnimalIcons';

interface SettingsProps {
  onLogout: () => void;
  onResetOnboarding: () => void;
}

type SettingsTab = 'profile' | 'email' | 'notifications' | 'account';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const OCCUPATIONS = [
  '会社員（正社員）',
  '会社員（契約社員）',
  '公務員',
  '自営業・フリーランス',
  '会社役員・経営者',
  'パート・アルバイト',
  '専業主婦・主夫',
  '学生',
  '無職・求職中',
  'その他',
];

const FUTURE_PLANS: { value: FuturePlan; label: string }[] = [
  { value: 'marriage', label: '結婚' },
  { value: 'childbirth', label: '出産' },
  { value: 'housing_purchase', label: '住宅購入' },
  { value: 'job_change', label: '転職' },
  { value: 'startup', label: '起業' },
  { value: 'side_job', label: '副業開始' },
  { value: 'child_education', label: '子どもの教育' },
  { value: 'retirement', label: '退職' },
  { value: 'inheritance', label: '相続' },
  { value: 'investment', label: '投資開始' },
];

const GOAL_OPTIONS = [
  { value: 'savings', label: '貯蓄を増やす' },
  { value: 'investment', label: '投資を始める・増やす' },
  { value: 'tax_saving', label: '節税対策' },
  { value: 'insurance', label: '保険の見直し' },
  { value: 'housing', label: '住宅の購入・ローン' },
  { value: 'education', label: '教育資金の準備' },
  { value: 'retirement', label: '老後の資金準備' },
  { value: 'subsidy', label: '補助金・給付金の活用' },
];

const ANIMAL_OPTIONS: AnimalType[] = ['penguin', 'cat', 'dog', 'owl', 'rabbit', 'koala'];

export default function Settings({ onLogout, onResetOnboarding }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [serverSettings, setServerSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setServerSettings(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: User },
    { id: 'email', label: 'メール設定', icon: Send },
    { id: 'notifications', label: '通知設定', icon: Bell },
    { id: 'account', label: 'アカウント', icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">設定</h1>
            </div>
            <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
              ダッシュボードへ
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <nav className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <ProfileSettings
                serverSettings={serverSettings}
                onSettingsUpdate={loadSettings}
              />
            )}
            {activeTab === 'email' && (
              <EmailSettingsPanel
                serverSettings={serverSettings}
                onSettingsUpdate={loadSettings}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettingsPanel
                serverSettings={serverSettings}
                onSettingsUpdate={loadSettings}
              />
            )}
            {activeTab === 'account' && (
              <AccountSettings
                onLogout={onLogout}
                onResetOnboarding={onResetOnboarding}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileSettings({
  serverSettings,
  onSettingsUpdate,
}: {
  serverSettings: AppSettings | null;
  onSettingsUpdate: () => void;
}) {
  const { user: storeUser, updateUser } = useAppStore();
  const user = serverSettings?.user || storeUser;

  // Parse birthDate into components
  const parseBirthDate = (birthDate?: string) => {
    if (!birthDate) return { year: 1990, month: 1, day: 1 };
    const date = new Date(birthDate);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  };

  const birthDateParts = parseBirthDate(user?.birthDate);

  const [formData, setFormData] = useState({
    // 基本情報
    name: user?.name || '',
    email: user?.email || '',
    birthYear: birthDateParts.year,
    birthMonth: birthDateParts.month,
    birthDay: birthDateParts.day,
    gender: user?.gender || 'male' as 'male' | 'female' | 'other',
    // 住所
    prefecture: user?.prefecture || '東京都',
    city: user?.city || '',
    // 職業・収入
    occupation: user?.occupation || '',
    annualIncome: user?.annualIncome || 4000000,
    // 家族構成
    maritalStatus: user?.maritalStatus || 'single',
    hasChildren: user?.hasChildren || false,
    numberOfChildren: user?.numberOfChildren || 0,
    childrenAges: user?.childrenAges || [] as number[],
    // 住居
    housingType: user?.housingType || 'rent',
    // 資産・家計
    monthlyHousingCost: user?.financialInfo?.monthlyHousingCost || 80000,
    currentSavings: user?.financialInfo?.currentSavings || 1000000,
    monthlySavingsAmount: user?.financialInfo?.monthlySavingsAmount || 30000,
    investmentAssets: user?.financialInfo?.investmentAssets || 0,
    hasLifeInsurance: user?.financialInfo?.hasLifeInsurance || false,
    hasHealthInsurance: user?.financialInfo?.hasHealthInsurance || false,
    hasPensionInsurance: user?.financialInfo?.hasPensionInsurance || false,
    hasIdeco: user?.financialInfo?.hasIdeco || false,
    hasNisa: user?.financialInfo?.hasNisa || false,
    annualMedicalExpenses: user?.financialInfo?.annualMedicalExpenses || 50000,
    // 今後の予定・目標
    futurePlans: user?.futurePlans || [] as FuturePlan[],
    goals: user?.goals || [] as string[],
    // お気に入りアニマル
    favoriteAnimal: user?.favoriteAnimal || 'penguin' as AnimalType,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('basic');

  useEffect(() => {
    if (user) {
      const birthParts = parseBirthDate(user.birthDate);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        birthYear: birthParts.year,
        birthMonth: birthParts.month,
        birthDay: birthParts.day,
        gender: user.gender || 'male',
        prefecture: user.prefecture || '東京都',
        city: user.city || '',
        occupation: user.occupation || '',
        annualIncome: user.annualIncome || 4000000,
        maritalStatus: user.maritalStatus || 'single',
        hasChildren: user.hasChildren || false,
        numberOfChildren: user.numberOfChildren || 0,
        childrenAges: user.childrenAges || [],
        housingType: user.housingType || 'rent',
        monthlyHousingCost: user.financialInfo?.monthlyHousingCost || 80000,
        currentSavings: user.financialInfo?.currentSavings || 1000000,
        monthlySavingsAmount: user.financialInfo?.monthlySavingsAmount || 30000,
        investmentAssets: user.financialInfo?.investmentAssets || 0,
        hasLifeInsurance: user.financialInfo?.hasLifeInsurance || false,
        hasHealthInsurance: user.financialInfo?.hasHealthInsurance || false,
        hasPensionInsurance: user.financialInfo?.hasPensionInsurance || false,
        hasIdeco: user.financialInfo?.hasIdeco || false,
        hasNisa: user.financialInfo?.hasNisa || false,
        annualMedicalExpenses: user.financialInfo?.annualMedicalExpenses || 50000,
        futurePlans: user.futurePlans || [],
        goals: user.goals || [],
        favoriteAnimal: user.favoriteAnimal || 'penguin',
      });
    }
  }, [user]);

  const handleSave = async () => {
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      setMessage({ type: 'error', text: nameValidation.error! });
      return;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setMessage({ type: 'error', text: emailValidation.error! });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // Construct birthDate from components
      const birthDate = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;

      const updatedUser: UserProfile = {
        ...user!,
        name: formData.name,
        email: formData.email,
        birthDate,
        gender: formData.gender,
        prefecture: formData.prefecture,
        city: formData.city,
        occupation: formData.occupation,
        annualIncome: formData.annualIncome,
        maritalStatus: formData.maritalStatus,
        hasChildren: formData.hasChildren,
        numberOfChildren: formData.numberOfChildren,
        childrenAges: formData.childrenAges,
        housingType: formData.housingType,
        futurePlans: formData.futurePlans,
        goals: formData.goals,
        favoriteAnimal: formData.favoriteAnimal,
        financialInfo: {
          monthlyHousingCost: formData.monthlyHousingCost,
          currentSavings: formData.currentSavings,
          monthlySavingsAmount: formData.monthlySavingsAmount,
          investmentAssets: formData.investmentAssets,
          hasLifeInsurance: formData.hasLifeInsurance,
          hasHealthInsurance: formData.hasHealthInsurance,
          hasPensionInsurance: formData.hasPensionInsurance,
          hasIdeco: formData.hasIdeco,
          hasNisa: formData.hasNisa,
          annualMedicalExpenses: formData.annualMedicalExpenses,
        },
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'user', data: updatedUser }),
      });

      if (res.ok) {
        updateUser(updatedUser);
        setMessage({ type: 'success', text: 'プロフィールを更新しました' });
        onSettingsUpdate();
      } else {
        throw new Error('Save failed');
      }
    } catch {
      setMessage({ type: 'error', text: '更新に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions for child age management
  const updateChildAge = (index: number, age: number) => {
    const newAges = [...formData.childrenAges];
    newAges[index] = age;
    setFormData({ ...formData, childrenAges: newAges });
  };

  // Toggle future plan
  const toggleFuturePlan = (plan: FuturePlan) => {
    const current = formData.futurePlans;
    if (current.includes(plan)) {
      setFormData({ ...formData, futurePlans: current.filter(p => p !== plan) });
    } else {
      setFormData({ ...formData, futurePlans: [...current, plan] });
    }
  };

  // Toggle goal
  const toggleGoal = (goal: string) => {
    const current = formData.goals;
    if (current.includes(goal)) {
      setFormData({ ...formData, goals: current.filter(g => g !== goal) });
    } else {
      setFormData({ ...formData, goals: [...current, goal] });
    }
  };

  // Section navigation
  const sections = [
    { id: 'basic', label: '基本情報', icon: User },
    { id: 'location', label: '住所・住居', icon: MapPin },
    { id: 'work', label: '職業・収入', icon: Briefcase },
    { id: 'family', label: '家族構成', icon: Users },
    { id: 'finance', label: '資産・家計', icon: Wallet },
    { id: 'plans', label: '今後の予定', icon: Rocket },
    { id: 'goals', label: '目標', icon: Target },
    { id: 'animal', label: 'アニマル', icon: Heart },
  ];

  const formatIncome = (income: number) => {
    if (income >= 10000000) {
      return `${(income / 10000000).toFixed(1)}千万円`;
    }
    return `${(income / 10000).toFixed(0)}万円`;
  };

  const formatMoney = (amount: number) => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(1)}千万円`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}万円`;
    }
    return `${amount.toLocaleString()}円`;
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">プロフィール編集</h2>
        <p className="text-sm text-gray-600 mt-1">オンボーディングで設定した情報を編集できます</p>
      </div>

      {/* Section Navigation */}
      <div className="border-b overflow-x-auto">
        <div className="flex min-w-max">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* 基本情報セクション */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline w-4 h-4 mr-1" />
                  お名前
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline w-4 h-4 mr-1" />
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* 生年月日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                生年月日
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.birthYear}
                  onChange={(e) => setFormData({ ...formData, birthYear: parseInt(e.target.value) })}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
                <select
                  value={formData.birthMonth}
                  onChange={(e) => setFormData({ ...formData, birthMonth: parseInt(e.target.value) })}
                  className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>{month}月</option>
                  ))}
                </select>
                <select
                  value={formData.birthDay}
                  onChange={(e) => setFormData({ ...formData, birthDay: parseInt(e.target.value) })}
                  className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}日</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 性別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
              <div className="flex gap-4">
                {[
                  { value: 'male', label: '男性' },
                  { value: 'female', label: '女性' },
                  { value: 'other', label: 'その他' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={formData.gender === option.value}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 住所・住居セクション */}
        {activeSection === 'location' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  都道府県
                </label>
                <select
                  value={formData.prefecture}
                  onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {PREFECTURES.map((pref) => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">市区町村</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="港区"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="inline w-4 h-4 mr-1" />
                住居形態
              </label>
              <select
                value={formData.housingType}
                onChange={(e) => setFormData({ ...formData, housingType: e.target.value as HousingType })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="rent">賃貸</option>
                <option value="own">持ち家</option>
                <option value="with_parents">実家</option>
              </select>
            </div>
          </div>
        )}

        {/* 職業・収入セクション */}
        {activeSection === 'work' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Briefcase className="inline w-4 h-4 mr-1" />
                ご職業
              </label>
              <select
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {OCCUPATIONS.map((occ) => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="inline w-4 h-4 mr-1" />
                年収（税込）: {formatIncome(formData.annualIncome)}
              </label>
              <input
                type="range"
                min="0"
                max="30000000"
                step="500000"
                value={formData.annualIncome}
                onChange={(e) => setFormData({ ...formData, annualIncome: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0円</span>
                <span>3,000万円</span>
              </div>
            </div>
          </div>
        )}

        {/* 家族構成セクション */}
        {activeSection === 'family' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="inline w-4 h-4 mr-1" />
                婚姻状況
              </label>
              <select
                value={formData.maritalStatus}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as UserProfile['maritalStatus'] })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="single">独身</option>
                <option value="married">既婚</option>
                <option value="divorced">離別</option>
                <option value="widowed">死別</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasChildren}
                  onChange={(e) => {
                    const hasChildren = e.target.checked;
                    setFormData({
                      ...formData,
                      hasChildren,
                      numberOfChildren: hasChildren ? Math.max(1, formData.numberOfChildren) : 0,
                      childrenAges: hasChildren ? (formData.childrenAges.length > 0 ? formData.childrenAges : [0]) : [],
                    });
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">お子様がいる</span>
              </label>

              {formData.hasChildren && (
                <div className="space-y-4 pl-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">人数:</span>
                    <select
                      value={formData.numberOfChildren}
                      onChange={(e) => {
                        const num = parseInt(e.target.value);
                        const newAges = [...formData.childrenAges];
                        while (newAges.length < num) newAges.push(0);
                        while (newAges.length > num) newAges.pop();
                        setFormData({ ...formData, numberOfChildren: num, childrenAges: newAges });
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}人</option>
                      ))}
                    </select>
                  </div>

                  {formData.numberOfChildren > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">お子様の年齢</label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: formData.numberOfChildren }).map((_, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">{i + 1}人目:</span>
                            <select
                              value={formData.childrenAges[i] || 0}
                              onChange={(e) => updateChildAge(i, parseInt(e.target.value))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              {Array.from({ length: 25 }).map((_, age) => (
                                <option key={age} value={age}>{age}歳</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 資産・家計セクション */}
        {activeSection === 'finance' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home className="inline w-4 h-4 mr-1" />
                月々の住居費: {formatMoney(formData.monthlyHousingCost)}
              </label>
              <input
                type="range"
                min="0"
                max="300000"
                step="5000"
                value={formData.monthlyHousingCost}
                onChange={(e) => setFormData({ ...formData, monthlyHousingCost: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0円</span>
                <span>30万円</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <PiggyBank className="inline w-4 h-4 mr-1" />
                現在の貯蓄額: {formatMoney(formData.currentSavings)}
              </label>
              <input
                type="range"
                min="0"
                max="50000000"
                step="500000"
                value={formData.currentSavings}
                onChange={(e) => setFormData({ ...formData, currentSavings: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0円</span>
                <span>5,000万円</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Wallet className="inline w-4 h-4 mr-1" />
                月々の貯蓄額: {formatMoney(formData.monthlySavingsAmount)}
              </label>
              <input
                type="range"
                min="0"
                max="500000"
                step="10000"
                value={formData.monthlySavingsAmount}
                onChange={(e) => setFormData({ ...formData, monthlySavingsAmount: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0円</span>
                <span>50万円</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TrendingUp className="inline w-4 h-4 mr-1" />
                投資資産: {formatMoney(formData.investmentAssets)}
              </label>
              <input
                type="range"
                min="0"
                max="50000000"
                step="500000"
                value={formData.investmentAssets}
                onChange={(e) => setFormData({ ...formData, investmentAssets: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0円</span>
                <span>5,000万円</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline w-4 h-4 mr-1" />
                加入している保険
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'hasLifeInsurance', label: '生命保険' },
                  { key: 'hasHealthInsurance', label: '医療保険' },
                  { key: 'hasPensionInsurance', label: '個人年金保険' },
                ].map((insurance) => (
                  <label key={insurance.key} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData[insurance.key as keyof typeof formData] as boolean}
                      onChange={(e) => setFormData({ ...formData, [insurance.key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{insurance.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="inline w-4 h-4 mr-1" />
                利用中の税制優遇制度
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'hasIdeco', label: 'iDeCo（個人型確定拠出年金）' },
                  { key: 'hasNisa', label: 'NISA（少額投資非課税制度）' },
                ].map((program) => (
                  <label key={program.key} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData[program.key as keyof typeof formData] as boolean}
                      onChange={(e) => setFormData({ ...formData, [program.key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{program.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Stethoscope className="inline w-4 h-4 mr-1" />
                年間の医療費（概算）: {formatMoney(formData.annualMedicalExpenses)}
              </label>
              <input
                type="range"
                min="0"
                max="500000"
                step="10000"
                value={formData.annualMedicalExpenses}
                onChange={(e) => setFormData({ ...formData, annualMedicalExpenses: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0円</span>
                <span>50万円</span>
              </div>
            </div>
          </div>
        )}

        {/* 今後の予定セクション */}
        {activeSection === 'plans' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">今後5年以内に予定しているライフイベントを選択してください（複数選択可）</p>
            <div className="grid grid-cols-2 gap-3">
              {FUTURE_PLANS.map((plan) => (
                <label
                  key={plan.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.futurePlans.includes(plan.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.futurePlans.includes(plan.value)}
                    onChange={() => toggleFuturePlan(plan.value)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{plan.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 目標セクション */}
        {activeSection === 'goals' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">関心のある目標を選択してください（複数選択可）</p>
            <div className="grid grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((goal) => (
                <label
                  key={goal.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.goals.includes(goal.value)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.goals.includes(goal.value)}
                    onChange={() => toggleGoal(goal.value)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{goal.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* アニマルセクション */}
        {activeSection === 'animal' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">あなたを表すアニマルを選択してください</p>
            <div className="grid grid-cols-3 gap-4">
              {ANIMAL_OPTIONS.map((animal) => {
                const AnimalIcon = AnimalIcons[animal];
                return (
                  <button
                    key={animal}
                    type="button"
                    onClick={() => setFormData({ ...formData, favoriteAnimal: animal })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      formData.favoriteAnimal === animal
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <AnimalIcon className={`w-12 h-12 ${
                      formData.favoriteAnimal === animal ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.favoriteAnimal === animal ? 'text-purple-700' : 'text-gray-600'
                    }`}>
                      {animalDescriptions[animal].name}
                    </span>
                  </button>
                );
              })}
            </div>
            {formData.favoriteAnimal && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  <strong>{animalDescriptions[formData.favoriteAnimal].name}:</strong>{' '}
                  {animalDescriptions[formData.favoriteAnimal].trait}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              保存する
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function EmailSettingsPanel({
  serverSettings,
  onSettingsUpdate,
}: {
  serverSettings: AppSettings | null;
  onSettingsUpdate: () => void;
}) {
  const emailSettings = serverSettings?.email;

  const [formData, setFormData] = useState({
    provider: emailSettings?.provider || 'none',
    apiKey: emailSettings?.apiKey || '',
    fromEmail: emailSettings?.fromEmail || '',
    fromName: emailSettings?.fromName || 'LifePlan Navigator',
    enabled: emailSettings?.enabled || false,
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (emailSettings) {
      setFormData({
        provider: emailSettings.provider || 'none',
        apiKey: emailSettings.apiKey || '',
        fromEmail: emailSettings.fromEmail || '',
        fromName: emailSettings.fromName || 'LifePlan Navigator',
        enabled: emailSettings.enabled || false,
      });
    }
  }, [emailSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'email', data: formData }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'メール設定を保存しました' });
        onSettingsUpdate();
      } else {
        throw new Error('Save failed');
      }
    } catch {
      setMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'テスト送信先メールアドレスを入力してください' });
      return;
    }

    setIsTesting(true);
    setMessage(null);

    try {
      // まず設定を保存
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'email', data: formData }),
      });

      // テストメール送信
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'テストメールの送信に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'テストメールの送信に失敗しました' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">メール設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          アラートメールを送信するためのメールサービスを設定してください
        </p>
      </div>

      <div className="p-6 space-y-6">
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* メール送信有効化 */}
        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">メール送信を有効にする</p>
              <p className="text-sm text-gray-500">アラートや通知をメールで受け取る</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>

        {/* プロバイダー選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メールサービスプロバイダー
          </label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value as EmailSettings['provider'] })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="none">選択してください</option>
            <option value="sendgrid">SendGrid</option>
            <option value="mailgun">Mailgun</option>
            <option value="ses">Amazon SES</option>
          </select>
        </div>

        {formData.provider !== 'none' && (
          <>
            {/* APIキー */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="inline w-4 h-4 mr-1" />
                APIキー
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={formData.provider === 'ses' ? 'accessKeyId:secretAccessKey:region' : 'APIキーを入力'}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.provider === 'sendgrid' && (
                <p className="mt-1 text-xs text-gray-500">
                  SendGridの設定 &gt; API Keys で取得できます
                </p>
              )}
              {formData.provider === 'mailgun' && (
                <p className="mt-1 text-xs text-gray-500">
                  Mailgunのダッシュボード &gt; API Security で取得できます
                </p>
              )}
              {formData.provider === 'ses' && (
                <p className="mt-1 text-xs text-gray-500">
                  形式: accessKeyId:secretAccessKey:region (例: AKIA...:abc123...:ap-northeast-1)
                </p>
              )}
            </div>

            {/* 送信元情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送信元メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="noreply@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送信元名
                </label>
                <input
                  type="text"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="LifePlan Navigator"
                />
              </div>
            </div>

            {/* テストメール */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">テストメール送信</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="送信先メールアドレス"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={isTesting || !formData.apiKey}
                  className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {isTesting ? 'テスト中...' : 'テスト送信'}
                </button>
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              設定を保存
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function NotificationSettingsPanel({
  serverSettings,
  onSettingsUpdate,
}: {
  serverSettings: AppSettings | null;
  onSettingsUpdate: () => void;
}) {
  const notificationSettings = serverSettings?.notifications;

  const [formData, setFormData] = useState({
    emailNotifications: notificationSettings?.emailNotifications ?? true,
    pushNotifications: notificationSettings?.pushNotifications ?? false,
    lawChangeAlerts: notificationSettings?.lawChangeAlerts ?? true,
    deadlineReminders: notificationSettings?.deadlineReminders ?? true,
    weeklyDigest: notificationSettings?.weeklyDigest ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (notificationSettings) {
      setFormData({
        emailNotifications: notificationSettings.emailNotifications ?? true,
        pushNotifications: notificationSettings.pushNotifications ?? false,
        lawChangeAlerts: notificationSettings.lawChangeAlerts ?? true,
        deadlineReminders: notificationSettings.deadlineReminders ?? true,
        weeklyDigest: notificationSettings.weeklyDigest ?? true,
      });
    }
  }, [notificationSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'notifications', data: formData }),
      });

      if (res.ok) {
        setSaved(true);
        onSettingsUpdate();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save notifications:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">通知設定</h2>
        <p className="text-sm text-gray-600 mt-1">
          お知らせの受け取り方法を設定してください
        </p>
      </div>

      <div className="p-6 space-y-6">
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg">
            <Check className="w-5 h-5" />
            設定を保存しました
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">通知方法</h3>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">メール通知</p>
                <p className="text-sm text-gray-500">重要なお知らせをメールで受け取る</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">プッシュ通知</p>
                <p className="text-sm text-gray-500">ブラウザでプッシュ通知を受け取る</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.pushNotifications}
              onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">通知の種類</h3>

          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">法改正・制度変更のお知らせ</p>
              <p className="text-sm text-gray-500">税制改正や補助金制度の変更情報</p>
            </div>
            <input
              type="checkbox"
              checked={formData.lawChangeAlerts}
              onChange={(e) => setFormData({ ...formData, lawChangeAlerts: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">申請期限のリマインダー</p>
              <p className="text-sm text-gray-500">補助金申請などの期限前に通知</p>
            </div>
            <input
              type="checkbox"
              checked={formData.deadlineReminders}
              onChange={(e) => setFormData({ ...formData, deadlineReminders: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">週間ダイジェスト</p>
              <p className="text-sm text-gray-500">1週間のまとめを毎週メールで受け取る</p>
            </div>
            <input
              type="checkbox"
              checked={formData.weeklyDigest}
              onChange={(e) => setFormData({ ...formData, weeklyDigest: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              設定を保存
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function AccountSettings({
  onLogout,
  onResetOnboarding,
}: {
  onLogout: () => void;
  onResetOnboarding: () => void;
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">アカウント設定</h2>
          <p className="text-sm text-gray-600 mt-1">
            アカウントの管理を行います
          </p>
        </div>

        <div className="p-6 space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">パスワードの変更</p>
                <p className="text-sm text-gray-500">アカウントのパスワードを更新</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">オンボーディングの再設定</p>
                <p className="text-sm text-gray-500">
                  ライフステージ診断をやり直す
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Logout button */}
      <div className="bg-white rounded-lg shadow-sm border">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 p-6 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">ログアウト</span>
        </button>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ログアウトしますか？
            </h3>
            <p className="text-gray-600 mb-6">
              ログアウトすると、再度ログインが必要になります。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset onboarding confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              オンボーディングを再設定しますか？
            </h3>
            <p className="text-gray-600 mb-6">
              現在の設定がリセットされ、ライフステージ診断からやり直します。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetOnboarding();
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                再設定する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
