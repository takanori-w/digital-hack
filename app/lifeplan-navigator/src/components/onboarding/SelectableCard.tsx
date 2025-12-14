'use client'

interface SelectableCardProps {
  value: string
  label: string
  icon?: string
  description?: string
  selected: boolean
  onSelect: (value: string) => void
}

export function SelectableCard({
  value,
  label,
  icon,
  description,
  selected,
  onSelect,
}: SelectableCardProps) {
  const baseClasses = 'w-full p-4 rounded-lg border-2 text-left transition-all'
  const selectedClasses = selected
    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
  const textClasses = selected ? 'text-emerald-700' : 'text-gray-800'

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`${baseClasses} ${selectedClasses}`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div>
          <div className={`font-medium ${textClasses}`}>
            {label}
          </div>
          {description && (
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          )}
        </div>
        {selected && (
          <div className="ml-auto">
            <svg
              className="w-6 h-6 text-emerald-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}
