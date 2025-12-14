import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, NextAction, Notification, LifeStage, SecuritySettings, NotificationSettings } from '@/types';
import { mockUserProfile, mockNextActions } from '@/data/mockData';

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => void;

  // Authentication
  isAuthenticated: boolean;
  password: string | null; // hashed password for demo
  setPassword: (password: string) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // Security Settings
  securitySettings: SecuritySettings;
  updateSecuritySettings: (updates: Partial<SecuritySettings>) => void;

  // Notification Settings
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;

  // Life Stage
  currentLifeStage: LifeStage;
  setLifeStage: (stage: LifeStage) => void;

  // Actions
  nextActions: NextAction[];
  addAction: (action: NextAction) => void;
  updateAction: (id: string, updates: Partial<NextAction>) => void;
  removeAction: (id: string) => void;
  toggleActionComplete: (id: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;

  // UI State
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;

  // Initialize with mock data (for demo)
  initializeMockData: () => void;

  // Reset all data
  resetAllData: () => void;
}

const defaultSecuritySettings: SecuritySettings = {
  mfaEnabled: false,
  mfaMethod: null,
  mfaVerified: false,
  passkeyEnabled: false,
  passkeyRegistered: false,
  lastPasswordChange: null,
  loginHistory: [],
  trustedDevices: [],
};

const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  lawChangeAlerts: true,
  deadlineReminders: true,
  weeklyDigest: false,
};

// Simple hash function for demo (NOT for production use)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates, updatedAt: new Date().toISOString() } : null,
        })),

      // Authentication
      isAuthenticated: false,
      password: null,
      setPassword: (password) => set({ password: simpleHash(password) }),
      login: (email, password) => {
        const state = get();
        if (state.user?.email === email && state.password === simpleHash(password)) {
          set({
            isAuthenticated: true,
            securitySettings: {
              ...state.securitySettings,
              loginHistory: [
                {
                  id: crypto.randomUUID(),
                  timestamp: new Date().toISOString(),
                  ipAddress: '192.168.1.1', // Demo
                  userAgent: navigator.userAgent,
                  location: '日本',
                  success: true,
                },
                ...state.securitySettings.loginHistory.slice(0, 9),
              ],
            },
          });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false }),

      // Security Settings
      securitySettings: defaultSecuritySettings,
      updateSecuritySettings: (updates) =>
        set((state) => ({
          securitySettings: { ...state.securitySettings, ...updates },
        })),

      // Notification Settings
      notificationSettings: defaultNotificationSettings,
      updateNotificationSettings: (updates) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...updates },
        })),

      // Life Stage
      currentLifeStage: 'working_single',
      setLifeStage: (stage) => set({ currentLifeStage: stage }),

      // Actions
      nextActions: [],
      addAction: (action) =>
        set((state) => ({ nextActions: [...state.nextActions, action] })),
      updateAction: (id, updates) =>
        set((state) => ({
          nextActions: state.nextActions.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      removeAction: (id) =>
        set((state) => ({
          nextActions: state.nextActions.filter((a) => a.id !== id),
        })),
      toggleActionComplete: (id) =>
        set((state) => ({
          nextActions: state.nextActions.map((a) =>
            a.id === id ? { ...a, completed: !a.completed } : a
          ),
        })),

      // Notifications
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({ notifications: [notification, ...state.notifications] })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // UI State
      onboardingCompleted: false,
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

      // Initialize with mock data
      initializeMockData: () =>
        set({
          user: mockUserProfile,
          nextActions: mockNextActions,
          currentLifeStage: 'child_rearing',
          onboardingCompleted: true,
          isAuthenticated: true,
          password: simpleHash('demo1234'),
          notifications: [
            {
              id: '1',
              type: 'law_change',
              title: '2025年税制改正について',
              message: '2025年度の税制改正により、NISA制度の一部が変更されます。詳細をご確認ください。',
              read: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              type: 'benefit_deadline',
              title: 'ふるさと納税の締め切りが近づいています',
              message: '2024年分のふるさと納税は12月31日までです。お早めに手続きをお済ませください。',
              read: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }),

      // Reset all data
      resetAllData: () =>
        set({
          user: null,
          isAuthenticated: false,
          password: null,
          securitySettings: defaultSecuritySettings,
          notificationSettings: defaultNotificationSettings,
          currentLifeStage: 'working_single',
          nextActions: [],
          notifications: [],
          onboardingCompleted: false,
        }),
    }),
    {
      name: 'lifeplan-storage',
    }
  )
);
