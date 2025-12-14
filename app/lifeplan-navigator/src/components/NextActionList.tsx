'use client';

import { useAppStore } from '@/lib/store';
import { Check, Circle, Calendar, ChevronRight } from 'lucide-react';

export default function NextActionList() {
  const { nextActions, toggleActionComplete } = useAppStore();

  const sortedActions = [...nextActions].sort((a, b) => {
    // 完了していないものを先に
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // 優先度順
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {sortedActions.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>アクションはありません</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {sortedActions.map((action) => (
            <li
              key={action.id}
              className={`p-4 border-l-4 ${priorityColors[action.priority]} ${
                action.completed ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleActionComplete(action.id)}
                  className={`mt-0.5 p-1 rounded-full transition-colors ${
                    action.completed
                      ? 'bg-green-100 text-green-600'
                      : 'hover:bg-gray-100 text-gray-400'
                  }`}
                >
                  {action.completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium text-sm ${
                      action.completed ? 'line-through text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {action.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{action.description}</p>
                  {action.dueDate && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{action.dueDate}</span>
                    </div>
                  )}
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
