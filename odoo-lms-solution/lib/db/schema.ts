import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  integer,
  text,
  decimal,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["superadmin", "instructor", "learner"]);
export const visibilityEnum = pgEnum("visibility", ["everyone", "signed_in"]);
export const accessRuleEnum = pgEnum("access_rule", [
  "open",
  "invitation",
  "payment",
]);
export const lessonTypeEnum = pgEnum("lesson_type", [
  "video",
  "document",
  "image",
  "quiz",
]);
export const attachmentTypeEnum = pgEnum("attachment_type", ["file", "link"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "not_started",
  "in_progress",
  "completed",
]);
export const lessonProgressStatusEnum = pgEnum("lesson_progress_status", [
  "not_started",
  "in_progress",
  "completed",
]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("learner"),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  visibility: visibilityEnum("visibility").notNull().default("everyone"),
  accessRule: accessRuleEnum("access_rule").notNull().default("open"),
  price: decimal("price", { precision: 10, scale: 2 }),
  published: boolean("published").notNull().default(false),
  responsibleId: uuid("responsible_id")
    .notNull()
    .references(() => users.id),
  viewsCount: integer("views_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const courseTags = pgTable(
  "course_tags",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.courseId, table.tagId] })],
);

export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  type: lessonTypeEnum("type").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  responsibleId: uuid("responsible_id").references(() => users.id),
  quizId: uuid("quiz_id").references(() => quizzes.id),
  videoUrl: varchar("video_url", { length: 500 }),
  videoDuration: integer("video_duration"),
  fileUrl: varchar("file_url", { length: 500 }),
  allowDownload: boolean("allow_download").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonAttachments = pgTable("lesson_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  type: attachmentTypeEnum("type").notNull(),
  fileUrl: varchar("file_url", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  firstTryPoints: integer("first_try_points").notNull().default(10),
  secondTryPoints: integer("second_try_points").notNull().default(7),
  thirdTryPoints: integer("third_try_points").notNull().default(5),
  fourthPlusPoints: integer("fourth_plus_points").notNull().default(2),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizOptions = pgTable("quiz_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => quizQuestions.id, { onDelete: "cascade" }),
  optionText: varchar("option_text", { length: 500 }).notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});
export const enrollments = pgTable("enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  status: enrollmentStatusEnum("status").notNull().default("not_started"),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  status: lessonProgressStatusEnum("status").notNull().default("not_started"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull(),
  score: integer("score").notNull().default(0),
  pointsEarned: integer("points_earned").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const quizResponses = pgTable("quiz_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => quizAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => quizQuestions.id),
  selectedOptionId: uuid("selected_option_id")
    .notNull()
    .references(() => quizOptions.id),
  isCorrect: boolean("is_correct").notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  reviewText: text("review_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseInvitations = pgTable("course_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => users.id),
  status: invitationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const badgeLevels = pgTable("badge_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  minPoints: integer("min_points").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  certificateNumber: varchar("certificate_number", { length: 50 })
    .notNull()
    .unique(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  platformName: varchar("platform_name", { length: 100 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  heroImageUrl: varchar("hero_image_url", { length: 500 }),
  featuredImageUrl: varchar("featured_image_url", { length: 500 }),
  currency: varchar("currency", { length: 10 }).default("INR"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const discussionThreads = pgTable("discussion_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isPinned: boolean("is_pinned").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const discussionReplies = pgTable("discussion_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => discussionThreads.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }).notNull(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  razorpaySignature: varchar("razorpay_signature", { length: 500 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
