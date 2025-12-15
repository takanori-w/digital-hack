/**
 * Onboarding Types
 * Based on: docs/Onboarding_UI_Design_Specification.md
 */

// Step 1: Employment Type
export enum EmploymentType {
  FULL_TIME_EMPLOYEE = 'FULL_TIME_EMPLOYEE',
  CONTRACT_EMPLOYEE = 'CONTRACT_EMPLOYEE',
  CIVIL_SERVANT = 'CIVIL_SERVANT',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  PART_TIME = 'PART_TIME',
  STUDENT = 'STUDENT',
  HOMEMAKER = 'HOMEMAKER',
  RETIRED = 'RETIRED',
  UNEMPLOYED = 'UNEMPLOYED',
  OTHER = 'OTHER',
}

export const EmploymentTypeLabels: Record<EmploymentType, string> = {
  [EmploymentType.FULL_TIME_EMPLOYEE]: '会社員（正社員）',
  [EmploymentType.CONTRACT_EMPLOYEE]: '会社員（契約・派遣）',
  [EmploymentType.CIVIL_SERVANT]: '公務員',
  [EmploymentType.SELF_EMPLOYED]: '自営業・フリーランス',
  [EmploymentType.PART_TIME]: 'パート・アルバイト',
  [EmploymentType.STUDENT]: '学生',
  [EmploymentType.HOMEMAKER]: '専業主婦・主夫',
  [EmploymentType.RETIRED]: '年金受給者・退職者',
  [EmploymentType.UNEMPLOYED]: '求職中',
  [EmploymentType.OTHER]: 'その他',
}

// Step 2: Residence Type
export enum ResidenceType {
  RENTAL = 'RENTAL',
  OWNED = 'OWNED',
  PARENTS_HOME = 'PARENTS_HOME',
  COMPANY_HOUSING = 'COMPANY_HOUSING',
  PUBLIC_HOUSING = 'PUBLIC_HOUSING',
  OTHER = 'OTHER',
}

export const ResidenceTypeLabels: Record<ResidenceType, string> = {
  [ResidenceType.RENTAL]: '賃貸',
  [ResidenceType.OWNED]: '持ち家',
  [ResidenceType.PARENTS_HOME]: '実家',
  [ResidenceType.COMPANY_HOUSING]: '社宅・寮',
  [ResidenceType.PUBLIC_HOUSING]: '公営住宅',
  [ResidenceType.OTHER]: 'その他',
}

// Step 3: Household Type
export enum HouseholdType {
  SINGLE = 'SINGLE',
  COUPLE = 'COUPLE',
  FAMILY_WITH_CHILDREN = 'FAMILY_WITH_CHILDREN',
  SINGLE_PARENT = 'SINGLE_PARENT',
  THREE_GENERATION = 'THREE_GENERATION',
  OTHER = 'OTHER',
}

export const HouseholdTypeLabels: Record<HouseholdType, string> = {
  [HouseholdType.SINGLE]: '一人暮らし',
  [HouseholdType.COUPLE]: '夫婦のみ',
  [HouseholdType.FAMILY_WITH_CHILDREN]: '子供あり世帯',
  [HouseholdType.SINGLE_PARENT]: 'ひとり親世帯',
  [HouseholdType.THREE_GENERATION]: '三世代同居',
  [HouseholdType.OTHER]: 'その他',
}

// Step 4: Planned Events
export enum PlannedEvent {
  SIDE_BUSINESS = 'SIDE_BUSINESS',
  JOB_CHANGE = 'JOB_CHANGE',
  RETIREMENT = 'RETIREMENT',
  HOME_PURCHASE = 'HOME_PURCHASE',
  HOME_RENOVATION = 'HOME_RENOVATION',
  MARRIAGE = 'MARRIAGE',
  CHILDBIRTH = 'CHILDBIRTH',
  CHILD_EDUCATION = 'CHILD_EDUCATION',
  INHERITANCE = 'INHERITANCE',
  NURSING_CARE = 'NURSING_CARE',
  RELOCATION = 'RELOCATION',
  NONE = 'NONE',
}

export const PlannedEventLabels: Record<PlannedEvent, string> = {
  [PlannedEvent.SIDE_BUSINESS]: '副業の開始',
  [PlannedEvent.JOB_CHANGE]: '転職',
  [PlannedEvent.RETIREMENT]: '退職・定年',
  [PlannedEvent.HOME_PURCHASE]: '住宅購入',
  [PlannedEvent.HOME_RENOVATION]: 'リフォーム',
  [PlannedEvent.MARRIAGE]: '結婚',
  [PlannedEvent.CHILDBIRTH]: '出産',
  [PlannedEvent.CHILD_EDUCATION]: '子供の進学',
  [PlannedEvent.INHERITANCE]: '相続',
  [PlannedEvent.NURSING_CARE]: '介護',
  [PlannedEvent.RELOCATION]: '引っ越し',
  [PlannedEvent.NONE]: '特になし',
}

// Child information
export interface Child {
  age: number // 0-25
  isCohabiting: boolean
}

// Complete onboarding profile
export interface UserOnboardingProfile {
  // Step 1
  age: number
  employmentType: EmploymentType

  // Step 2
  residenceType: ResidenceType
  region?: string // Prefecture code

  // Step 3
  householdType: HouseholdType
  hasSpouse: boolean
  children: Child[]

  // Step 4
  plannedEvents: PlannedEvent[]
  email?: string
  emailNotificationEnabled: boolean

  // Metadata
  createdAt: Date
  updatedAt: Date
  onboardingCompleted: boolean
}

// Onboarding step data for each step
export interface Step1Data {
  age: number | null
  employmentType: EmploymentType | null
}

export interface Step2Data {
  residenceType: ResidenceType | null
  region: string | null // For backward compatibility
  residencePrefecture: string | null // 在住都道府県
  workPrefecture: string | null // 勤務先都道府県
}

export interface Step3Data {
  householdType: HouseholdType | null
  hasSpouse: boolean | null
  children: Child[]
}

export interface Step4Data {
  plannedEvents: PlannedEvent[]
  email: string
  emailNotificationEnabled: boolean
}

// Combined onboarding state
export interface OnboardingState {
  currentStep: number
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
}

// Animal guide configuration
export interface AnimalGuide {
  emoji: string
  name: string
  role: string
}

export const STEP_GUIDES: Record<number, AnimalGuide> = {
  1: { emoji: '🦊', name: 'キツネ', role: '知恵の案内人' },
  2: { emoji: '🦫', name: 'ビーバー', role: '家づくりの達人' },
  3: { emoji: '🦘', name: 'カンガルー', role: '家族の守り手' },
  4: { emoji: '🐝', name: 'ミツバチ', role: '未来への準備' },
}
