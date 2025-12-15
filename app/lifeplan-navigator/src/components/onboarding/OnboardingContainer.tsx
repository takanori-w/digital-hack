'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { LifeStage } from '@/types';
import {
  OnboardingState,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  EmploymentType,
  ResidenceType,
  HouseholdType,
  PlannedEvent,
  Child
} from '@/types/onboarding';
import { ProgressBar } from './ProgressBar';
import { StepHeader } from './StepHeader';
import { NavigationButtons } from './NavigationButtons';
import { SelectableCard } from './SelectableCard';
import { ChildrenInput } from './ChildrenInput';
import { EmploymentTypeLabels, ResidenceTypeLabels, HouseholdTypeLabels, PlannedEventLabels } from '@/types/onboarding';
import { getAnimalByLifeStage } from '@/components/AnimalIcons';

const TOTAL_STEPS = 4;

// Step titles
const STEP_TITLES: Record<number, string> = {
  1: '基本情報',
  2: '住まい情報',
  3: '家族構成',
  4: '今後の予定'
};

// Japanese prefectures list
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
  '海外'
];

// Initial state
const initialState: OnboardingState = {
  currentStep: 1,
  step1: { age: null, employmentType: null },
  step2: { residenceType: null, region: null, residencePrefecture: null, workPrefecture: null },
  step3: { householdType: null, hasSpouse: null, children: [] },
  step4: { plannedEvents: [], email: '', emailNotificationEnabled: false }
};

// Determine life stage based on user data
function determineLifeStage(
  age: number | null,
  employmentType: EmploymentType | null,
  householdType: HouseholdType | null,
  hasSpouse: boolean | null,
  children: Child[],
  plannedEvents: PlannedEvent[]
): LifeStage {
  // Student
  if (employmentType === EmploymentType.STUDENT) {
    return 'student';
  }

  // Retired
  if (employmentType === EmploymentType.RETIRED || (age && age >= 65)) {
    return 'retired';
  }

  // Pre-retirement (55-64 years old)
  if (age && age >= 55 && age < 65) {
    return 'pre_retirement';
  }

  // Has children - check both children array AND household type
  const hasChildrenByType =
    householdType === HouseholdType.FAMILY_WITH_CHILDREN ||
    householdType === HouseholdType.SINGLE_PARENT ||
    householdType === HouseholdType.THREE_GENERATION;

  if (children.length > 0 || hasChildrenByType) {
    // Check if any child is in education age (6-22)
    const hasEducationAgeChild = children.some(c => c.age >= 6 && c.age <= 22);
    if (hasEducationAgeChild) {
      return 'child_education';
    }
    // Child rearing (default for families with children)
    return 'child_rearing';
  }

  // Expecting (planning childbirth)
  if (plannedEvents.includes(PlannedEvent.CHILDBIRTH)) {
    return 'expecting';
  }

  // Married/Couple without children
  if (hasSpouse === true || householdType === HouseholdType.COUPLE) {
    // Empty nest (older couple without children at home)
    if (age && age >= 50) {
      return 'empty_nest';
    }
    return 'newlywed'; // Default for married couples
  }

  // Planning marriage
  if (plannedEvents.includes(PlannedEvent.MARRIAGE)) {
    return 'engaged';
  }

  // New graduate (young single, recently started working)
  // Only reaches here if: no children, no spouse, no family household type
  if (age && age >= 22 && age <= 25) {
    return 'new_graduate';
  }

  // Default: working single (only for truly single people)
  // Only reaches here if: householdType is SINGLE, OTHER, or null
  return 'working_single';
}

export default function OnboardingContainer() {
  const router = useRouter();
  const { setOnboardingCompleted, setUser, setLifeStage } = useAppStore();
  const [state, setState] = useState<OnboardingState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = state.currentStep;
  const stepTitle = STEP_TITLES[currentStep] || '';

  // Update step data
  const updateStep1 = (updates: Partial<Step1Data>) => {
    setState(prev => ({ ...prev, step1: { ...prev.step1, ...updates } }));
    setError(null);
  };

  const updateStep2 = (updates: Partial<Step2Data>) => {
    setState(prev => ({ ...prev, step2: { ...prev.step2, ...updates } }));
    setError(null);
  };

  const updateStep3 = (updates: Partial<Step3Data>) => {
    setState(prev => ({ ...prev, step3: { ...prev.step3, ...updates } }));
    setError(null);
  };

  const updateStep4 = (updates: Partial<Step4Data>) => {
    setState(prev => ({ ...prev, step4: { ...prev.step4, ...updates } }));
    setError(null);
  };

  // Validate current step
  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return state.step1.age !== null && state.step1.employmentType !== null;
      case 2:
        return state.step2.residenceType !== null && state.step2.residencePrefecture !== null;
      case 3:
        return state.step3.householdType !== null;
      case 4:
        if (state.step4.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(state.step4.email);
        }
        return true;
      default:
        return true;
    }
  };

  const isValid = validateStep();

  // Navigation handlers
  const handleNext = async () => {
    if (!isValid) return;

    if (currentStep < TOTAL_STEPS) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Save to onboarding API
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: state.step1.age,
          employmentType: state.step1.employmentType,
          residenceType: state.step2.residenceType,
          region: state.step2.region,
          residencePrefecture: state.step2.residencePrefecture,
          workPrefecture: state.step2.workPrefecture,
          householdType: state.step3.householdType,
          hasSpouse: state.step3.hasSpouse ?? false,
          children: state.step3.children,
          plannedEvents: state.step4.plannedEvents,
          email: state.step4.email,
          emailNotificationEnabled: state.step4.emailNotificationEnabled,
          onboardingCompleted: true
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      // Also save to settings API for Settings page compatibility
      // Determine life stage for animal recommendation
      const lifeStage = determineLifeStage(
        state.step1.age,
        state.step1.employmentType,
        state.step3.householdType,
        state.step3.hasSpouse,
        state.step3.children,
        state.step4.plannedEvents
      );
      const recommendedAnimal = getAnimalByLifeStage(lifeStage);

      const userProfile = {
        id: 'user-' + Date.now(),
        name: '',
        email: state.step4.email || '',
        birthDate: state.step1.age ? `${new Date().getFullYear() - state.step1.age}-01-01` : '',
        gender: 'male' as const,
        prefecture: state.step2.residencePrefecture || state.step2.region || '東京都',
        residencePrefecture: state.step2.residencePrefecture || '東京都',
        workPrefecture: state.step2.workPrefecture || '',
        city: '',
        occupation: mapEmploymentTypeToOccupation(state.step1.employmentType),
        annualIncome: 4000000,
        householdSize: 1 + (state.step3.hasSpouse ? 1 : 0) + state.step3.children.length,
        maritalStatus: state.step3.hasSpouse ? 'married' as const : 'single' as const,
        hasChildren: state.step3.children.length > 0,
        numberOfChildren: state.step3.children.length,
        childrenAges: state.step3.children.map(c => c.age),
        housingType: mapResidenceTypeToHousingType(state.step2.residenceType),
        futurePlans: mapPlannedEventsToFuturePlans(state.step4.plannedEvents),
        goals: [] as string[],
        favoriteAnimal: recommendedAnimal,
        financialInfo: {
          monthlyHousingCost: 80000,
          currentSavings: 1000000,
          monthlySavingsAmount: 30000,
          investmentAssets: 0,
          hasLifeInsurance: false,
          hasHealthInsurance: false,
          hasPensionInsurance: false,
          hasIdeco: false,
          hasNisa: false,
          annualMedicalExpenses: 50000,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'user', data: userProfile }),
      });

      // Mark onboarding as completed
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'onboarding', data: { completed: true } }),
      });

      // Determine life stage based on user data
      const lifeStage = determineLifeStage(
        state.step1.age,
        state.step1.employmentType,
        state.step3.householdType,
        state.step3.hasSpouse,
        state.step3.children,
        state.step4.plannedEvents
      );

      // Update Zustand store with user profile, onboarding status, and life stage
      setUser(userProfile);
      setOnboardingCompleted(true);
      setLifeStage(lifeStage);

      // Redirect to home page (which will now show Dashboard since onboardingCompleted is true)
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred');
      setIsSubmitting(false);
    }
  };

  // Helper functions to map onboarding types to settings types
  const mapEmploymentTypeToOccupation = (type: EmploymentType | null): string => {
    if (!type) return '';
    const mapping: Record<EmploymentType, string> = {
      [EmploymentType.FULL_TIME_EMPLOYEE]: '会社員（正社員）',
      [EmploymentType.CONTRACT_EMPLOYEE]: '会社員（契約社員）',
      [EmploymentType.CIVIL_SERVANT]: '公務員',
      [EmploymentType.SELF_EMPLOYED]: '自営業・フリーランス',
      [EmploymentType.PART_TIME]: 'パート・アルバイト',
      [EmploymentType.HOMEMAKER]: '専業主婦・主夫',
      [EmploymentType.STUDENT]: '学生',
      [EmploymentType.UNEMPLOYED]: '無職・求職中',
      [EmploymentType.RETIRED]: 'その他',
      [EmploymentType.OTHER]: 'その他',
    };
    return mapping[type] || '';
  };

  const mapResidenceTypeToHousingType = (type: ResidenceType | null): 'rent' | 'own' | 'with_parents' => {
    if (!type) return 'rent';
    const mapping: Record<ResidenceType, 'rent' | 'own' | 'with_parents'> = {
      [ResidenceType.RENTAL]: 'rent',
      [ResidenceType.OWNED]: 'own',
      [ResidenceType.PARENTS_HOME]: 'with_parents',
      [ResidenceType.COMPANY_HOUSING]: 'rent',
      [ResidenceType.PUBLIC_HOUSING]: 'rent',
      [ResidenceType.OTHER]: 'rent',
    };
    return mapping[type] || 'rent';
  };

  type FuturePlanType = 'marriage' | 'childbirth' | 'housing_purchase' | 'job_change' | 'retirement' | 'child_education' | 'inheritance' | 'startup' | 'investment' | 'side_job';

  const mapPlannedEventsToFuturePlans = (events: PlannedEvent[]): FuturePlanType[] => {
    const mapping: Record<PlannedEvent, FuturePlanType | ''> = {
      [PlannedEvent.MARRIAGE]: 'marriage',
      [PlannedEvent.CHILDBIRTH]: 'childbirth',
      [PlannedEvent.HOME_PURCHASE]: 'housing_purchase',
      [PlannedEvent.HOME_RENOVATION]: 'housing_purchase',
      [PlannedEvent.JOB_CHANGE]: 'job_change',
      [PlannedEvent.RETIREMENT]: 'retirement',
      [PlannedEvent.CHILD_EDUCATION]: 'child_education',
      [PlannedEvent.NURSING_CARE]: 'inheritance',
      [PlannedEvent.INHERITANCE]: 'inheritance',
      [PlannedEvent.RELOCATION]: 'housing_purchase',
      [PlannedEvent.SIDE_BUSINESS]: 'side_job',
      [PlannedEvent.NONE]: '',
    };
    return events
      .filter(e => e !== PlannedEvent.NONE)
      .map(e => mapping[e])
      .filter((v): v is FuturePlanType => v !== '');
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年齢 <span className="text-red-500">*</span>
              </label>
              <select
                value={state.step1.age ?? ''}
                onChange={(e) => updateStep1({ age: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">選択してください</option>
                {Array.from({ length: 83 }, (_, i) => i + 18).map(age => (
                  <option key={age} value={age}>{age}歳</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                働き方 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(EmploymentTypeLabels).map(([value, label]) => (
                  <SelectableCard
                    key={value}
                    value={value}
                    label={label}
                    selected={state.step1.employmentType === value}
                    onSelect={(v) => updateStep1({ employmentType: v as EmploymentType })}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                住まい状況 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(ResidenceTypeLabels).map(([value, label]) => (
                  <SelectableCard
                    key={value}
                    value={value}
                    label={label}
                    selected={state.step2.residenceType === value}
                    onSelect={(v) => updateStep2({ residenceType: v as ResidenceType })}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                在住都道府県 <span className="text-red-500">*</span>
              </label>
              <select
                value={state.step2.residencePrefecture ?? ''}
                onChange={(e) => updateStep2({
                  residencePrefecture: e.target.value || null,
                  region: e.target.value || null // For backward compatibility
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">地域に合った補助金・制度を表示するために使用します</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                勤務先都道府県 <span className="text-gray-400 text-xs">(任意)</span>
              </label>
              <select
                value={state.step2.workPrefecture ?? ''}
                onChange={(e) => updateStep2({ workPrefecture: e.target.value || null })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">勤務先の地域に合った制度も表示できます</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                世帯構成 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(HouseholdTypeLabels).map(([value, label]) => (
                  <SelectableCard
                    key={value}
                    value={value}
                    label={label}
                    selected={state.step3.householdType === value}
                    onSelect={(v) => {
                      const newType = v as HouseholdType;
                      updateStep3({
                        householdType: newType,
                        hasSpouse: newType === HouseholdType.SINGLE ? false : state.step3.hasSpouse,
                        children: newType === HouseholdType.SINGLE || newType === HouseholdType.COUPLE ? [] : state.step3.children
                      });
                    }}
                  />
                ))}
              </div>
            </div>
            {state.step3.householdType && state.step3.householdType !== HouseholdType.SINGLE && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">配偶者</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => updateStep3({ hasSpouse: true })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium ${
                      state.step3.hasSpouse ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200'
                    }`}
                  >
                    あり
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStep3({ hasSpouse: false })}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium ${
                      state.step3.hasSpouse === false ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200'
                    }`}
                  >
                    なし
                  </button>
                </div>
              </div>
            )}
            {state.step3.householdType &&
             state.step3.householdType !== HouseholdType.SINGLE &&
             state.step3.householdType !== HouseholdType.COUPLE && (
              <ChildrenInput
                children={state.step3.children}
                onChange={(children) => updateStep3({ children })}
              />
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                今後の予定 <span className="text-gray-400 text-xs">(複数選択可)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(PlannedEventLabels).map(([value, label]) => {
                  const event = value as PlannedEvent;
                  const isSelected = state.step4.plannedEvents.includes(event);
                  return (
                    <SelectableCard
                      key={value}
                      value={value}
                      label={label}
                      selected={isSelected}
                      onSelect={() => {
                        if (event === PlannedEvent.NONE) {
                          updateStep4({ plannedEvents: [PlannedEvent.NONE] });
                        } else {
                          const withoutNone = state.step4.plannedEvents.filter(e => e !== PlannedEvent.NONE);
                          if (isSelected) {
                            updateStep4({ plannedEvents: withoutNone.filter(e => e !== event) });
                          } else {
                            updateStep4({ plannedEvents: [...withoutNone, event] });
                          }
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-gray-400 text-xs">(任意)</span>
              </label>
              <input
                type="email"
                value={state.step4.email}
                onChange={(e) => updateStep4({ email: e.target.value })}
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">メール通知を受け取る</span>
              <button
                type="button"
                onClick={() => updateStep4({ emailNotificationEnabled: !state.step4.emailNotificationEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  state.step4.emailNotificationEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.step4.emailNotificationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <StepHeader step={currentStep} title={stepTitle} />

          <div className="mt-6">
            {renderStepContent()}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-8">
            <NavigationButtons
              onBack={currentStep > 1 ? handleBack : undefined}
              onNext={handleNext}
              isValid={isValid}
              isLastStep={currentStep === TOTAL_STEPS}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
