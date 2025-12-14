'use client';

import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { lawQuizItems, getRelevantQuizItems } from '@/data/quizData';
import { LawQuizItem } from '@/types';
import { useAppStore } from '@/lib/store';

interface QuizResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  potentialSavings: number;
}

interface FinancialEvaluation {
  totalPotentialSavings: number;
  missedSavings: number;
  knowledgeScore: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'at_risk';
  recommendations: string[];
}

export default function LawQuiz() {
  const { user } = useAppStore();
  const [questions, setQuestions] = useState<LawQuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [evaluation, setEvaluation] = useState<FinancialEvaluation | null>(null);

  // Initialize questions based on user profile
  useEffect(() => {
    if (user) {
      const relevantQuestions = getRelevantQuizItems({
        hasChildren: user.hasChildren,
        housingType: user.housingType,
        occupation: user.occupation,
        futurePlans: user.futurePlans || [],
        annualIncome: user.annualIncome,
        financialInfo: user.financialInfo,
      }, 5);
      setQuestions(relevantQuestions);
    } else {
      // Default questions if no user profile
      setQuestions(lawQuizItems.slice(0, 5));
    }
  }, [user]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answerIndex: number) => {
    if (showExplanation) return; // Prevent re-answering

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const newResult: QuizResult = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
      isCorrect,
      potentialSavings: currentQuestion.potentialSavings || 0,
    };

    setResults([...results, newResult]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz complete - calculate evaluation
      const allResults = [...results];
      const correctCount = allResults.filter(r => r.isCorrect).length;
      const totalQuestions = questions.length;
      const knowledgeScore = Math.round((correctCount / totalQuestions) * 100);

      const totalPotentialSavings = questions.reduce((sum, q) => sum + (q.potentialSavings || 0), 0);
      const missedSavings = allResults
        .filter(r => !r.isCorrect)
        .reduce((sum, r) => sum + r.potentialSavings, 0);

      let status: FinancialEvaluation['status'];
      let recommendations: string[] = [];

      if (knowledgeScore >= 80) {
        status = 'excellent';
        recommendations = [
          '素晴らしい！制度の理解が十分です',
          '定期的に法改正をチェックして知識を更新しましょう',
        ];
      } else if (knowledgeScore >= 60) {
        status = 'good';
        recommendations = [
          '基本的な知識はありますが、まだ改善の余地があります',
          '間違えた分野の制度について詳しく調べてみましょう',
        ];
      } else if (knowledgeScore >= 40) {
        status = 'needs_improvement';
        recommendations = [
          '制度の理解を深めることで、大きな節約が期待できます',
          'まずは基本的な税制優遇制度から学んでみましょう',
          '専門家への相談も検討してください',
        ];
      } else {
        status = 'at_risk';
        recommendations = [
          '多くの制度を活用できていない可能性があります',
          '年間で大きな損失が発生しているかもしれません',
          '税理士やファイナンシャルプランナーへの相談を強くお勧めします',
        ];
      }

      // Add specific recommendations based on wrong answers
      allResults.filter(r => !r.isCorrect).forEach(result => {
        const question = questions.find(q => q.id === result.questionId);
        if (question) {
          if (question.lawId === 'furusato') {
            recommendations.push('ふるさと納税を活用すると年間数万円の節税が可能です');
          }
          if (question.lawId === 'ideco') {
            recommendations.push('iDeCoは老後資金の準備と節税を同時に実現できます');
          }
          if (question.lawId === 'nisa') {
            recommendations.push('新NISAを活用して投資の利益を非課税にしましょう');
          }
        }
      });

      setEvaluation({
        totalPotentialSavings,
        missedSavings,
        knowledgeScore,
        status,
        recommendations: Array.from(new Set(recommendations)).slice(0, 5), // Remove duplicates, limit to 5
      });
      setQuizComplete(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setResults([]);
    setQuizComplete(false);
    setEvaluation(null);

    // Reshuffle questions
    if (user) {
      const relevantQuestions = getRelevantQuizItems({
        hasChildren: user.hasChildren,
        housingType: user.housingType,
        occupation: user.occupation,
        futurePlans: user.futurePlans || [],
        annualIncome: user.annualIncome,
        financialInfo: user.financialInfo,
      }, 5);
      setQuestions(relevantQuestions);
    }
  };

  const formatMoney = (amount: number) => {
    if (amount >= 10000) {
      return `約${Math.round(amount / 10000)}万円`;
    }
    return `${amount.toLocaleString()}円`;
  };

  const getStatusColor = (status: FinancialEvaluation['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'at_risk': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusLabel = (status: FinancialEvaluation['status']) => {
    switch (status) {
      case 'excellent': return '優秀';
      case 'good': return '良好';
      case 'needs_improvement': return '要改善';
      case 'at_risk': return '要注意';
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (quizComplete && evaluation) {
    return (
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8" />
            <h2 className="text-xl font-bold">理解度チェック結果</h2>
          </div>
          <p className="text-blue-100">あなたの制度理解度と損得評価</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Score Card */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 mb-1">正答率</p>
              <p className="text-3xl font-bold text-blue-700">{evaluation.knowledgeScore}%</p>
              <p className="text-sm text-blue-500 mt-1">
                {results.filter(r => r.isCorrect).length} / {questions.length} 問正解
              </p>
            </div>
            <div className={`rounded-lg p-4 text-center border ${getStatusColor(evaluation.status)}`}>
              <p className="text-sm mb-1">評価</p>
              <p className="text-2xl font-bold">{getStatusLabel(evaluation.status)}</p>
            </div>
          </div>

          {/* Financial Impact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              損得評価
            </h3>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">活用可能な年間節約額</p>
              <p className="text-2xl font-bold text-green-700">
                {formatMoney(evaluation.totalPotentialSavings)}
              </p>
            </div>

            {evaluation.missedSavings > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-600 mb-1">理解不足による潜在的な損失</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatMoney(evaluation.missedSavings)}/年
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      制度を正しく理解すれば、この金額を節約できる可能性があります
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              アドバイス
            </h3>
            <ul className="space-y-2">
              {evaluation.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={restartQuiz}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              もう一度チャレンジ
            </button>
            <a
              href="/benefits"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              制度を学ぶ
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      {/* Progress Bar */}
      <div className="h-2 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">理解度チェック</span>
          </div>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <div className="mb-6">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-3 ${
            currentQuestion.category === 'tax' ? 'bg-blue-100 text-blue-700' :
            currentQuestion.category === 'family' ? 'bg-pink-100 text-pink-700' :
            currentQuestion.category === 'housing' ? 'bg-green-100 text-green-700' :
            currentQuestion.category === 'labor' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {currentQuestion.category === 'tax' ? '税金' :
             currentQuestion.category === 'family' ? '家族' :
             currentQuestion.category === 'housing' ? '住宅' :
             currentQuestion.category === 'labor' ? '労働' :
             currentQuestion.category === 'social_security' ? '社会保障' :
             'その他'}
          </span>
          <p className="text-lg font-medium text-gray-900">{currentQuestion.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showResult = showExplanation;

            let buttonClass = 'w-full p-4 text-left rounded-lg border-2 transition-all ';

            if (showResult) {
              if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-50 text-green-800';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-50 text-red-800';
              } else {
                buttonClass += 'border-gray-200 bg-gray-50 text-gray-500';
              }
            } else if (isSelected) {
              buttonClass += 'border-blue-500 bg-blue-50 text-blue-800';
            } else {
              buttonClass += 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showExplanation}
                className={buttonClass}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 font-medium flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 mb-1">解説</p>
                <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                {currentQuestion.potentialSavings && currentQuestion.potentialSavings > 0 && (
                  <p className="text-sm text-green-700 mt-2 font-medium">
                    💰 この制度を活用すると年間 {formatMoney(currentQuestion.potentialSavings)} の節約が期待できます
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Button */}
        {showExplanation && (
          <button
            onClick={handleNext}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {currentIndex < questions.length - 1 ? (
              <>
                次の問題へ
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                結果を見る
                <Trophy className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
