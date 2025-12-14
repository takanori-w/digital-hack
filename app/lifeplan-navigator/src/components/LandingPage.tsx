'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp, Shield, Bell, PiggyBank, ChevronRight, CheckCircle, Users, Clock, Star } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/onboarding');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const features = [
    {
      icon: <PiggyBank className="w-8 h-8 text-primary-600" />,
      title: '年間平均42万円の節約機会を発見',
      description: '補助金、税制優遇、自治体キャンペーンなど、あなたが見逃している「もらえるお金」を自動でピックアップ',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary-600" />,
      title: '10秒で将来資産をシミュレーション',
      description: '現状維持・成長・急成長の3パターンで可視化。得した金額を投資に回すと30年で4倍以上に',
    },
    {
      icon: <Bell className="w-8 h-8 text-primary-600" />,
      title: '見逃し防止アラート',
      description: '申請期限・法改正・新制度を自動通知。「気づいたら締切過ぎてた」をゼロに',
    },
    {
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      title: 'みんなと比べてどう？',
      description: '同年収・同世代の貯蓄率や制度活用率と比較。自分の立ち位置を客観的に把握',
    },
  ];

  const testimonials = [
    {
      quote: '住宅ローン控除の存在を知らずに損するところでした。このアプリで年間35万円の節税に成功！',
      author: '32歳・会社員',
      rating: 5,
    },
    {
      quote: '年1回の確認で十分なのが良い。プッシュ通知で期限を忘れずに済むのが助かります',
      author: '28歳・公務員',
      rating: 5,
    },
    {
      quote: '同世代との比較で、自分がiDeCo未加入で損していることに気づきました',
      author: '35歳・フリーランス',
      rating: 4,
    },
  ];

  const trustBadges = [
    { icon: <Users className="w-5 h-5" />, text: '登録者10,000人突破', subtext: '（2024年12月時点）' },
    { icon: <Clock className="w-5 h-5" />, text: '初期設定わずか5分', subtext: '' },
    { icon: <CheckCircle className="w-5 h-5" />, text: '完全無料', subtext: '（広告なし）' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <header className="px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white text-xl font-bold">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">LifePlan Navigator</span>
          </div>
          <button
            onClick={handleLogin}
            className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            ログイン
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-12 animate-fade-in">
          {/* Social Proof Badge */}
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            <span>利用者の87%が「損していたお金」を発見</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            知らないと損する
            <br />
            <span className="text-primary-600">「もらえるお金」</span>
            <br />
            <span className="text-3xl md:text-4xl">見つけませんか？</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            年末調整、確定申告、住宅購入、出産...
            <br />
            <strong className="text-gray-800">年1〜2回の確認で、年間数十万円の節約が可能。</strong>
            <br />
            あなた専用のお得情報を、AIが自動で整理します。
          </p>

          <button
            onClick={handleStart}
            className="gradient-primary text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto group"
          >
            今すぐ無料で診断する
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-600">
                {badge.icon}
                <span className="text-sm font-medium">{badge.text}</span>
                {badge.subtext && <span className="text-xs text-gray-400">{badge.subtext}</span>}
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-4">
            ※ 簡単なアンケートに回答するだけで始められます
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-50 rounded-xl">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            見逃しやすい「もらえるお金」一覧
          </h2>
          <p className="text-center text-gray-500 mb-8">あなたは全て活用できていますか？</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-primary-50">
              <div className="text-3xl font-bold text-primary-600 mb-2">50万円</div>
              <div className="text-sm font-medium text-gray-700">出産育児一時金</div>
              <div className="text-xs text-gray-500 mt-1">申請しないと受け取れません</div>
            </div>
            <div className="p-4 rounded-xl bg-primary-50">
              <div className="text-3xl font-bold text-primary-600 mb-2">最大455万円</div>
              <div className="text-sm font-medium text-gray-700">住宅ローン減税</div>
              <div className="text-xs text-gray-500 mt-1">13年間で最大限活用</div>
            </div>
            <div className="p-4 rounded-xl bg-primary-50">
              <div className="text-3xl font-bold text-primary-600 mb-2">年14.4万円</div>
              <div className="text-sm font-medium text-gray-700">iDeCo節税効果</div>
              <div className="text-xs text-gray-500 mt-1">年収600万円の場合</div>
            </div>
            <div className="p-4 rounded-xl bg-primary-50">
              <div className="text-3xl font-bold text-primary-600 mb-2">最大30%還元</div>
              <div className="text-sm font-medium text-gray-700">ふるさと納税</div>
              <div className="text-xs text-gray-500 mt-1">年内期限に注意！</div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            利用者の声
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="text-sm text-gray-500">{testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            3ステップで簡単スタート
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">5問の診断に回答</h3>
              <p className="text-sm text-gray-600">年齢・年収・家族構成など基本情報を入力（約2分）</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">あなた専用の一覧を確認</h3>
              <p className="text-sm text-gray-600">使える制度・控除・キャンペーンを優先度付きで表示</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">通知ONで見逃し防止</h3>
              <p className="text-sm text-gray-600">期限前にリマインド。年1-2回の確認で十分</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            よくある質問
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">本当に無料ですか？</h3>
              <p className="text-gray-600 text-sm">はい、すべての機能を無料でご利用いただけます。広告表示もありません。将来的に有料のプレミアム機能を追加予定ですが、現在の機能はずっと無料です。</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">個人情報は安全ですか？</h3>
              <p className="text-gray-600 text-sm">データは暗号化して保存され、第三者への販売・提供は一切行いません。入力情報はお得情報のパーソナライズにのみ使用します。</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">どのくらいの頻度で使えばいいですか？</h3>
              <p className="text-gray-600 text-sm">年に1〜2回（年末調整・確定申告時期）の確認で十分です。重要な期限や法改正があれば、プッシュ通知でお知らせします。</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">
            今日から「損しない」生活を始めよう
          </h2>
          <p className="mb-6 opacity-90">
            5分の初期設定で、あなた専用のお得情報をお届けします
          </p>
          <button
            onClick={handleStart}
            className="bg-white text-primary-600 px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2 group"
          >
            無料で始める
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Reference */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>データ参照元: 厚生労働省、国税庁、総務省統計局、東京都</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold">L</span>
                </div>
                <span className="font-bold text-gray-900">LifePlan Navigator</span>
              </div>
              <p className="text-sm text-gray-500">
                あなたの人生設計をスマートにサポート
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">サービス</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary-600">お得情報一覧</a></li>
                <li><a href="#" className="hover:text-primary-600">シミュレーション</a></li>
                <li><a href="#" className="hover:text-primary-600">制度比較</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">サポート</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary-600">よくある質問</a></li>
                <li><a href="#" className="hover:text-primary-600">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-primary-600">使い方ガイド</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">法的情報</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary-600">利用規約</a></li>
                <li><a href="#" className="hover:text-primary-600">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-primary-600">特定商取引法に基づく表記</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-500 text-sm">
            <p>© 2024 LifePlan Navigator. All rights reserved.</p>
            <p className="mt-2">
              本サービスは情報提供を目的としており、金融商品の勧誘を目的とするものではありません。<br />
              シミュレーション結果は参考値であり、実際の運用結果を保証するものではありません。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
