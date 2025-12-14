import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Mock notification settings storage (in production, use a database)
const NOTIFICATION_SETTINGS: Map<string, NotificationSettings> = new Map();

interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  lawChangeAlerts: boolean;
  deadlineReminders: boolean;
  weeklyDigest: boolean;
  updatedAt: string;
}

// Initialize with default settings for demo user
NOTIFICATION_SETTINGS.set('demo-user-001', {
  userId: 'demo-user-001',
  emailNotifications: true,
  pushNotifications: false,
  lawChangeAlerts: true,
  deadlineReminders: true,
  weeklyDigest: true,
  updatedAt: new Date().toISOString(),
});

/**
 * Validate session and get user ID
 */
function getUserIdFromSession(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    return null;
  }
  // For demo purposes, return a fixed user ID
  return 'demo-user-001';
}

/**
 * GET /api/user/notifications
 * Retrieve current user's notification settings
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    let settings = NOTIFICATION_SETTINGS.get(userId);

    // Create default settings if not exist
    if (!settings) {
      settings = {
        userId,
        emailNotifications: true,
        pushNotifications: false,
        lawChangeAlerts: true,
        deadlineReminders: true,
        weeklyDigest: true,
        updatedAt: new Date().toISOString(),
      };
      NOTIFICATION_SETTINGS.set(userId, settings);
    }

    return NextResponse.json({
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      lawChangeAlerts: settings.lawChangeAlerts,
      deadlineReminders: settings.deadlineReminders,
      weeklyDigest: settings.weeklyDigest,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error('Notification settings GET error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/notifications
 * Update current user's notification settings
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    let settings = NOTIFICATION_SETTINGS.get(userId);

    // Create default settings if not exist
    if (!settings) {
      settings = {
        userId,
        emailNotifications: true,
        pushNotifications: false,
        lawChangeAlerts: true,
        deadlineReminders: true,
        weeklyDigest: true,
        updatedAt: new Date().toISOString(),
      };
    }

    const body = await request.json();
    const {
      emailNotifications,
      pushNotifications,
      lawChangeAlerts,
      deadlineReminders,
      weeklyDigest,
    } = body;

    // Validate and update each setting
    if (emailNotifications !== undefined) {
      if (typeof emailNotifications !== 'boolean') {
        return NextResponse.json(
          { error: 'メール通知設定が無効です', field: 'emailNotifications' },
          { status: 400 }
        );
      }
      settings.emailNotifications = emailNotifications;
    }

    if (pushNotifications !== undefined) {
      if (typeof pushNotifications !== 'boolean') {
        return NextResponse.json(
          { error: 'プッシュ通知設定が無効です', field: 'pushNotifications' },
          { status: 400 }
        );
      }
      settings.pushNotifications = pushNotifications;
    }

    if (lawChangeAlerts !== undefined) {
      if (typeof lawChangeAlerts !== 'boolean') {
        return NextResponse.json(
          { error: '法改正通知設定が無効です', field: 'lawChangeAlerts' },
          { status: 400 }
        );
      }
      settings.lawChangeAlerts = lawChangeAlerts;
    }

    if (deadlineReminders !== undefined) {
      if (typeof deadlineReminders !== 'boolean') {
        return NextResponse.json(
          { error: '期限リマインダー設定が無効です', field: 'deadlineReminders' },
          { status: 400 }
        );
      }
      settings.deadlineReminders = deadlineReminders;
    }

    if (weeklyDigest !== undefined) {
      if (typeof weeklyDigest !== 'boolean') {
        return NextResponse.json(
          { error: '週間ダイジェスト設定が無効です', field: 'weeklyDigest' },
          { status: 400 }
        );
      }
      settings.weeklyDigest = weeklyDigest;
    }

    settings.updatedAt = new Date().toISOString();
    NOTIFICATION_SETTINGS.set(userId, settings);

    return NextResponse.json({
      message: '通知設定を更新しました',
      settings: {
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        lawChangeAlerts: settings.lawChangeAlerts,
        deadlineReminders: settings.deadlineReminders,
        weeklyDigest: settings.weeklyDigest,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Notification settings PUT error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}
