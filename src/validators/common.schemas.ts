import { z } from "zod";
export const uuidParam = z.object({ id: z.string().uuid() });
export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export const refreshSchema = z.object({
  refreshToken: z.string().min(40).max(500),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z
    .string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
});
export const employeeCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  workEmail: z
    .string()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z.string().max(30).optional().nullable(),
  departmentId: z.string().uuid(),
  managerId: z.string().uuid().optional().nullable(),
  jobTitle: z.string().trim().min(1).max(100),
  joiningDate: z.string().date(),
  employmentStatus: z
    .enum(["active", "inactive", "on_leave"])
    .default("active"),
});
export const employeeUpdateSchema = employeeCreateSchema.partial();
export const ownProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: z.string().max(30).nullable().optional(),
  })
  .strict();
export const departmentSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(2000).nullable().optional(),
});
export const departmentUpdateSchema = departmentSchema.partial().strict();
export const listEmployeeQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  departmentId: z.string().uuid().optional(),
  status: z.enum(["active", "inactive", "on_leave"]).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z
    .enum(["firstName", "lastName", "workEmail", "joiningDate", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
});

export const createUserSchema = z
  .object({
    email: z
      .string()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(12).max(128),
    role: z.enum(["admin", "hr", "manager", "employee"]),
    employeeId: z.string().uuid().optional().nullable(),
  })
  .strict();
export const assignRoleSchema = z
  .object({ role: z.enum(["admin", "hr", "manager", "employee"]) })
  .strict();
