'use client';

import { useAppStore } from '@/lib/store';
import { X, Bell, AlertTriangle, Gift, Calendar } from 'lucide-react';

interface NotificationPanelProps {
  onClose: () => void;
}

const typeIcons = {
  law_change: AlertTriangle,
  benefit_deadline: Calendar,
  action_reminder: Bell,
  news: Gift,
};

const typeColors = {
  law_change: 'text-orange-500 bg-orange-50',
  benefit_deadline: 'text-red-500 bg-red-50',
  action_reminder: 'text-blue-500 bg-blue-50',
  news: 'text-green-500 bg-green-50',
};

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, clearNotifications } = useAppStore();

  return (
    <div className="absolute right-4 top-20 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">通知</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearNotifications}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            すべて既読
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>新しい通知はありません</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <li
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-primary-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${typeColors[notification.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
