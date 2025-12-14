'use client';

import { Plus, X } from 'lucide-react';
import { Child } from '@/types/onboarding';

interface ChildrenInputProps {
  children: Child[];
  onChange: (children: Child[]) => void;
  maxChildren?: number;
}

export function ChildrenInput({
  children,
  onChange,
  maxChildren = 10
}: ChildrenInputProps) {
  const handleAdd = () => {
    if (children.length < maxChildren) {
      onChange([
        ...children,
        { age: 0, isCohabiting: true }
      ]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(children.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Child, value: number | boolean) => {
    onChange(
      children.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          お子様の情報
        </label>
        {children.length < maxChildren && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>追加</span>
          </button>
        )}
      </div>

      {children.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-sm text-gray-500">
            お子様の情報はありません
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
          >
            + 追加する
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((child, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">年齢</label>
                  <select
                    value={child.age}
                    onChange={(e) => handleChange(index, 'age', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {Array.from({ length: 26 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '0歳（乳児）' : `${i}歳`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">同居</label>
                  <select
                    value={child.isCohabiting ? 'yes' : 'no'}
                    onChange={(e) => handleChange(index, 'isCohabiting', e.target.value === 'yes')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="yes">同居</option>
                    <option value="no">別居</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {children.length > 0 && (
        <p className="text-xs text-gray-500">
          ※ 子育て支援制度の検索に使用されます
        </p>
      )}
    </div>
  );
}
