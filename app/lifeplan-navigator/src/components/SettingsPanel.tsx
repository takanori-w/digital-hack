'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { AnimalIcons, animalDescriptions } from './AnimalIcons';
import { AnimalType, FuturePlan, HousingType } from '@/types';
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Home,
  Users,
  Calendar,
  Shield,
  Key,
  Smartphone,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Fingerprint,
  History,
  Save,
} from 'lucide-react';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'account';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const OCCUPATIONS = [
  '会社員（正社員）', '会社員（契約社員）', '公務員', '自営業・フリーランス',
  '会社役員・経営者', 'パート・アルバイト', '専業主婦・主夫', '学生', '無職・求職中', 'その他',
];

const FUTURE_PLANS: { id: FuturePlan; label: string; icon: string }[] = [
  { id: 'side_job', label: '副業を始める', icon: '💼' },
  { id: 'job_change', label: '転職する', icon: '🔄' },
  { id: 'housing_purchase', label: '住宅を購入する', icon: '🏠' },
  { id: 'inheritance', label: '相続の予定がある', icon: '📜' },
  { id: 'marriage', label: '結婚する', icon: '💍' },
  { id: 'childbirth', label: '出産予定がある', icon: '👶' },
  { id: 'child_education', label: '子供の進学がある', icon: '🎓' },
  { id: 'retirement', label: '退職する', icon: '🏖️' },
  { id: 'startup', label: '起業する', icon: '🚀' },
  { id: 'investment', label: '投資を始める', icon: '📈' },
  { id: 'none', label: '特にない', icon: '✨' },
];

const HOUSING_TYPES: { value: HousingType; label: string }[] = [
  { value: 'rent', label: '賃貸' },
  { value: 'own', label: '持ち家' },
  { value: 'with_parents', label: '実家' },
  { value: 'company_housing', label: '社宅' },
  { value: 'other', label: 'その他' },
];

export default function SettingsPanel() {
  const {
    user,
    updateUser,
    isAuthenticated,
    logout,
    setPassword,
    securitySettings,
    updateSecuritySettings,
    notificationSettings,
    updateNotificationSettings,
    resetAllData,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [editMode, setEditMode] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordError, setPasswordError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile edit state
  const [profileEdit, setProfileEdit] = useState({
    name: user?.name || '',
    email: user?.email || '',
    prefecture: user?.prefecture || '東京都',
    residencePrefecture: user?.residencePrefecture || user?.prefecture || '東京都',
    workPrefecture: user?.workPrefecture || user?.prefecture || '東京都',
    city: user?.city || '',
    occupation: user?.occupation || '',
    annualIncome: user?.annualIncome || 4000000,
    housingType: user?.housingType || 'rent',
    futurePlans: user?.futurePlans || [],
    favoriteAnimal: user?.favoriteAnimal || 'dog',
    // 家族情報
    householdSize: user?.householdSize || 1,
    maritalStatus: user?.maritalStatus || 'single',
    hasChildren: user?.hasChildren || false,
    numberOfChildren: user?.numberOfChildren || 0,
    childrenAges: user?.childrenAges || [],
    // 生年月日・性別
    birthDate: user?.birthDate || '',
    gender: user?.gender || 'other',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(amount);
  };

  const handleSaveProfile = () => {
    updateUser({
      name: profileEdit.name,
      email: profileEdit.email,
      prefecture: profileEdit.residencePrefecture, // 後方互換性のため在住都道府県と同期
      residencePrefecture: profileEdit.residencePrefecture,
      workPrefecture: profileEdit.workPrefecture,
      city: profileEdit.city,
      occupation: profileEdit.occupation,
      annualIncome: profileEdit.annualIncome,
      housingType: profileEdit.housingType as HousingType,
      futurePlans: profileEdit.futurePlans,
      favoriteAnimal: profileEdit.favoriteAnimal as AnimalType,
      // 家族情報
      householdSize: profileEdit.householdSize,
      maritalStatus: profileEdit.maritalStatus as 'single' | 'married' | 'divorced' | 'widowed',
      hasChildren: profileEdit.hasChildren,
      numberOfChildren: profileEdit.numberOfChildren,
      childrenAges: profileEdit.childrenAges,
      // 生年月日・性別
      birthDate: profileEdit.birthDate,
      gender: profileEdit.gender as 'male' | 'female' | 'other',
    });
    setEditMode(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      setPasswordError('新しいパスワードが一致しません');
      return;
    }
    if (passwords.new.length < 8) {
      setPasswordError('パスワードは8文字以上にしてください');
      return;
    }
    setPassword(passwords.new);
    updateSecuritySettings({ lastPasswordChange: new Date().toISOString() });
    setShowPasswordChange(false);
    setPasswords({ current: '', new: '', confirm: '' });
    setPasswordError('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const toggleFuturePlan = (planId: FuturePlan) => {
    const currentPlans = profileEdit.futurePlans;
    if (planId === 'none') {
      setProfileEdit({ ...profileEdit, futurePlans: ['none'] });
      return;
    }
    const plansWithoutNone = currentPlans.filter(p => p !== 'none');
    const newPlans = plansWithoutNone.includes(planId)
      ? plansWithoutNone.filter(p => p !== planId)
      : [...plansWithoutNone, planId];
    setProfileEdit({ ...profileEdit, futurePlans: newPlans });
  };

  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: User },
    { id: 'security', label: 'セキュリティ', icon: Shield },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'account', label: 'アカウント', icon: Key },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          設定を保存しました
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Animal Partner */}
          {user?.favoriteAnimal && (
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4">あなたのパートナー</h3>
              <div className="flex items-center gap-4">
                {(() => {
                  const animal = editMode ? profileEdit.favoriteAnimal : user.favoriteAnimal;
                  const Icon = AnimalIcons[animal as AnimalType];
                  const desc = animalDescriptions[animal as AnimalType];
                  return (
                    <>
                      <div className="w-20 h-20 rounded-full bg-white p-2 shadow-md">
                        <Icon className="w-full h-full" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{desc.emoji} {desc.name}</p>
                        <p className="text-gray-600">特性: {desc.trait}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {editMode && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {(Object.keys(AnimalIcons) as AnimalType[]).map((animal) => {
                    const Icon = AnimalIcons[animal];
                    const desc = animalDescriptions[animal];
                    return (
                      <button
                        key={animal}
                        onClick={() => setProfileEdit({ ...profileEdit, favoriteAnimal: animal })}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          profileEdit.favoriteAnimal === animal
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-8 h-8 mx-auto" />
                        <p className="text-xs text-center mt-1">{desc.name}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">基本情報</h3>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  編集
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1 text-gray-600 hover:text-gray-900 text-sm"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              {/* Name */}
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">お名前</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={profileEdit.name}
                      onChange={(e) => setProfileEdit({ ...profileEdit, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">メールアドレス</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={profileEdit.email}
                      onChange={(e) => setProfileEdit({ ...profileEdit, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.email}</p>
                  )}
                </div>
              </div>

              {/* Location - Residence */}
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">在住都道府県</label>
                  {editMode ? (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={profileEdit.residencePrefecture}
                        onChange={(e) => setProfileEdit({ ...profileEdit, residencePrefecture: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {PREFECTURES.map((pref) => (
                          <option key={pref} value={pref}>{pref}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="市区町村"
                        value={profileEdit.city}
                        onChange={(e) => setProfileEdit({ ...profileEdit, city: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{user?.residencePrefecture || user?.prefecture} {user?.city}</p>
                  )}
                </div>
              </div>

              {/* Location - Work */}
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">勤務先都道府県</label>
                  {editMode ? (
                    <select
                      value={profileEdit.workPrefecture}
                      onChange={(e) => setProfileEdit({ ...profileEdit, workPrefecture: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {PREFECTURES.map((pref) => (
                        <option key={pref} value={pref}>{pref}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{user?.workPrefecture || user?.prefecture || '未設定'}</p>
                  )}
                </div>
              </div>

              {/* Occupation */}
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">ご職業</label>
                  {editMode ? (
                    <select
                      value={profileEdit.occupation}
                      onChange={(e) => setProfileEdit({ ...profileEdit, occupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {OCCUPATIONS.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{user?.occupation}</p>
                  )}
                </div>
              </div>

              {/* Income */}
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 text-gray-400 text-center">¥</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">年収</label>
                  {editMode ? (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="30000000"
                        step="500000"
                        value={profileEdit.annualIncome}
                        onChange={(e) => setProfileEdit({ ...profileEdit, annualIncome: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-600">{formatCurrency(profileEdit.annualIncome)}</p>
                    </div>
                  ) : (
                    <p className="text-gray-900">{formatCurrency(user?.annualIncome || 0)}</p>
                  )}
                </div>
              </div>

              {/* Housing Type */}
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">住居形態</label>
                  {editMode ? (
                    <div className="flex flex-wrap gap-2">
                      {HOUSING_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setProfileEdit({ ...profileEdit, housingType: type.value })}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            profileEdit.housingType === type.value
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900">
                      {HOUSING_TYPES.find(t => t.value === user?.housingType)?.label || '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Family - Household Size */}
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">世帯人数</label>
                  {editMode ? (
                    <select
                      value={profileEdit.householdSize}
                      onChange={(e) => setProfileEdit({ ...profileEdit, householdSize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>{num}人</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{user?.householdSize}人</p>
                  )}
                </div>
              </div>

              {/* Family - Marital Status */}
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">婚姻状況</label>
                  {editMode ? (
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: 'single' as const, label: '未婚' },
                        { value: 'married' as const, label: '既婚' },
                        { value: 'divorced' as const, label: '離婚' },
                        { value: 'widowed' as const, label: '死別' },
                      ]).map((status) => (
                        <button
                          key={status.value}
                          onClick={() => setProfileEdit({ ...profileEdit, maritalStatus: status.value })}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            profileEdit.maritalStatus === status.value
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900">
                      {{
                        single: '未婚',
                        married: '既婚',
                        divorced: '離婚',
                        widowed: '死別',
                      }[user?.maritalStatus || 'single'] || '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Family - Children */}
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">お子さまの有無・人数</label>
                  {editMode ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={profileEdit.hasChildren}
                            onChange={(e) => setProfileEdit({
                              ...profileEdit,
                              hasChildren: e.target.checked,
                              numberOfChildren: e.target.checked ? (profileEdit.numberOfChildren || 1) : 0,
                              childrenAges: e.target.checked ? profileEdit.childrenAges : [],
                            })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm">子供あり</span>
                        </label>
                      </div>
                      {profileEdit.hasChildren && (
                        <div className="ml-6 space-y-2">
                          <select
                            value={profileEdit.numberOfChildren}
                            onChange={(e) => {
                              const num = parseInt(e.target.value);
                              const currentAges = profileEdit.childrenAges || [];
                              const newAges = [...currentAges];
                              while (newAges.length < num) newAges.push(0);
                              while (newAges.length > num) newAges.pop();
                              setProfileEdit({
                                ...profileEdit,
                                numberOfChildren: num,
                                childrenAges: newAges,
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option key={num} value={num}>{num}人</option>
                            ))}
                          </select>
                          <div className="flex flex-wrap gap-2">
                            {(profileEdit.childrenAges || []).map((age, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">{idx + 1}人目:</span>
                                <select
                                  value={age}
                                  onChange={(e) => {
                                    const newAges = [...profileEdit.childrenAges];
                                    newAges[idx] = parseInt(e.target.value);
                                    setProfileEdit({ ...profileEdit, childrenAges: newAges });
                                  }}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  {Array.from({ length: 30 }, (_, i) => (
                                    <option key={i} value={i}>{i}歳</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">
                      {user?.hasChildren
                        ? `${user?.numberOfChildren}人 (${(user?.childrenAges || []).map(a => `${a}歳`).join(', ')})`
                        : 'なし'}
                    </p>
                  )}
                </div>
              </div>

              {/* Birth Date */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">生年月日</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={profileEdit.birthDate}
                      onChange={(e) => setProfileEdit({ ...profileEdit, birthDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ja-JP') : '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">性別</label>
                  {editMode ? (
                    <div className="flex gap-2">
                      {([
                        { value: 'male' as const, label: '男性' },
                        { value: 'female' as const, label: '女性' },
                        { value: 'other' as const, label: 'その他' },
                      ]).map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setProfileEdit({ ...profileEdit, gender: g.value })}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            profileEdit.gender === g.value
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900">
                      {{ male: '男性', female: '女性', other: 'その他' }[user?.gender || 'other'] || '-'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Future Plans */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              今後の予定
            </h3>
            {editMode ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FUTURE_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => toggleFuturePlan(plan.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      profileEdit.futurePlans.includes(plan.id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{plan.icon}</span>
                    <span className="text-sm block mt-1">{plan.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(user?.futurePlans || []).map((plan) => {
                  const info = FUTURE_PLANS.find(p => p.id === plan);
                  return info ? (
                    <span
                      key={plan}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {info.icon} {info.label}
                    </span>
                  ) : null;
                })}
                {(!user?.futurePlans || user.futurePlans.length === 0) && (
                  <span className="text-gray-500">設定されていません</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Score */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">セキュリティスコア</h3>
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
                securitySettings.mfaEnabled && securitySettings.passkeyEnabled
                  ? 'bg-green-100 text-green-600'
                  : securitySettings.mfaEnabled || securitySettings.passkeyEnabled
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {securitySettings.mfaEnabled && securitySettings.passkeyEnabled ? 100 : securitySettings.mfaEnabled || securitySettings.passkeyEnabled ? 60 : 30}%
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {securitySettings.mfaEnabled && securitySettings.passkeyEnabled
                    ? '優秀なセキュリティ状態です'
                    : 'セキュリティを強化してください'}
                </p>
                <p className="text-sm text-gray-500">
                  MFAとパスキーを有効にすることで、アカウントを保護できます
                </p>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">パスワード</h3>
                  <p className="text-sm text-gray-500">
                    {securitySettings.lastPasswordChange
                      ? `最終変更: ${new Date(securitySettings.lastPasswordChange).toLocaleDateString('ja-JP')}`
                      : '未設定'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showPasswordChange ? 'キャンセル' : '変更'}
              </button>
            </div>

            {showPasswordChange && (
              <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded-lg">
                {passwordError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">現在のパスワード</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">新しいパスワード</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">8文字以上、大文字・小文字・数字を含む</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">パスワード確認</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handlePasswordChange}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  パスワードを変更
                </button>
              </div>
            )}
          </div>

          {/* MFA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">多要素認証 (MFA)</h3>
                  <p className="text-sm text-gray-500">
                    認証アプリを使用してログインを保護
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {securitySettings.mfaEnabled ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    有効
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <X className="w-3 h-3" />
                    無効
                  </span>
                )}
                <button
                  onClick={() => updateSecuritySettings({
                    mfaEnabled: !securitySettings.mfaEnabled,
                    mfaMethod: !securitySettings.mfaEnabled ? 'totp' : null,
                    mfaVerified: !securitySettings.mfaEnabled,
                  })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    securitySettings.mfaEnabled
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {securitySettings.mfaEnabled ? '無効にする' : '設定する'}
                </button>
              </div>
            </div>
            {!securitySettings.mfaEnabled && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  <strong>推奨:</strong> MFAを有効にしてアカウントのセキュリティを強化してください。
                </p>
              </div>
            )}
          </div>

          {/* Passkey */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">パスキー</h3>
                  <p className="text-sm text-gray-500">
                    生体認証でパスワードなしでログイン
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {securitySettings.passkeyRegistered ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    登録済み
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    未登録
                  </span>
                )}
                <button
                  onClick={() => updateSecuritySettings({
                    passkeyEnabled: !securitySettings.passkeyEnabled,
                    passkeyRegistered: !securitySettings.passkeyEnabled,
                  })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    securitySettings.passkeyRegistered
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {securitySettings.passkeyRegistered ? '削除する' : '登録する'}
                </button>
              </div>
            </div>
            {!securitySettings.passkeyRegistered && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  パスキーを使用すると、指紋認証や顔認証でより安全にログインできます。
                </p>
              </div>
            )}
          </div>

          {/* Login History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <History className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">ログイン履歴</h3>
            </div>
            {securitySettings.loginHistory.length > 0 ? (
              <div className="space-y-2">
                {securitySettings.loginHistory.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.location}</p>
                      <p className="text-xs text-gray-500">{entry.ipAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(entry.timestamp).toLocaleString('ja-JP')}
                      </p>
                      {entry.success ? (
                        <span className="text-xs text-green-600">成功</span>
                      ) : (
                        <span className="text-xs text-red-600">失敗</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">ログイン履歴はありません</p>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">通知設定</h3>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'メール通知', desc: '重要なお知らせをメールで受け取る' },
                { key: 'pushNotifications', label: 'プッシュ通知', desc: 'ブラウザ通知を受け取る' },
                { key: 'lawChangeAlerts', label: '法改正アラート', desc: '関連する法改正の通知' },
                { key: 'deadlineReminders', label: '締め切りリマインド', desc: '申請期限の事前通知' },
                { key: 'weeklyDigest', label: '週次ダイジェスト', desc: '週1回のまとめメール' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => updateNotificationSettings({
                      [item.key]: !notificationSettings[item.key as keyof typeof notificationSettings],
                    })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notificationSettings[item.key as keyof typeof notificationSettings]
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notificationSettings[item.key as keyof typeof notificationSettings]
                          ? 'translate-x-7'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Login Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">アカウント状態</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-700">
                  {isAuthenticated ? 'ログイン中' : '未ログイン'}
                </span>
              </div>
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">アカウント情報</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">メールアドレス</span>
                <span className="text-gray-900">{user?.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">登録日</span>
                <span className="text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">最終更新</span>
                <span className="text-gray-900">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('ja-JP') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              危険な操作
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">データをリセット</p>
                  <p className="text-sm text-gray-500">すべての設定とデータを削除します</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('本当にすべてのデータをリセットしますか？この操作は取り消せません。')) {
                      resetAllData();
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  リセット
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
