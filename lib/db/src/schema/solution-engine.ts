import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const solutionJobsTable = pgTable("solution_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(),
  repoName: text("repo_name").notNull(),
  status: text("status").notNull().default("preview"),
  summary: text("summary"),
  plan: text("plan"),
  generatedFiles: jsonb("generated_files").$type<Array<{ path: string; content: string }>>().notNull().default([]),
  generatedTables: jsonb("generated_tables").$type<Array<{
    name: string;
    columns: Array<{ name: string; type: string; nullable: boolean }>;
  }>>().notNull().default([]),
  liveUrl: text("live_url"),
  error: text("error"),
  progress: integer("progress").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const solutionJobLogsTable = pgTable("solution_job_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => solutionJobsTable.id, { onDelete: "cascade" }),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSolutionJobSchema = createInsertSchema(solutionJobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSolutionJobLogSchema = createInsertSchema(solutionJobLogsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSolutionJob = z.infer<typeof insertSolutionJobSchema>;
export type SolutionJob = typeof solutionJobsTable.$inferSelect;
export type SolutionJobLog = typeof solutionJobLogsTable.$inferSelect;
