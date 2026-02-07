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

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("learner"),
  avatarUrl: varchar("avatar_url", { length: 500 }),
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
  quizId: uuid("quiz_id"),
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
