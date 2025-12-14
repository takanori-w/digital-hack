'use client'

interface NavigationButtonsProps {
  onBack?: () => void
  onNext: () => void
  isLastStep?: boolean
  isValid: boolean
  isLoading?: boolean
}

export function NavigationButtons({
  onBack,
  onNext,
  isLastStep = false,
  isValid,
  isLoading = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between mt-8">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            ← 戻る
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!isValid || isLoading}
        className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            処理中...
          </>
        ) : isLastStep ? (
          '完了 ✓'
        ) : (
          '次へ →'
        )}
      </button>
    </div>
  )
}
