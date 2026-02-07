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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  CirclePlus,
  CircleMinus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  sortOrder: number;
}

interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  sortOrder: number;
  createdAt: string;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  courseId: string;
  title: string;
  firstTryPoints: number;
  secondTryPoints: number;
  thirdTryPoints: number;
  fourthPlusPoints: number;
  createdAt: string;
  updatedAt: string;
  questions?: QuizQuestion[];
}

interface OptionInput {
  optionText: string;
  isCorrect: boolean;
}

interface QuizEditorProps {
  courseId: string;
}

// ─── Quiz Form Dialog ────────────────────────────────────────────────────────

function QuizFormDialog({
  open,
  onOpenChange,
  mode,
  courseId,
  defaultValues,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  courseId: string;
  defaultValues?: Quiz;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [firstTryPoints, setFirstTryPoints] = useState("10");
  const [secondTryPoints, setSecondTryPoints] = useState("7");
  const [thirdTryPoints, setThirdTryPoints] = useState("5");
  const [fourthPlusPoints, setFourthPlusPoints] = useState("2");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        setTitle(defaultValues.title);
        setFirstTryPoints(String(defaultValues.firstTryPoints));
        setSecondTryPoints(String(defaultValues.secondTryPoints));
        setThirdTryPoints(String(defaultValues.thirdTryPoints));
        setFourthPlusPoints(String(defaultValues.fourthPlusPoints));
      } else {
        setTitle("");
        setFirstTryPoints("10");
        setSecondTryPoints("7");
        setThirdTryPoints("5");
        setFourthPlusPoints("2");
      }
      setError("");
    }
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const pointsValues = [
      { key: "firstTryPoints", value: firstTryPoints },
      { key: "secondTryPoints", value: secondTryPoints },
      { key: "thirdTryPoints", value: thirdTryPoints },
      { key: "fourthPlusPoints", value: fourthPlusPoints },
    ];

    const parsedPoints: Record<string, number> = {};
    for (const pv of pointsValues) {
      const num = parseInt(pv.value, 10);
      if (isNaN(num) || num < 0) {
        setError(`${pv.key} must be a non-negative integer.`);
        return;
      }
      parsedPoints[pv.key] = num;
    }

    setLoading(true);

    try {
      const url =
        mode === "create"
          ? `/api/admin/courses/${courseId}/quizzes`
          : `/api/admin/courses/${courseId}/quizzes/${defaultValues?.id}`;

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          ...parsedPoints,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Quiz" : "Edit Quiz"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Set up a new quiz for this course."
              : "Update quiz settings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="text-destructive text-sm text-center rounded-md bg-destructive/10 p-3">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="quiz-title">Quiz Title</FieldLabel>
              <Input
                id="quiz-title"
                type="text"
                placeholder="e.g. Module 1 Assessment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>

            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="size-4 text-amber-500" />
                Points Configuration
              </div>
              <FieldDescription>
                Points awarded for the first perfect score (100%). The amount
                depends on which attempt achieves it.
              </FieldDescription>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="first-try-points">
                    1st Try Points
                  </FieldLabel>
                  <Input
                    id="first-try-points"
                    type="number"
                    min="0"
                    value={firstTryPoints}
                    onChange={(e) => setFirstTryPoints(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="second-try-points">
                    2nd Try Points
                  </FieldLabel>
                  <Input
                    id="second-try-points"
                    type="number"
                    min="0"
                    value={secondTryPoints}
                    onChange={(e) => setSecondTryPoints(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="third-try-points">
                    3rd Try Points
                  </FieldLabel>
                  <Input
                    id="third-try-points"
                    type="number"
                    min="0"
                    value={thirdTryPoints}
                    onChange={(e) => setThirdTryPoints(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="fourth-plus-points">
                    4th+ Try Points
                  </FieldLabel>
                  <Input
                    id="fourth-plus-points"
                    type="number"
                    min="0"
                    value={fourthPlusPoints}
                    onChange={(e) => setFourthPlusPoints(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Quiz"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Question Form Dialog ────────────────────────────────────────────────────

function QuestionFormDialog({
  open,
  onOpenChange,
  mode,
  courseId,
  quizId,
  defaultValues,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  courseId: string;
  quizId: string;
  defaultValues?: QuizQuestion;
  onSuccess: () => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<OptionInput[]>([
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        setQuestionText(defaultValues.questionText);
        setOptions(
          defaultValues.options.length > 0
            ? defaultValues.options.map((o) => ({
                optionText: o.optionText,
                isCorrect: o.isCorrect,
              }))
            : [
                { optionText: "", isCorrect: false },
                { optionText: "", isCorrect: false },
              ],
        );
      } else {
        setQuestionText("");
        setOptions([
          { optionText: "", isCorrect: true },
          { optionText: "", isCorrect: false },
        ]);
      }
      setError("");
    }
  }, [open, defaultValues]);

  function handleOptionTextChange(index: number, value: string) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, optionText: value } : o)),
    );
  }

  function handleOptionCorrectChange(index: number) {
    setOptions((prev) =>
      prev.map((o, i) => ({ ...o, isCorrect: i === index })),
    );
  }

  function handleAddOption() {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, { optionText: "", isCorrect: false }]);
  }

  function handleRemoveOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the correct answer, set the first one as correct
      if (!updated.some((o) => o.isCorrect) && updated.length > 0) {
        updated[0].isCorrect = true;
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    if (options.length < 2) {
      setError("At least 2 options are required.");
      return;
    }

    for (let i = 0; i < options.length; i++) {
      if (!options[i].optionText.trim()) {
        setError(`Option ${i + 1} text is required.`);
        return;
      }
    }

    if (!options.some((o) => o.isCorrect)) {
      setError("At least one option must be marked as correct.");
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "create"
          ? `/api/admin/courses/${courseId}/quizzes/${quizId}/questions`
          : `/api/admin/courses/${courseId}/quizzes/${quizId}/questions/${defaultValues?.id}`;

      const body: Record<string, unknown> = {
        questionText: questionText.trim(),
        options: options.map((o, idx) => ({
          optionText: o.optionText.trim(),
          isCorrect: o.isCorrect,
          sortOrder: idx,
        })),
      };

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Question" : "Edit Question"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Write a question and provide answer options. Mark the correct answer."
              : "Update the question text and options."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="text-destructive text-sm text-center rounded-md bg-destructive/10 p-3">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="question-text">Question</FieldLabel>
              <Textarea
                id="question-text"
                placeholder="e.g. What is the output of console.log(typeof null)?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                required
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>Answer Options</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  disabled={options.length >= 8}
                >
                  <CirclePlus className="size-4" />
                  Add Option
                </Button>
              </div>
              <FieldDescription>
                Click the circle to mark the correct answer. At least 2 options
                required.
              </FieldDescription>

              <div className="space-y-2">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      option.isCorrect
                        ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    {/* Correct toggle */}
                    <button
                      type="button"
                      onClick={() => handleOptionCorrectChange(index)}
                      className="shrink-0"
                      title={
                        option.isCorrect
                          ? "This is the correct answer"
                          : "Mark as correct answer"
                      }
                    >
                      {option.isCorrect ? (
                        <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="size-5 rounded-full border-2 border-muted-foreground/40 transition-colors hover:border-green-500" />
                      )}
                    </button>

                    {/* Option label */}
                    <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {String.fromCharCode(65 + index)}
                    </span>

                    {/* Option text */}
                    <Input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={option.optionText}
                      onChange={(e) =>
                        handleOptionTextChange(index, e.target.value)
                      }
                      className="flex-1"
                    />

                    {/* Remove option */}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 2}
                      className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Remove option"
                    >
                      <CircleMinus className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? mode === "create"
                  ? "Adding..."
                  : "Saving..."
                : mode === "create"
                  ? "Add Question"
                  : "Save Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Question Card ───────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  courseId,
  quizId,
  onEdit,
  onDeleted,
}: {
  question: QuizQuestion;
  index: number;
  courseId: string;
  quizId: string;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/quizzes/${quizId}/questions/${question.id}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        onDeleted();
      }
    } catch {
      // Silently fail
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <div className="group rounded-lg border bg-card p-4 transition-colors hover:shadow-sm">
        <div className="flex items-start gap-3">
          {/* Question number */}
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
            {index + 1}
          </span>

          {/* Question body */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap mb-3">
              {question.questionText}
            </p>

            {/* Options */}
            <div className="space-y-1.5">
              {question.options.map((option, optIdx) => (
                <div
                  key={option.id}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                    option.isCorrect
                      ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                      : "bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {option.isCorrect ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="size-3.5 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className="font-medium shrink-0">
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  <span className="truncate">{option.optionText}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onEdit}
              title="Edit question"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
              title="Delete question"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question and all its options?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Question"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Quiz Detail View (Expanded) ─────────────────────────────────────────────

function QuizDetail({
  quiz,
  courseId,
  onQuizUpdated,
}: {
  quiz: Quiz;
  courseId: string;
  onQuizUpdated: () => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Question form state
  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [questionFormMode, setQuestionFormMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingQuestion, setEditingQuestion] = useState<
    QuizQuestion | undefined
  >(undefined);

  const fetchQuizDetail = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/quizzes/${quiz.id}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load quiz details.");
        return;
      }

      setQuestions(data.quiz.questions || []);
    } catch {
      setError("Something went wrong loading quiz details.");
    } finally {
      setLoading(false);
    }
  }, [courseId, quiz.id]);

  useEffect(() => {
    fetchQuizDetail();
  }, [fetchQuizDetail]);

  function handleAddQuestion() {
    setQuestionFormMode("create");
    setEditingQuestion(undefined);
    setQuestionFormOpen(true);
  }

  function handleEditQuestion(question: QuizQuestion) {
    setQuestionFormMode("edit");
    setEditingQuestion(question);
    setQuestionFormOpen(true);
  }

  function handleQuestionSuccess() {
    fetchQuizDetail();
    onQuizUpdated();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground text-sm">
          Loading questions...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Quiz info bar */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <HelpCircle className="size-3.5" />
              {questions.length}{" "}
              {questions.length === 1 ? "question" : "questions"}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1">
              <Trophy className="size-3.5 text-amber-500" />
              Points: {quiz.firstTryPoints} / {quiz.secondTryPoints} /{" "}
              {quiz.thirdTryPoints} / {quiz.fourthPlusPoints}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddQuestion}>
            <Plus className="size-4" />
            Add Question
          </Button>
        </div>

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

        {/* Questions list */}
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10">
            <HelpCircle className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm mb-1">
              No questions yet
            </p>
            <p className="text-muted-foreground text-xs mb-4">
              Add questions and answer options to make this quiz ready for
              learners.
            </p>
            <Button onClick={handleAddQuestion} variant="outline" size="sm">
              <Plus className="size-4" />
              Add First Question
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                courseId={courseId}
                quizId={quiz.id}
                onEdit={() => handleEditQuestion(question)}
                onDeleted={handleQuestionSuccess}
              />
            ))}
          </div>
        )}
      </div>

      <QuestionFormDialog
        open={questionFormOpen}
        onOpenChange={setQuestionFormOpen}
        mode={questionFormMode}
        courseId={courseId}
        quizId={quiz.id}
        defaultValues={editingQuestion}
        onSuccess={handleQuestionSuccess}
      />
    </>
  );
}

// ─── Main Quiz Editor Component ──────────────────────────────────────────────

export function QuizEditor({ courseId }: QuizEditorProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

  // Quiz form dialog state
  const [quizFormOpen, setQuizFormOpen] = useState(false);
  const [quizFormMode, setQuizFormMode] = useState<"create" | "edit">("create");
  const [editingQuiz, setEditingQuiz] = useState<Quiz | undefined>(undefined);

  // Delete quiz dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load quizzes.");
        return;
      }

      setQuizzes(data.quizzes);
    } catch {
      setError("Something went wrong loading quizzes.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  function handleCreateQuiz() {
    setQuizFormMode("create");
    setEditingQuiz(undefined);
    setQuizFormOpen(true);
  }

  function handleEditQuiz(quiz: Quiz) {
    setQuizFormMode("edit");
    setEditingQuiz(quiz);
    setQuizFormOpen(true);
  }

  function handleDeleteClick(quiz: Quiz) {
    setDeletingQuiz(quiz);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingQuiz) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/quizzes/${deletingQuiz.id}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        if (expandedQuizId === deletingQuiz.id) {
          setExpandedQuizId(null);
        }
        await fetchQuizzes();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete quiz.");
      }
    } catch {
      setError("Failed to delete quiz. Try again.");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeletingQuiz(null);
    }
  }

  function handleFormSuccess() {
    fetchQuizzes();
  }

  function toggleExpand(quizId: string) {
    setExpandedQuizId((prev) => (prev === quizId ? null : quizId));
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading quizzes...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quizzes</CardTitle>
              <CardDescription className="mt-1">
                {quizzes.length === 0
                  ? "No quizzes yet. Create a quiz and add questions to assess learners."
                  : `${quizzes.length} ${quizzes.length === 1 ? "quiz" : "quizzes"} in this course`}
              </CardDescription>
            </div>
            <Button onClick={handleCreateQuiz} size="sm">
              <Plus className="size-4" />
              Create Quiz
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 text-destructive text-sm text-center rounded-md bg-destructive/10 p-3">
              {error}
              <button
                onClick={() => setError("")}
                className="ml-2 underline text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <HelpCircle className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm mb-1">
                No quizzes yet
              </p>
              <p className="text-muted-foreground text-xs mb-4">
                Create quizzes to test learners&apos; knowledge and award
                points.
              </p>
              <Button onClick={handleCreateQuiz} variant="outline" size="sm">
                <Plus className="size-4" />
                Create First Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => {
                const isExpanded = expandedQuizId === quiz.id;

                return (
                  <div
                    key={quiz.id}
                    className={`rounded-lg border transition-all ${
                      isExpanded ? "shadow-sm" : ""
                    }`}
                  >
                    {/* Quiz header row */}
                    <div
                      className="group flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => toggleExpand(quiz.id)}
                    >
                      {/* Expand/collapse icon */}
                      <div className="shrink-0 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </div>

                      {/* Quiz icon */}
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <HelpCircle className="size-4 text-primary" />
                      </div>

                      {/* Quiz info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {quiz.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            <Trophy className="size-3 text-amber-500" />
                            <span className="ml-1">
                              {quiz.firstTryPoints}pts
                            </span>
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Created{" "}
                          {new Date(quiz.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>

                      {/* Actions (stop click propagation) */}
                      <div
                        className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleEditQuiz(quiz)}
                          title="Edit quiz settings"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(quiz)}
                          title="Delete quiz"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <>
                        <Separator />
                        <div className="p-4">
                          <QuizDetail
                            quiz={quiz}
                            courseId={courseId}
                            onQuizUpdated={fetchQuizzes}
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz Create/Edit Dialog */}
      <QuizFormDialog
        open={quizFormOpen}
        onOpenChange={setQuizFormOpen}
        mode={quizFormMode}
        courseId={courseId}
        defaultValues={editingQuiz}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Quiz Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deletingQuiz?.title}&rdquo;
              </span>
              ? This will also delete all questions, options, and learner
              attempt data for this quiz. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Quiz"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
