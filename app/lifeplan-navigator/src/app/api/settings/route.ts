import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { AppSettings, UserProfile, EmailSettings, NotificationSettings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// デフォルト設定
const defaultSettings: AppSettings = {
  user: null,
  email: {
    provider: 'none',
    apiKey: '',
    fromEmail: '',
    fromName: 'LifePlan Navigator',
    enabled: false,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    lawChangeAlerts: true,
    deadlineReminders: true,
    weeklyDigest: true,
  },
  onboardingCompleted: false,
  updatedAt: new Date().toISOString(),
};

// データディレクトリとファイルの初期化
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// 設定ファイルの読み込み
async function loadSettings(): Promise<AppSettings> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data) as AppSettings;
  } catch {
    // ファイルが存在しない場合はデフォルト設定を返す
    return { ...defaultSettings };
  }
}

// 設定ファイルの保存
async function saveSettings(settings: AppSettings): Promise<void> {
  await ensureDataDir();
  settings.updatedAt = new Date().toISOString();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// GET: 設定の取得
export async function GET() {
  try {
    const settings = await loadSettings();

    // APIキーはマスクして返す
    const maskedSettings = {
      ...settings,
      email: {
        ...settings.email,
        apiKey: settings.email.apiKey ? '********' : '',
      },
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    return NextResponse.json(
      { error: '設定の読み込みに失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: 設定の更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const currentSettings = await loadSettings();

    const updatedSettings: AppSettings = {
      ...currentSettings,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // APIキーが********の場合は既存の値を保持
    if (body.email && body.email.apiKey === '********') {
      updatedSettings.email.apiKey = currentSettings.email.apiKey;
    }

    await saveSettings(updatedSettings);

    // マスクして返す
    const maskedSettings = {
      ...updatedSettings,
      email: {
        ...updatedSettings.email,
        apiKey: updatedSettings.email.apiKey ? '********' : '',
      },
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: '設定の保存に失敗しました' },
      { status: 500 }
    );
  }
}

// PATCH: 部分更新（ユーザープロフィール、メール設定、通知設定など）
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, data } = body;

    const currentSettings = await loadSettings();

    switch (section) {
      case 'user':
        currentSettings.user = data as UserProfile;
        break;
      case 'email':
        // APIキーが********の場合は既存の値を保持
        if (data.apiKey === '********') {
          data.apiKey = currentSettings.email.apiKey;
        }
        currentSettings.email = { ...currentSettings.email, ...data } as EmailSettings;
        break;
      case 'notifications':
        currentSettings.notifications = { ...currentSettings.notifications, ...data } as NotificationSettings;
        break;
      case 'onboarding':
        currentSettings.onboardingCompleted = data.completed;
        break;
      default:
        return NextResponse.json(
          { error: '不明なセクションです' },
          { status: 400 }
        );
    }

    await saveSettings(currentSettings);

    // マスクして返す
    const maskedSettings = {
      ...currentSettings,
      email: {
        ...currentSettings.email,
        apiKey: currentSettings.email.apiKey ? '********' : '',
      },
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: '設定の更新に失敗しました' },
      { status: 500 }
    );
  }
}
