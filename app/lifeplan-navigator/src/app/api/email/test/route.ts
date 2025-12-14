import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { AppSettings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// 設定ファイルの読み込み
async function loadSettings(): Promise<AppSettings | null> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data) as AppSettings;
  } catch {
    return null;
  }
}

// POST: テストメール送信
export async function POST(request: NextRequest) {
  try {
    const settings = await loadSettings();
    const body = await request.json();
    const testEmail = body.to;

    if (!testEmail) {
      return NextResponse.json(
        { error: '送信先メールアドレスが指定されていません' },
        { status: 400 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: '設定が見つかりません' },
        { status: 404 }
      );
    }

    if (settings.email.provider === 'none' || !settings.email.apiKey) {
      return NextResponse.json(
        { error: 'メール設定が完了していません' },
        { status: 400 }
      );
    }

    // テストメールのコンテンツ
    const testContent = {
      to: testEmail,
      subject: '【LifePlan Navigator】メール設定のテスト',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">メール設定のテスト</h1>
          <p>このメールは LifePlan Navigator のメール設定テストです。</p>
          <p>このメールが届いていれば、メール設定は正常に完了しています。</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            設定内容:<br>
            プロバイダー: ${settings.email.provider}<br>
            送信元: ${settings.email.fromName} &lt;${settings.email.fromEmail}&gt;
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            このメールは LifePlan Navigator から自動送信されています。
          </p>
        </div>
      `,
      text: `メール設定のテスト\n\nこのメールは LifePlan Navigator のメール設定テストです。\nこのメールが届いていれば、メール設定は正常に完了しています。\n\n設定内容:\nプロバイダー: ${settings.email.provider}\n送信元: ${settings.email.fromName} <${settings.email.fromEmail}>`,
    };

    // 実際のメール送信APIを呼び出し
    const baseUrl = request.nextUrl.origin;
    const sendResponse = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testContent),
    });

    if (sendResponse.ok) {
      return NextResponse.json({
        success: true,
        message: `テストメールを ${testEmail} に送信しました`,
      });
    } else {
      const error = await sendResponse.json();
      return NextResponse.json(
        { error: error.error || 'テストメールの送信に失敗しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'テストメール送信中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
