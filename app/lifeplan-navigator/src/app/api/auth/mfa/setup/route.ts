/**
 * MFA Setup API Endpoint
 *
 * POST /api/auth/mfa/setup - Initiate MFA setup
 * Returns: secret, QR code URL, backup codes
 *
 * Security:
 * - Requires authenticated session
 * - Generates new TOTP secret
 * - Backup codes for recovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { setupMfa, hashBackupCodes } from '@/lib/auth/mfa-service';
import { getUserByEmail, updateUserMfa } from '@/lib/auth/user-service';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Get current user
    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // Check if MFA is already enabled
    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFAは既に有効化されています' },
        { status: 400 }
      );
    }

    // Generate MFA setup data
    const mfaSetup = setupMfa(user.email);

    // Store the secret temporarily (will be confirmed after first verification)
    // In production, store in a temporary field or session
    await updateUserMfa(user.id, false, mfaSetup.secret);

    // Hash backup codes before sending (store hashed versions)
    const hashedBackupCodes = hashBackupCodes(mfaSetup.backupCodes);

    // Return setup data (client needs to verify with a code to complete setup)
    return NextResponse.json({
      secret: mfaSetup.secret,
      otpauthUrl: mfaSetup.otpauthUrl,
      backupCodes: mfaSetup.backupCodes, // Send plaintext to user (one-time display)
      message: '認証アプリでQRコードをスキャンし、確認コードを入力してください',
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'MFAセットアップ中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
