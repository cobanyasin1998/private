import { z } from "zod";

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12).max(200),
  confirmPassword: z.string().min(1).max(200),
}).superRefine((value, context) => {
  if (value.newPassword !== value.confirmPassword) context.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Yeni şifreler eşleşmiyor." });
  if (value.currentPassword === value.newPassword) context.addIssue({ code: z.ZodIssueCode.custom, path: ["newPassword"], message: "Yeni şifre mevcut şifreyle aynı olamaz." });
});
