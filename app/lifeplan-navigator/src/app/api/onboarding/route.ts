import { NextRequest, NextResponse } from 'next/server';
import {
  UserOnboardingProfile,
  EmploymentType,
  ResidenceType,
  HouseholdType,
  PlannedEvent,
  Child
} from '@/types/onboarding';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Mock onboarding storage (in production, use a database)
const ONBOARDING_PROFILES: Map<string, UserOnboardingProfile & { userId: string }> = new Map();

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
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (!email) return true; // Empty is OK (optional)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate employment type
 */
function isValidEmploymentType(value: unknown): value is EmploymentType {
  return Object.values(EmploymentType).includes(value as EmploymentType);
}

/**
 * Validate residence type
 */
function isValidResidenceType(value: unknown): value is ResidenceType {
  return Object.values(ResidenceType).includes(value as ResidenceType);
}

/**
 * Validate household type
 */
function isValidHouseholdType(value: unknown): value is HouseholdType {
  return Object.values(HouseholdType).includes(value as HouseholdType);
}

/**
 * Validate planned event
 */
function isValidPlannedEvent(value: unknown): value is PlannedEvent {
  return Object.values(PlannedEvent).includes(value as PlannedEvent);
}

/**
 * Validate child object
 */
function isValidChild(child: unknown): child is Child {
  if (typeof child !== 'object' || child === null) return false;
  const c = child as Record<string, unknown>;
  return (
    typeof c.age === 'number' &&
    c.age >= 0 &&
    c.age <= 25 &&
    typeof c.isCohabiting === 'boolean'
  );
}

/**
 * GET /api/onboarding
 * Retrieve current user's onboarding profile
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

    const profile = ONBOARDING_PROFILES.get(userId);

    if (!profile) {
      return NextResponse.json(
        {
          exists: false,
          message: 'オンボーディングが未完了です'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      exists: true,
      profile: {
        age: profile.age,
        employmentType: profile.employmentType,
        residenceType: profile.residenceType,
        region: profile.region,
        householdType: profile.householdType,
        hasSpouse: profile.hasSpouse,
        children: profile.children,
        plannedEvents: profile.plannedEvents,
        email: profile.email,
        emailNotificationEnabled: profile.emailNotificationEnabled,
        onboardingCompleted: profile.onboardingCompleted,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }
    });
  } catch (error) {
    console.error('Onboarding GET error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding
 * Create or update onboarding profile
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const {
      age,
      employmentType,
      residenceType,
      region,
      householdType,
      hasSpouse,
      children,
      plannedEvents,
      email,
      emailNotificationEnabled,
      onboardingCompleted
    } = body;

    // Validate age
    if (age !== null && age !== undefined) {
      if (typeof age !== 'number' || age < 18 || age > 100) {
        return NextResponse.json(
          { error: '年齢は18歳以上100歳以下で入力してください', field: 'age' },
          { status: 400 }
        );
      }
    }

    // Validate employment type
    if (employmentType !== null && employmentType !== undefined) {
      if (!isValidEmploymentType(employmentType)) {
        return NextResponse.json(
          { error: '無効な働き方が選択されています', field: 'employmentType' },
          { status: 400 }
        );
      }
    }

    // Validate residence type
    if (residenceType !== null && residenceType !== undefined) {
      if (!isValidResidenceType(residenceType)) {
        return NextResponse.json(
          { error: '無効な住まい状況が選択されています', field: 'residenceType' },
          { status: 400 }
        );
      }
    }

    // Validate region
    if (region !== null && region !== undefined) {
      if (typeof region !== 'string' || region.length > 10) {
        return NextResponse.json(
          { error: '無効な地域が入力されています', field: 'region' },
          { status: 400 }
        );
      }
    }

    // Validate household type
    if (householdType !== null && householdType !== undefined) {
      if (!isValidHouseholdType(householdType)) {
        return NextResponse.json(
          { error: '無効な世帯構成が選択されています', field: 'householdType' },
          { status: 400 }
        );
      }
    }

    // Validate children array
    if (children !== undefined) {
      if (!Array.isArray(children)) {
        return NextResponse.json(
          { error: '子供の情報が無効です', field: 'children' },
          { status: 400 }
        );
      }
      if (children.length > 10) {
        return NextResponse.json(
          { error: '子供の人数は10人以下にしてください', field: 'children' },
          { status: 400 }
        );
      }
      for (const child of children) {
        if (!isValidChild(child)) {
          return NextResponse.json(
            { error: '子供の情報が無効です', field: 'children' },
            { status: 400 }
          );
        }
      }
    }

    // Validate planned events
    if (plannedEvents !== undefined) {
      if (!Array.isArray(plannedEvents)) {
        return NextResponse.json(
          { error: '予定の情報が無効です', field: 'plannedEvents' },
          { status: 400 }
        );
      }
      for (const event of plannedEvents) {
        if (!isValidPlannedEvent(event)) {
          return NextResponse.json(
            { error: '無効な予定が選択されています', field: 'plannedEvents' },
            { status: 400 }
          );
        }
      }
    }

    // Validate email
    if (email !== undefined && email !== null && email !== '') {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が無効です', field: 'email' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const existingProfile = ONBOARDING_PROFILES.get(userId);

    const newProfile = {
      userId,
      age: age ?? null,
      employmentType: employmentType ?? null,
      residenceType: residenceType ?? null,
      region: region ?? null,
      householdType: householdType ?? null,
      hasSpouse: hasSpouse ?? false,
      children: children ?? [],
      plannedEvents: plannedEvents ?? [],
      email: email ?? '',
      emailNotificationEnabled: emailNotificationEnabled ?? false,
      onboardingCompleted: onboardingCompleted ?? false,
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now,
    };

    ONBOARDING_PROFILES.set(userId, newProfile);

    return NextResponse.json({
      message: 'プロフィールを保存しました',
      profile: newProfile,
    });
  } catch (error) {
    console.error('Onboarding POST error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding
 * Partially update onboarding profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const existingProfile = ONBOARDING_PROFILES.get(userId);

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません。先にPOSTで作成してください。' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Partial<UserOnboardingProfile> = {};

    // Process each field if provided
    if ('age' in body) {
      if (body.age !== null && (typeof body.age !== 'number' || body.age < 18 || body.age > 100)) {
        return NextResponse.json(
          { error: '年齢は18歳以上100歳以下で入力してください', field: 'age' },
          { status: 400 }
        );
      }
      updates.age = body.age;
    }

    if ('employmentType' in body) {
      if (body.employmentType !== null && !isValidEmploymentType(body.employmentType)) {
        return NextResponse.json(
          { error: '無効な働き方が選択されています', field: 'employmentType' },
          { status: 400 }
        );
      }
      updates.employmentType = body.employmentType;
    }

    if ('email' in body) {
      if (body.email && !isValidEmail(body.email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が無効です', field: 'email' },
          { status: 400 }
        );
      }
      updates.email = body.email ?? '';
    }

    if ('emailNotificationEnabled' in body) {
      updates.emailNotificationEnabled = Boolean(body.emailNotificationEnabled);
    }

    if ('onboardingCompleted' in body) {
      updates.onboardingCompleted = Boolean(body.onboardingCompleted);
    }

    const updatedProfile = {
      ...existingProfile,
      ...updates,
      updatedAt: new Date(),
    };

    ONBOARDING_PROFILES.set(userId, updatedProfile);

    return NextResponse.json({
      message: 'プロフィールを更新しました',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Onboarding PATCH error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}
