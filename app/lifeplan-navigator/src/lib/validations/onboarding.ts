import { z } from 'zod'
import {
  EmploymentType,
  ResidenceType,
  HouseholdType,
  PlannedEvent,
} from '@/types/onboarding'

// Step 1: Age and Employment Type
export const step1Schema = z.object({
  age: z
    .number({ message: '年齢は数値で入力してください' })
    .int({ message: '年齢は整数で入力してください' })
    .min(18, { message: '年齢は18歳以上を入力してください' })
    .max(100, { message: '年齢は100歳以下を入力してください' }),
  employmentType: z.nativeEnum(EmploymentType, {
    message: '働き方を選択してください',
  }),
})

// Step 2: Residence and Region
export const step2Schema = z.object({
  residenceType: z.nativeEnum(ResidenceType, {
    message: '住居形態を選択してください',
  }),
  region: z
    .string()
    .min(1, { message: '地域を選択してください' })
    .nullable()
    .optional(),
})

// Child schema for Step 3
export const childSchema = z.object({
  age: z
    .number()
    .int()
    .min(0, { message: '子供の年齢は0歳以上を入力してください' })
    .max(25, { message: '子供の年齢は25歳以下を入力してください' }),
  isCohabiting: z.boolean(),
})

// Step 3: Household and Family
export const step3Schema = z.object({
  householdType: z.nativeEnum(HouseholdType, {
    message: '世帯構成を選択してください',
  }),
  hasSpouse: z.boolean({ message: '配偶者の有無を選択してください' }),
  children: z.array(childSchema).default([]),
})

// Step 4: Planned Events and Contact
export const step4Schema = z.object({
  plannedEvents: z
    .array(z.nativeEnum(PlannedEvent))
    .min(1, '少なくとも1つのライフイベントを選択してください'),
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .optional()
    .or(z.literal('')),
  emailNotificationEnabled: z.boolean().default(false),
})

// Complete onboarding profile schema
export const onboardingProfileSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
})

// Type inference
export type Step1FormData = z.infer<typeof step1Schema>
export type Step2FormData = z.infer<typeof step2Schema>
export type Step3FormData = z.infer<typeof step3Schema>
export type Step4FormData = z.infer<typeof step4Schema>
export type OnboardingProfileFormData = z.infer<typeof onboardingProfileSchema>

// Validation functions
export function validateStep1(data: unknown) {
  return step1Schema.safeParse(data)
}

export function validateStep2(data: unknown) {
  return step2Schema.safeParse(data)
}

export function validateStep3(data: unknown) {
  return step3Schema.safeParse(data)
}

export function validateStep4(data: unknown) {
  return step4Schema.safeParse(data)
}

export function validateOnboardingProfile(data: unknown) {
  return onboardingProfileSchema.safeParse(data)
}
