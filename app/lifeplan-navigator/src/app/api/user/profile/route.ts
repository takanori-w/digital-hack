import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Mock user profiles storage (in production, use a database)
const USER_PROFILES: Map<string, UserProfileData> = new Map();

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  prefecture: string;
  city?: string;
  occupation: string;
  annualIncome?: number;
  birthDate?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  hasChildren?: boolean;
  numberOfChildren?: number;
  housingType?: 'rent' | 'own' | 'with_parents';
  updatedAt: string;
}

// Initialize with demo user
USER_PROFILES.set('demo-user-001', {
  id: 'demo-user-001',
  name: 'デモユーザー',
  email: 'demo@example.com',
  prefecture: '東京都',
  city: '港区',
  occupation: '会社員',
  annualIncome: 6000000,
  birthDate: '1990-05-15',
  maritalStatus: 'married',
  hasChildren: true,
  numberOfChildren: 1,
  housingType: 'rent',
  updatedAt: new Date().toISOString(),
});

/**
 * Validate session and get user ID
 * In production, this would verify the session token
 */
function getUserIdFromSession(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) {
    return null;
  }
  // For demo purposes, return a fixed user ID
  // In production, validate session and extract user ID
  return 'demo-user-001';
}

/**
 * Validate name input
 */
function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) return false;
  const validNameRegex = new RegExp('^[\\p{L}\\p{N}\\s\\-\']+$', 'u');
  return validNameRegex.test(trimmed);
}

/**
 * GET /api/user/profile
 * Retrieve current user's profile
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

    const profile = USER_PROFILES.get(userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません' },
        { status: 404 }
      );
    }

    // Return profile without sensitive data
    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      prefecture: profile.prefecture,
      city: profile.city,
      occupation: profile.occupation,
      annualIncome: profile.annualIncome,
      birthDate: profile.birthDate,
      maritalStatus: profile.maritalStatus,
      hasChildren: profile.hasChildren,
      numberOfChildren: profile.numberOfChildren,
      housingType: profile.housingType,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update current user's profile
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

    const profile = USER_PROFILES.get(userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'プロフィールが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, prefecture, city, occupation, annualIncome, birthDate, maritalStatus, hasChildren, numberOfChildren, housingType } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (!isValidName(name)) {
        return NextResponse.json(
          { error: '名前が無効です', field: 'name' },
          { status: 400 }
        );
      }
      profile.name = name.trim();
    }

    // Validate and update prefecture
    if (prefecture !== undefined) {
      if (typeof prefecture !== 'string' || prefecture.length > 20) {
        return NextResponse.json(
          { error: '都道府県が無効です', field: 'prefecture' },
          { status: 400 }
        );
      }
      profile.prefecture = prefecture;
    }

    // Update city
    if (city !== undefined) {
      if (typeof city !== 'string' || city.length > 50) {
        return NextResponse.json(
          { error: '市区町村が無効です', field: 'city' },
          { status: 400 }
        );
      }
      profile.city = city;
    }

    // Update occupation
    if (occupation !== undefined) {
      if (typeof occupation !== 'string' || occupation.length > 50) {
        return NextResponse.json(
          { error: '職業が無効です', field: 'occupation' },
          { status: 400 }
        );
      }
      profile.occupation = occupation;
    }

    // Update annual income
    if (annualIncome !== undefined) {
      const income = Number(annualIncome);
      if (isNaN(income) || income < 0 || income > 999999999) {
        return NextResponse.json(
          { error: '年収が無効です', field: 'annualIncome' },
          { status: 400 }
        );
      }
      profile.annualIncome = income;
    }

    // Update birth date
    if (birthDate !== undefined) {
      if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        return NextResponse.json(
          { error: '生年月日の形式が無効です', field: 'birthDate' },
          { status: 400 }
        );
      }
      profile.birthDate = birthDate;
    }

    // Update marital status
    if (maritalStatus !== undefined) {
      if (!['single', 'married', 'divorced', 'widowed'].includes(maritalStatus)) {
        return NextResponse.json(
          { error: '婚姻状況が無効です', field: 'maritalStatus' },
          { status: 400 }
        );
      }
      profile.maritalStatus = maritalStatus;
    }

    // Update hasChildren
    if (hasChildren !== undefined) {
      profile.hasChildren = Boolean(hasChildren);
    }

    // Update numberOfChildren
    if (numberOfChildren !== undefined) {
      const num = Number(numberOfChildren);
      if (isNaN(num) || num < 0 || num > 20) {
        return NextResponse.json(
          { error: '子供の人数が無効です', field: 'numberOfChildren' },
          { status: 400 }
        );
      }
      profile.numberOfChildren = num;
    }

    // Update housing type
    if (housingType !== undefined) {
      if (!['rent', 'own', 'with_parents'].includes(housingType)) {
        return NextResponse.json(
          { error: '住居形態が無効です', field: 'housingType' },
          { status: 400 }
        );
      }
      profile.housingType = housingType;
    }

    profile.updatedAt = new Date().toISOString();

    return NextResponse.json({
      message: 'プロフィールを更新しました',
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        prefecture: profile.prefecture,
        city: profile.city,
        occupation: profile.occupation,
        annualIncome: profile.annualIncome,
        birthDate: profile.birthDate,
        maritalStatus: profile.maritalStatus,
        hasChildren: profile.hasChildren,
        numberOfChildren: profile.numberOfChildren,
        housingType: profile.housingType,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}
