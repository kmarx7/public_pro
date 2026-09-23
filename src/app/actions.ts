"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Project } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

const projectInput = z.object({
  name: z.string().trim().min(1).max(200),
  agency: z.string().trim().min(1).max(200),
  noticeNumber: z.string().trim().max(100),
  deadline: z.string().date().or(z.literal("")),
});

export async function createProjectAction(input: {
  name: string;
  agency: string;
  noticeNumber: string;
  deadline: string;
}): Promise<Project> {
  const values = projectInput.parse(input);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) throw new Error("로그인이 필요합니다.");

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) throw new Error("조직 정보를 확인할 수 없습니다.");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: membership.organization_id,
      name: values.name,
      agency: values.agency,
      notice_number: values.noticeNumber,
      deadline: values.deadline || null,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw new Error("프로젝트를 생성하지 못했습니다.");

  revalidatePath("/");
  return {
    id: data.id,
    name: data.name,
    agency: data.agency,
    noticeNumber: data.notice_number,
    deadline: data.deadline ?? "",
    status: data.status as Project["status"],
    updatedAt: data.updated_at,
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
