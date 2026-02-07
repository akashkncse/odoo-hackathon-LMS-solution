"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Loader2,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Clock,
  Target,
  Award,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuizOptionData {
  id: string;
  optionText: string;
  sortOrder: number;
}

interface QuizQuestionData {
  id: string;
  questionText: string;
  sortOrder: number;
  options: QuizOptionData[];
}

interface QuizData {
  id: string;
  courseId: string;
  title: string;
  firstTryPoints: number;
  secondTryPoints: number;
  thirdTryPoints: number;
  fourthPlusPoints: number;
  questions: QuizQuestionData[];
}

interface AttemptResult {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionIds: string[];
}

interface AttemptResponse {
  attempt: {
    id: string;
    attemptNumber: number;
    score: number;
    pointsEarned: number;
    startedAt: string;
    completedAt: string;
  };
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    scorePercent: number;
    pointsEarned: number;
    isFirstPerfect: boolean;
  };
  results: AttemptResult[];
}

interface AttemptHistoryItem {
  id: string;
  attemptNumber: number;
  score: number;
  pointsEarned: number;
  startedAt: string;
  completedAt: string;
}

interface AttemptHistoryResponse {
  quiz: {
    id: string;
    title: string;
  };
  summary: {
    totalAttempts: number;
    bestScore: number;
    totalPointsEarned: number;
    hasPerfectScore: boolean;
  };
  attempts: AttemptHistoryItem[];
}

interface QuizRunnerProps {
  courseId: string;
  quizId: string;
  onPerfectScore?: () => void;
}

// ─── Quiz States ─────────────────────────────────────────────────────────────

type QuizState =
  | "loading"
  | "ready"
  | "taking"
  | "submitting"
  | "results"
  | "error";

// ─── Score Ring Component ────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score === 100
      ? "text-green-500"
      : score >= 70
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${color}`}>{score}%</span>
      </div>
    </div>
  );
}

// ─── Attempt History Section ─────────────────────────────────────────────────

function AttemptHistory({
  courseId,
  quizId,
}: {
  courseId: string;
  quizId: string;
}) {
  const [historyData, setHistoryData] = useState<AttemptHistoryResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(
          `/api/courses/${courseId}/quizzes/${quizId}/attempts`,
        );
        const data = await res.json();
        if (res.ok) {
          setHistoryData(data);
        }
      } catch {
        // Silently fail — history is supplementary
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [courseId, quizId]);

  if (loading) {
    return null;
  }

  if (!historyData || historyData.summary.totalAttempts === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {expanded ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <Clock className="size-4" />
        Attempt History ({historyData.summary.totalAttempts}{" "}
        {historyData.summary.totalAttempts === 1 ? "attempt" : "attempts"})
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Best Score</p>
              <p className="text-lg font-bold mt-0.5">
                {historyData.summary.bestScore}%
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Points</p>
              <p className="text-lg font-bold mt-0.5">
                {historyData.summary.totalPointsEarned}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Perfect Score</p>
              <p className="text-lg font-bold mt-0.5">
                {historyData.summary.hasPerfectScore ? (
                  <CheckCircle2 className="size-5 text-green-500 inline" />
                ) : (
                  <XCircle className="size-5 text-muted-foreground/40 inline" />
                )}
              </p>
            </div>
          </div>

          {/* Attempt list */}
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-4 gap-2 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Attempt</span>
              <span>Score</span>
              <span>Points</span>
              <span>Date</span>
            </div>
            {historyData.attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="grid grid-cols-4 gap-2 px-4 py-2.5 text-sm border-t"
              >
                <span className="font-medium">#{attempt.attemptNumber}</span>
                <span
                  className={
                    attempt.score === 100
                      ? "text-green-600 font-semibold"
                      : attempt.score >= 70
                        ? "text-amber-600"
                        : "text-red-600"
                  }
                >
                  {attempt.score}%
                </span>
                <span>
                  {attempt.pointsEarned > 0 ? (
                    <span className="flex items-center gap-1">
                      <Trophy className="size-3 text-amber-500" />+
                      {attempt.pointsEarned}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
                <span className="text-muted-foreground text-xs">
                  {attempt.completedAt
                    ? new Date(attempt.completedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Quiz Runner Component ──────────────────────────────────────────────

export function QuizRunner({
  courseId,
  quizId,
  onPerfectScore,
}: QuizRunnerProps) {
  const [state, setState] = useState<QuizState>("loading");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [error, setError] = useState("");

  // Answers: questionId -> selectedOptionId
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Results
  const [attemptResult, setAttemptResult] = useState<AttemptResponse | null>(
    null,
  );
  const [historyKey, setHistoryKey] = useState(0);

  const fetchQuiz = useCallback(async () => {
    setState("loading");
    setError("");

    try {
      const res = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load quiz.");
        setState("error");
        return;
      }

      setQuiz(data.quiz);
      setState("ready");
    } catch {
      setError("Something went wrong loading the quiz.");
      setState("error");
    }
  }, [courseId, quizId]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuiz() {
      setState("loading");
      setError("");

      try {
        const res = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Failed to load quiz.");
          setState("error");
          return;
        }

        setQuiz(data.quiz);
        setState("ready");
      } catch {
        if (!cancelled) {
          setError("Something went wrong loading the quiz.");
          setState("error");
        }
      }
    }

    loadQuiz();

    return () => {
      cancelled = true;
    };
  }, [courseId, quizId]);

  function handleStartQuiz() {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setAttemptResult(null);
    setState("taking");
  }

  function handleSelectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleNextQuestion() {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }

  function handlePrevQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }

  async function handleSubmitQuiz() {
    if (!quiz) return;

    // Validate all questions answered
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(
        `Please answer all questions. ${unanswered.length} question${unanswered.length > 1 ? "s" : ""} remaining.`,
      );
      // Navigate to first unanswered question
      const firstUnansweredIndex = quiz.questions.findIndex(
        (q) => !answers[q.id],
      );
      if (firstUnansweredIndex >= 0) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
      return;
    }

    setError("");
    setState("submitting");

    try {
      const res = await fetch(
        `/api/courses/${courseId}/quizzes/${quizId}/attempt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit quiz.");
        setState("taking");
        return;
      }

      setAttemptResult(data);
      setHistoryKey((prev) => prev + 1);
      setState("results");

      // Notify parent when learner achieves a perfect score
      if (data.summary?.scorePercent === 100 && onPerfectScore) {
        onPerfectScore();
      }
    } catch {
      setError("Something went wrong submitting the quiz.");
      setState("taking");
    }
  }

  function handleRetakeQuiz() {
    handleStartQuiz();
  }

  function handleBackToOverview() {
    setState("ready");
    setAttemptResult(null);
  }

  // ─── Loading State ───────────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading quiz...</span>
        </CardContent>
      </Card>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────

  if (state === "error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <XCircle className="size-10 text-destructive/50 mb-3" />
          <p className="text-destructive text-sm mb-4">{error}</p>
          <Button onClick={fetchQuiz} variant="outline" size="sm">
            <RotateCcw className="size-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) return null;

  // ─── Ready State (Quiz Overview) ─────────────────────────────────────────

  if (state === "ready") {
    return (
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 mb-3">
            <HelpCircle className="size-7 text-primary" />
          </div>
          <CardTitle className="text-xl">{quiz.title}</CardTitle>
          <CardDescription className="mt-1">
            Test your knowledge with this quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiz info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <HelpCircle className="size-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold">{quiz.questions.length}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Trophy className="size-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{quiz.firstTryPoints}</p>
              <p className="text-xs text-muted-foreground">Max Points</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Target className="size-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold">100%</p>
              <p className="text-xs text-muted-foreground">To Earn Points</p>
            </div>
          </div>

          {/* Points breakdown */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Award className="size-4 text-amber-500" />
              Points System
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">1st try perfect:</span>
                <span className="font-medium">{quiz.firstTryPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">2nd try perfect:</span>
                <span className="font-medium">{quiz.secondTryPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">3rd try perfect:</span>
                <span className="font-medium">{quiz.thirdTryPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">4th+ try perfect:</span>
                <span className="font-medium">{quiz.fourthPlusPoints} pts</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Points are awarded only on your first perfect score (100%).
            </p>
          </div>

          {quiz.questions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">
                This quiz has no questions yet. Check back later.
              </p>
            </div>
          ) : (
            <Button onClick={handleStartQuiz} className="w-full" size="lg">
              Start Quiz
              <ArrowRight className="size-4" />
            </Button>
          )}

          <AttemptHistory
            key={historyKey}
            courseId={courseId}
            quizId={quizId}
          />
        </CardContent>
      </Card>
    );
  }

  // ─── Taking Quiz State ───────────────────────────────────────────────────

  if (state === "taking" || state === "submitting") {
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === totalQuestions;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const selectedOptionId = answers[currentQuestion.id] || null;

    return (
      <Card>
        <CardHeader className="pb-3">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-muted-foreground">
                {answeredCount}/{totalQuestions} answered
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="text-destructive text-sm text-center rounded-md bg-destructive/10 p-3">
              {error}
              <button
                onClick={() => setError("")}
                className="ml-2 underline text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Question */}
          <div>
            <div className="flex items-start gap-3 mb-5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {currentQuestionIndex + 1}
              </span>
              <p className="text-base font-medium leading-relaxed pt-1 whitespace-pre-wrap">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2 ml-11">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = selectedOptionId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      handleSelectOption(currentQuestion.id, option.id)
                    }
                    disabled={state === "submitting"}
                    className={`w-full flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    } ${state === "submitting" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1">{option.optionText}</span>
                    {isSelected && (
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question navigation dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {quiz.questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`size-2.5 rounded-full transition-all ${
                    isCurrent
                      ? "bg-primary scale-125"
                      : isAnswered
                        ? "bg-primary/40"
                        : "bg-muted-foreground/20"
                  }`}
                  title={`Question ${idx + 1}${isAnswered ? " (answered)" : ""}`}
                />
              );
            })}
          </div>

          <Separator />

          {/* Navigation and submit */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0 || state === "submitting"}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {!isLastQuestion ? (
                <Button
                  size="sm"
                  onClick={handleNextQuestion}
                  disabled={state === "submitting"}
                >
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmitQuiz}
                  disabled={!allAnswered || state === "submitting"}
                  className={
                    allAnswered
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : ""
                  }
                >
                  {state === "submitting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Quiz
                      <CheckCircle2 className="size-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Results State ───────────────────────────────────────────────────────

  if (state === "results" && attemptResult) {
    const { summary, results } = attemptResult;
    const isPerfect = summary.scorePercent === 100;

    return (
      <div className="space-y-6">
        {/* Score Card */}
        <Card>
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-4">
              {/* Celebration for perfect score */}
              {isPerfect && (
                <div className="flex items-center justify-center gap-1 text-amber-500 animate-bounce">
                  <Sparkles className="size-5" />
                  <span className="text-sm font-semibold">Perfect Score!</span>
                  <Sparkles className="size-5" />
                </div>
              )}

              {/* Score ring */}
              <div className="flex justify-center">
                <ScoreRing score={summary.scorePercent} />
              </div>

              {/* Score text */}
              <div>
                <p className="text-lg font-semibold">
                  {summary.correctAnswers} of {summary.totalQuestions} correct
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Attempt #{attemptResult.attempt.attemptNumber}
                </p>
              </div>

              {/* Points earned */}
              {summary.pointsEarned > 0 ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-2">
                  <Trophy className="size-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    +{summary.pointsEarned} points earned!
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isPerfect
                    ? "Points were already awarded for a previous perfect score."
                    : "Score 100% to earn points."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Answers</CardTitle>
            <CardDescription>
              See which questions you got right and wrong.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.questions.map((question, qIdx) => {
              const result = results.find((r) => r.questionId === question.id);
              if (!result) return null;

              return (
                <div
                  key={question.id}
                  className={`rounded-lg border p-4 ${
                    result.isCorrect
                      ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                      : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5">
                      {result.isCorrect ? (
                        <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="size-5 text-red-500 dark:text-red-400" />
                      )}
                    </span>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      <span className="text-muted-foreground mr-1">
                        Q{qIdx + 1}.
                      </span>
                      {question.questionText}
                    </p>
                  </div>

                  {/* Options review */}
                  <div className="space-y-1.5 ml-9">
                    {question.options.map((option, optIdx) => {
                      const isSelected = result.selectedOptionId === option.id;
                      const isCorrectOption = result.correctOptionIds.includes(
                        option.id,
                      );

                      let optionStyle = "bg-white/50 dark:bg-white/5";
                      if (isCorrectOption) {
                        optionStyle =
                          "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300";
                      } else if (isSelected && !isCorrectOption) {
                        optionStyle =
                          "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 line-through";
                      }

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${optionStyle}`}
                        >
                          {isCorrectOption ? (
                            <CheckCircle2 className="size-3.5 shrink-0 text-green-600 dark:text-green-400" />
                          ) : isSelected ? (
                            <XCircle className="size-3.5 shrink-0 text-red-500 dark:text-red-400" />
                          ) : (
                            <div className="size-3.5 shrink-0 rounded-full border border-muted-foreground/30" />
                          )}
                          <span className="font-medium shrink-0">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="flex-1">{option.optionText}</span>
                          {isSelected && (
                            <Badge
                              variant={
                                isCorrectOption ? "default" : "destructive"
                              }
                              className="text-[10px] shrink-0"
                            >
                              Your answer
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToOverview}>
            Back to Overview
          </Button>
          <Button onClick={handleRetakeQuiz}>
            <RotateCcw className="size-4" />
            Retake Quiz
          </Button>
        </div>

        {/* Attempt history */}
        <AttemptHistory key={historyKey} courseId={courseId} quizId={quizId} />
      </div>
    );
  }

  return null;
}
