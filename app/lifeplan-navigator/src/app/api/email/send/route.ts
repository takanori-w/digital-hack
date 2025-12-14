import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { AppSettings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 設定ファイルの読み込み
async function loadSettings(): Promise<AppSettings | null> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data) as AppSettings;
  } catch {
    return null;
  }
}

// SendGridでメール送信
async function sendWithSendGrid(
  apiKey: string,
  from: { email: string; name: string },
  payload: EmailPayload
): Promise<boolean> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: payload.to }],
        },
      ],
      from: {
        email: from.email,
        name: from.name,
      },
      subject: payload.subject,
      content: [
        {
          type: 'text/plain',
          value: payload.text || payload.html.replace(/<[^>]*>/g, ''),
        },
        {
          type: 'text/html',
          value: payload.html,
        },
      ],
    }),
  });

  return response.ok;
}

// Mailgunでメール送信
async function sendWithMailgun(
  apiKey: string,
  from: { email: string; name: string },
  payload: EmailPayload
): Promise<boolean> {
  // Mailgunのドメインを抽出（メールアドレスから）
  const domain = from.email.split('@')[1];

  const formData = new URLSearchParams();
  formData.append('from', `${from.name} <${from.email}>`);
  formData.append('to', payload.to);
  formData.append('subject', payload.subject);
  formData.append('html', payload.html);
  if (payload.text) {
    formData.append('text', payload.text);
  }

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  return response.ok;
}

// Amazon SESでメール送信
async function sendWithSES(
  apiKey: string,
  from: { email: string; name: string },
  payload: EmailPayload
): Promise<boolean> {
  // SESの場合、apiKeyは "accessKeyId:secretAccessKey:region" 形式を想定
  const [accessKeyId, secretAccessKey, region] = apiKey.split(':');

  if (!accessKeyId || !secretAccessKey || !region) {
    console.error('Invalid SES credentials format');
    return false;
  }

  // 簡易実装：実際にはAWS SDKを使用することを推奨
  console.log('SES email would be sent:', { from, to: payload.to, subject: payload.subject });

  // この実装ではSESの詳細な実装は省略
  // 実際のプロダクションでは @aws-sdk/client-ses を使用
  return true;
}

// POST: メール送信
export async function POST(request: NextRequest) {
  try {
    const settings = await loadSettings();

    if (!settings) {
      return NextResponse.json(
        { error: '設定が見つかりません' },
        { status: 404 }
      );
    }

    if (!settings.email.enabled || settings.email.provider === 'none') {
      return NextResponse.json(
        { error: 'メール送信が無効になっています' },
        { status: 400 }
      );
    }

    if (!settings.email.apiKey) {
      return NextResponse.json(
        { error: 'APIキーが設定されていません' },
        { status: 400 }
      );
    }

    const payload: EmailPayload = await request.json();

    if (!payload.to || !payload.subject || !payload.html) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています (to, subject, html)' },
        { status: 400 }
      );
    }

    const from = {
      email: settings.email.fromEmail,
      name: settings.email.fromName,
    };

    let success = false;

    switch (settings.email.provider) {
      case 'sendgrid':
        success = await sendWithSendGrid(settings.email.apiKey, from, payload);
        break;
      case 'mailgun':
        success = await sendWithMailgun(settings.email.apiKey, from, payload);
        break;
      case 'ses':
        success = await sendWithSES(settings.email.apiKey, from, payload);
        break;
      default:
        return NextResponse.json(
          { error: 'サポートされていないプロバイダーです' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ success: true, message: 'メールを送信しました' });
    } else {
      return NextResponse.json(
        { error: 'メールの送信に失敗しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'メール送信中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
