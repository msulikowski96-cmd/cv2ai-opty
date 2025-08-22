import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  premiumUntil: timestamp("premium_until"),
  basicPurchased: boolean("basic_purchased").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CV uploads table
export const cvUploads = pgTable("cv_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  originalText: text("original_text").notNull(),
  jobDescription: text("job_description"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Analysis results table
export const analysisResults = pgTable("analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cvUploadId: varchar("cv_upload_id").notNull().references(() => cvUploads.id),
  analysisType: varchar("analysis_type", { length: 50 }).notNull(),
  resultData: text("result_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment records table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  stripePaymentId: varchar("stripe_payment_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("pln"),
  planType: varchar("plan_type", { length: 20 }).notNull(), // 'basic' or 'premium'
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User usage tracking
export const usageStats = pgTable("usage_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  optimizedCvs: integer("optimized_cvs").default(0),
  atsChecks: integer("ats_checks").default(0),
  coverLetters: integer("cover_letters").default(0),
  recruiterFeedback: integer("recruiter_feedback").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCvUpload = typeof cvUploads.$inferInsert;
export type CvUpload = typeof cvUploads.$inferSelect;
export type InsertAnalysisResult = typeof analysisResults.$inferInsert;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertUsageStats = typeof usageStats.$inferInsert;
export type UsageStats = typeof usageStats.$inferSelect;

// Insert schemas
export const insertCvUploadSchema = createInsertSchema(cvUploads).omit({
  id: true,
  uploadedAt: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});
