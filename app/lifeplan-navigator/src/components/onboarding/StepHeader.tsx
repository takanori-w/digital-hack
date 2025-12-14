'use client'

import { STEP_GUIDES } from '@/types/onboarding'

interface StepHeaderProps {
  step: number
  title: string
}

export function StepHeader({ step, title }: StepHeaderProps) {
  const guide = STEP_GUIDES[step]

  if (!guide) {
    return (
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Step {step}: {title}
        </h2>
      </div>
    )
  }

  return (
    <div className="text-center mb-8">
      <div className="text-5xl mb-3">{guide.emoji}</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Step {step}: {title}
      </h2>
      <p className="text-gray-500 text-sm">
        {guide.emoji} {guide.name} - {guide.role}
      </p>
    </div>
  )
}
