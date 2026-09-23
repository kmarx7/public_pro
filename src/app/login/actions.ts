"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string };

const credentials = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  next: z.string().startsWith("/").refine((value) => !value.startsWith("//")).default("/"),
});

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || "/",
  });
  if (!parsed.success) return { error: "이메일과 비밀번호를 확인하세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: "로그인 정보가 올바르지 않습니다." };

  redirect(parsed.data.next);
}
