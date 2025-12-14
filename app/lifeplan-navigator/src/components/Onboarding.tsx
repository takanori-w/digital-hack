'use client';

import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  Baby,
  Briefcase,
  MapPin,
  Home,
  Target,
  CheckCircle2,
  Compass,
  Mail,
  Calendar,
  Building,
  Rocket,
  Heart,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { LifeStage, OnboardingAnswers, UserProfile, FuturePlan, AnimalType, HousingType } from '@/types';
import { AnimalIcons, animalDescriptions, getRecommendedAnimal } from './AnimalIcons';

interface OnboardingProps {
  onComplete: () => void;
}

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

const GOALS = [
  { id: 'savings', label: '貯金を増やしたい', icon: '💰', animal: '🐿️' },
  { id: 'housing', label: '住宅を購入したい', icon: '🏠', animal: '🐢' },
  { id: 'education', label: '子供の教育資金を準備したい', icon: '📚', animal: '🦉' },
  { id: 'retirement', label: '老後の資金を準備したい', icon: '🏖️', animal: '🐨' },
  { id: 'investment', label: '投資を始めたい', icon: '📈', animal: '🦁' },
  { id: 'benefits', label: '補助金・給付金を活用したい', icon: '🎁', animal: '🦊' },
  { id: 'tax', label: '節税したい', icon: '🧾', animal: '🦉' },
  { id: 'insurance', label: '保険を見直したい', icon: '🛡️', animal: '🐕' },
];

// 今後の予定オプション
const FUTURE_PLANS: { id: FuturePlan; label: string; icon: string }[] = [
  { id: 'side_job', label: '副業を始める', icon: '💼' },
  { id: 'job_change', label: '転職する', icon: '🔄' },
  { id: 'housing_purchase', label: '住宅を購入する', icon: '🏠' },
  { id: 'inheritance', label: '相続の予定がある', icon: '📜' },
  { id: 'marriage', label: '結婚する', icon: '💍' },
  { id: 'childbirth', label: '出産予定がある', icon: '👶' },
  { id: 'child_education', label: '子供の進学がある', icon: '🎓' },
  { id: 'retirement', label: '退職する', icon: '🏖️' },
  { id: 'startup', label: '起業する', icon: '🚀' },
  { id: 'investment', label: '投資を始める', icon: '📈' },
  { id: 'none', label: '特にない', icon: '✨' },
];

const STEPS = [
  { id: 'basic', title: '基本情報', icon: User },
  { id: 'contact', title: '連絡先', icon: Mail },
  { id: 'family', title: '家族構成', icon: Users },
  { id: 'work', title: 'お仕事', icon: Briefcase },
  { id: 'location', title: 'お住まい', icon: MapPin },
  { id: 'future', title: '今後の予定', icon: Rocket },
  { id: 'goals', title: '目標', icon: Target },
  { id: 'animal', title: 'アニマル', icon: Heart },
];

function determineLifeStage(answers: Partial<OnboardingAnswers>): LifeStage {
  const currentYear = new Date().getFullYear();
  const age = answers.birthYear ? currentYear - answers.birthYear : 30;

  if (answers.occupation === '学生') {
    return 'student';
  }

  if (age < 25 && answers.maritalStatus === 'single') {
    return 'new_graduate';
  }

  if (answers.hasChildren && answers.childrenAges) {
    const youngestChild = Math.min(...answers.childrenAges);
    if (youngestChild < 6) {
      return 'child_rearing';
    }
    if (youngestChild < 18) {
      return 'child_education';
    }
    return 'empty_nest';
  }

  if (answers.maritalStatus === 'married' && !answers.hasChildren) {
    return 'newlywed';
  }

  if (age >= 55) {
    return 'pre_retirement';
  }

  if (age >= 65) {
    return 'retired';
  }

  return 'working_single';
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({
    name: '',
    email: '',
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    gender: 'male',
    prefecture: '東京都',
    city: '',
    maritalStatus: 'single',
    hasChildren: false,
    numberOfChildren: 0,
    childrenAges: [],
    householdSize: 1,
    occupation: '',
    annualIncome: 4000000,
    housingType: 'rent',
    goals: [],
    futurePlans: [],
    favoriteAnimal: 'dog',
  });
  const [isSaving, setIsSaving] = useState(false);

  const { setUser, setLifeStage, setOnboardingCompleted } = useAppStore();

  const updateAnswers = (updates: Partial<OnboardingAnswers>) => {
    setAnswers((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);

    try {
      const lifeStage = determineLifeStage(answers);
      setLifeStage(lifeStage);

      // ユーザープロファイルを作成
      const birthDate = `${answers.birthYear}-${String(answers.birthMonth).padStart(2, '0')}-${String(answers.birthDay).padStart(2, '0')}`;
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name: answers.name || '',
        email: answers.email || '',
        birthDate,
        gender: answers.gender || 'male',
        prefecture: answers.prefecture || '東京都',
        city: answers.city || '',
        occupation: answers.occupation || '',
        annualIncome: answers.annualIncome || 0,
        householdSize: answers.householdSize || 1,
        maritalStatus: answers.maritalStatus || 'single',
        hasChildren: answers.hasChildren || false,
        numberOfChildren: answers.numberOfChildren || 0,
        childrenAges: answers.childrenAges || [],
        housingType: (answers.housingType as HousingType) || 'rent',
        futurePlans: answers.futurePlans || [],
        favoriteAnimal: answers.favoriteAnimal || 'dog',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // サーバーに保存
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'user', data: newUser }),
      });

      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'onboarding', data: { completed: true } }),
      });

      // ローカルストアも更新
      setUser(newUser);
      setOnboardingCompleted(true);

      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      // エラーがあってもローカルには保存
      setOnboardingCompleted(true);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Basic info
        return !!(answers.name && answers.birthYear && answers.gender);
      case 1: // Contact
        return !!(answers.email && answers.email.includes('@'));
      case 2: // Family
        return answers.maritalStatus !== undefined && answers.householdSize !== undefined;
      case 3: // Work
        return !!answers.occupation && answers.annualIncome !== undefined;
      case 4: // Location
        return !!answers.prefecture && !!answers.housingType;
      case 5: // Future Plans
        return !!(answers.futurePlans && answers.futurePlans.length > 0);
      case 6: // Goals
        return !!(answers.goals && answers.goals.length > 0);
      case 7: // Animal
        return !!answers.favoriteAnimal;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="py-6 px-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Compass className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">LifePlan Navigator</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                    index < currentStep
                      ? 'bg-blue-600 text-white'
                      : index === currentStep
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          {currentStep === 0 && (
            <StepBasicInfo answers={answers} updateAnswers={updateAnswers} />
          )}
          {currentStep === 1 && (
            <StepContact answers={answers} updateAnswers={updateAnswers} />
          )}
          {currentStep === 2 && (
            <StepFamily answers={answers} updateAnswers={updateAnswers} />
          )}
          {currentStep === 3 && (
            <StepWork answers={answers} updateAnswers={updateAnswers} />
          )}
          {currentStep === 4 && (
            <StepLocation answers={answers} updateAnswers={updateAnswers} />
          )}
          {currentStep === 5 && (
            <StepFuturePlans answers={answers} updateAnswers={updateAnswers} />
          )}
          {currentStep === 6 && (
            <StepGoals answers={answers} updateAnswers={updateAnswers} />
          )}
          {currentStep === 7 && (
            <StepAnimal answers={answers} updateAnswers={updateAnswers} />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 bg-white rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            戻る
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              次へ
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed() || isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '保存中...' : '完了'}
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// Step 1: Basic Information
function StepBasicInfo({
  answers,
  updateAnswers,
}: {
  answers: Partial<OnboardingAnswers>;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 18 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">基本情報を教えてください</h2>
      <p className="text-gray-600 mb-6">
        あなたに最適な情報をお届けするために、いくつかの質問にお答えください。
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            お名前 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={answers.name || ''}
              onChange={(e) => updateAnswers({ name: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="山田 太郎"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            生年月日 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <select
                value={answers.birthYear || 1990}
                onChange={(e) => updateAnswers({ birthYear: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={answers.birthMonth || 1}
                onChange={(e) => updateAnswers({ birthMonth: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={answers.birthDay || 1}
                onChange={(e) => updateAnswers({ birthDay: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}日
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            性別 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'male', label: '男性' },
              { value: 'female', label: '女性' },
              { value: 'other', label: 'その他' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  updateAnswers({
                    gender: option.value as OnboardingAnswers['gender'],
                  })
                }
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  answers.gender === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Contact
function StepContact({
  answers,
  updateAnswers,
}: {
  answers: Partial<OnboardingAnswers>;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}) {
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('メールアドレスを入力してください');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('正しいメールアドレスを入力してください');
      return;
    }
    setEmailError('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">連絡先を教えてください</h2>
      <p className="text-gray-600 mb-6">
        重要なお知らせやリマインダーをお届けするために使用します。
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={answers.email || ''}
              onChange={(e) => {
                updateAnswers({ email: e.target.value });
                validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                emailError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="example@email.com"
            />
          </div>
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            法改正のお知らせや申請期限のリマインダーをお送りします。
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 3: Family
function StepFamily({
  answers,
  updateAnswers,
}: {
  answers: Partial<OnboardingAnswers>;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}) {
  useEffect(() => {
    // 世帯人数を自動計算
    let size = 1; // 本人
    if (answers.maritalStatus === 'married') size++;
    if (answers.hasChildren && answers.numberOfChildren) {
      size += answers.numberOfChildren;
    }
    if (answers.householdSize !== size) {
      updateAnswers({ householdSize: size });
    }
  }, [answers.maritalStatus, answers.hasChildren, answers.numberOfChildren]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">家族構成を教えてください</h2>
      <p className="text-gray-600 mb-6">
        家族構成に応じた補助金や制度をご案内します。
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            婚姻状況 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'single', label: '独身' },
              { value: 'married', label: '既婚' },
              { value: 'divorced', label: '離別' },
              { value: 'widowed', label: '死別' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  updateAnswers({
                    maritalStatus: option.value as OnboardingAnswers['maritalStatus'],
                  })
                }
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  answers.maritalStatus === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            お子様はいらっしゃいますか？ <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => updateAnswers({ hasChildren: true, numberOfChildren: 1 })}
              className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                answers.hasChildren === true
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Baby className="w-5 h-5 mx-auto mb-1" />
              はい
            </button>
            <button
              onClick={() =>
                updateAnswers({
                  hasChildren: false,
                  numberOfChildren: 0,
                  childrenAges: [],
                })
              }
              className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                answers.hasChildren === false
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              いいえ
            </button>
          </div>
        </div>

        {answers.hasChildren && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お子様の人数
            </label>
            <select
              value={answers.numberOfChildren || 1}
              onChange={(e) => {
                const count = parseInt(e.target.value);
                updateAnswers({
                  numberOfChildren: count,
                  childrenAges: Array(count).fill(0),
                });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}人
                </option>
              ))}
            </select>
          </div>
        )}

        {answers.hasChildren && answers.numberOfChildren && answers.numberOfChildren > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お子様の年齢
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: answers.numberOfChildren }).map((_, i) => (
                <div key={i}>
                  <label className="text-xs text-gray-500">{i + 1}人目</label>
                  <select
                    value={answers.childrenAges?.[i] || 0}
                    onChange={(e) => {
                      const newAges = [...(answers.childrenAges || [])];
                      newAges[i] = parseInt(e.target.value);
                      updateAnswers({ childrenAges: newAges });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 26 }, (_, age) => (
                      <option key={age} value={age}>
                        {age}歳
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <Users className="inline w-4 h-4 mr-1" />
            世帯人数: <span className="font-semibold">{answers.householdSize || 1}人</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 4: Work
function StepWork({
  answers,
  updateAnswers,
}: {
  answers: Partial<OnboardingAnswers>;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}) {
  const formatIncome = (income: number) => {
    if (income >= 10000000) {
      return `${(income / 10000000).toFixed(1)}千万円`;
    }
    return `${(income / 10000).toFixed(0)}万円`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">お仕事について教えてください</h2>
      <p className="text-gray-600 mb-6">
        収入に応じた税制優遇や補助金をご案内します。
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ご職業 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {OCCUPATIONS.map((occupation) => (
              <button
                key={occupation}
                onClick={() => updateAnswers({ occupation })}
                className={`px-3 py-2 text-sm rounded-lg border-2 font-medium transition-colors ${
                  answers.occupation === occupation
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {occupation}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年収（税込）: {formatIncome(answers.annualIncome || 4000000)} <span className="text-red-500">*</span>
          </label>
          <input
            type="range"
            min="0"
            max="30000000"
            step="500000"
            value={answers.annualIncome || 4000000}
            onChange={(e) => updateAnswers({ annualIncome: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0円</span>
            <span>3,000万円</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 5: Location
function StepLocation({
  answers,
  updateAnswers,
}: {
  answers: Partial<OnboardingAnswers>;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">お住まいについて教えてください</h2>
      <p className="text-gray-600 mb-6">
        お住まいの地域に応じた補助金や制度をご案内します。
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            お住まいの都道府県 <span className="text-red-500">*</span>
          </label>
          <select
            value={answers.prefecture || '東京都'}
            onChange={(e) => updateAnswers({ prefecture: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            市区町村
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={answers.city || ''}
              onChange={(e) => updateAnswers({ city: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="港区"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            住居形態 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              { value: 'rent', label: '賃貸', icon: Home },
              { value: 'own', label: '持ち家', icon: Home },
              { value: 'with_parents', label: '実家', icon: Users },
              { value: 'company_housing', label: '社宅', icon: Building },
              { value: 'other', label: 'その他', icon: MapPin },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  updateAnswers({
                    housingType: option.value as HousingType,
                  })
                }
                className={`px-3 py-3 rounded-lg border-2 font-medium transition-colors ${
                  answers.housingType === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <option.icon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 6: Future Plans (今後の予定)
function StepFuturePlans({
  answers,
  updateAnswers,
}: {
  answers: Partial<OnboardingAnswers>;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}) {
  const togglePlan = (planId: FuturePlan) => {
    const currentPlans = answers.futurePlans || [];

    // 「特になし」を選択した場合は他を全てクリア
    if (planId === 'none') {
      updateAnswers({ futurePlans: ['none'] });
      return;
    }

    // 他の選択肢を選んだ場合は「特になし」を外す
    const plansWithoutNone = currentPlans.filter(p => p !== 'none');
    const newPlans = plansWithoutNone.includes(planId)
      ? plansWithoutNone.filter((p) => p !== planId)
      : [...plansWithoutNone, planId];
    updateAnswers({ futurePlans: newPlans });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">🚀 今後の予定を教えてください</h2>
      <p className="text-gray-600 mb-6">
        近い将来に予定しているライフイベントを選んでください。
        <br />
        <span className="text-sm text-blue-600">※ 関連する法令情報や制度をお届けします</span>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FUTURE_PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => togglePlan(plan.id)}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              answers.futurePlans?.includes(plan.id)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl mb-2 block">{plan.icon}</span>
            <span
              className={`text-sm font-medium ${
                answers.futurePlans?.includes(plan.id) ? 'text-blue-700' : 'text-gray-700'
              }`}
            >
              {plan.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 7: Goals
function StepGoals({
  answers,
  updateAnswers,
}: {
  answers: Partial<OnboardingAnswers>;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}) {
  const toggleGoal = (goalId: string) => {
    const currentGoals = answers.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter((g) => g !== goalId)
      : [...currentGoals, goalId];
    updateAnswers({ goals: newGoals });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 あなたの目標を教えてください</h2>
      <p className="text-gray-600 mb-6">
        複数選択できます。目標に合わせた情報をお届けします。
      </p>

      <div className="grid grid-cols-2 gap-3">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              answers.goals?.includes(goal.id)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{goal.icon}</span>
              <span className="text-lg">{goal.animal}</span>
            </div>
            <span
              className={`text-sm font-medium ${
                answers.goals?.includes(goal.id) ? 'text-blue-700' : 'text-gray-700'
              }`}
            >
              {goal.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 8: Animal Selection (動物キャラクター選択)
function StepAnimal({
  answers,
  updateAnswers,
}: {
  answers: Partial<OnboardingAnswers>;
  updateAnswers: (updates: Partial<OnboardingAnswers>) => void;
}) {
  // 目標に基づいておすすめの動物を取得
  const recommendedAnimal = getRecommendedAnimal(answers.goals || []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">🐾 あなたのパートナーを選んでください</h2>
      <p className="text-gray-600 mb-6">
        アプリ内で表示されるあなた専用のアニマルキャラクターです。
        <br />
        <span className="text-sm text-green-600">
          💡 おすすめ: {animalDescriptions[recommendedAnimal].emoji} {animalDescriptions[recommendedAnimal].name}
          （{animalDescriptions[recommendedAnimal].trait}）
        </span>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(AnimalIcons) as AnimalType[]).map((animal) => {
          const description = animalDescriptions[animal];
          const Icon = AnimalIcons[animal];
          const isRecommended = animal === recommendedAnimal;

          return (
            <button
              key={animal}
              onClick={() => updateAnswers({ favoriteAnimal: animal })}
              className={`p-3 rounded-xl border-2 transition-all relative ${
                answers.favoriteAnimal === animal
                  ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200'
                  : isRecommended
                  ? 'border-green-300 bg-green-50 hover:border-green-400'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isRecommended && answers.favoriteAnimal !== animal && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  おすすめ
                </span>
              )}
              <Icon className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-700">{description.emoji} {description.name}</p>
              <p className="text-xs text-gray-500">{description.trait}</p>
            </button>
          );
        })}
      </div>

      {answers.favoriteAnimal && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-4">
            {(() => {
              const Icon = AnimalIcons[answers.favoriteAnimal];
              return <Icon className="w-16 h-16" />;
            })()}
            <div>
              <p className="font-semibold text-gray-900">
                {animalDescriptions[answers.favoriteAnimal].emoji} {animalDescriptions[answers.favoriteAnimal].name}があなたのパートナーです！
              </p>
              <p className="text-sm text-gray-600">
                「{animalDescriptions[answers.favoriteAnimal].trait}」の特性を持つ{animalDescriptions[answers.favoriteAnimal].name}が、
                あなたのライフプランをサポートします。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
