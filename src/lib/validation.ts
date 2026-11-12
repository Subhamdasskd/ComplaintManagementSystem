import { z } from "zod";
import { CATEGORIES, PRIORITIES, ROLES, STATUSES, LEVELS } from "./constants";

const email = z
  .string()
  .trim()
  .min(3)
  .max(200)
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email address");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(200),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email,
  password: z.string().min(8, "Use at least 8 characters").max(200),
  department: z.string().trim().max(80).optional().or(z.literal("")),
});

export const createComplaintSchema = z.object({
  title: z.string().trim().min(6, "Title needs at least 6 characters").max(140),
  description: z.string().trim().min(20, "Describe the issue in at least 20 characters").max(5000),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
});

export const remarkSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(3000),
  internal: z.boolean().optional().default(false),
});

export const statusChangeSchema = z.object({
  status: z.enum(STATUSES),
  note: z.string().trim().max(2000).optional(),
});

export const assignSchema = z.object({
  assigneeId: z.string().min(1).nullable(),
  note: z.string().trim().max(1000).optional(),
});

export const escalateSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().trim().max(1000).optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password: z.string().min(8, "Use at least 8 characters").max(200),
  role: z.enum(ROLES),
  department: z.string().trim().max(80).optional().or(z.literal("")),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(ROLES).optional(),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  active: z.boolean().optional(),
  password: z.string().min(8, "Use at least 8 characters").max(200).optional(),
});

export const settingsSchema = z.object({
  sla_low_hours: z.coerce.number().int().min(1).max(720),
  sla_medium_hours: z.coerce.number().int().min(1).max(720),
  sla_high_hours: z.coerce.number().int().min(1).max(720),
  sla_critical_hours: z.coerce.number().int().min(1).max(720),
  escalation_l1_hours: z.coerce.number().int().min(1).max(720),
  escalation_l2_hours: z.coerce.number().int().min(1).max(720),
});

export const prioritySchema = z.object({
  priority: z.enum(PRIORITIES),
});

export const levelSchema = z.object({
  level: z.enum(LEVELS),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
