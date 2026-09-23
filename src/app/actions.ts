"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { DocType, Document, Project, Proposal } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

const projectInput = z.object({
  name: z.string().trim().min(1).max(200),
  agency: z.string().trim().min(1).max(200),
  noticeNumber: z.string().trim().max(100),
  deadline: z.string().date().or(z.literal("")),
});

const MAX_PDF_BYTES = 50 * 1024 * 1024;

async function projectOrganization(projectId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,organization_id")
    .eq("id", projectId)
    .single();
  if (error || !data) throw new Error("프로젝트에 접근할 수 없습니다.");
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", data.organization_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) throw new Error("프로젝트에 접근할 수 없습니다.");
  return { supabase, organizationId: data.organization_id };
}

function validatePdf(file: File) {
  if (!file || file.size === 0) throw new Error("PDF 파일을 선택하세요.");
  if (file.size > MAX_PDF_BYTES) throw new Error("PDF 파일은 50MB 이하만 업로드할 수 있습니다.");
  if (!file.name.toLowerCase().endsWith(".pdf")) throw new Error("PDF 파일만 업로드할 수 있습니다.");
}

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: data.claims.sub };
}

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

export async function uploadDocumentAction(formData: FormData): Promise<Document> {
  const projectId = String(formData.get("projectId") ?? "");
  const documentType = String(formData.get("documentType") ?? "other") as DocType;
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("업로드 파일이 없습니다.");
  validatePdf(file);

  const { supabase, userId } = await currentUserId();
  const { organizationId } = await projectOrganization(projectId, userId);
  const documentId = crypto.randomUUID();
  const storagePath = `${organizationId}/${projectId}/documents/${documentId}.pdf`;
  const { error: uploadError } = await supabase.storage.from("procurement-documents").upload(storagePath, file, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw new Error("문서 파일을 저장하지 못했습니다.");

  const { data, error } = await supabase.from("documents").insert({
    id: documentId,
    project_id: projectId,
    name: file.name,
    document_type: documentType,
    storage_path: storagePath,
    page_count: 0,
    status: "processing",
    uploaded_by: userId,
  }).select().single();
  if (error) {
    await supabase.storage.from("procurement-documents").remove([storagePath]);
    throw new Error("문서 정보를 저장하지 못했습니다.");
  }

  revalidatePath(`/projects/${projectId}/documents`);
  return { id: data.id, projectId: data.project_id, name: data.name, type: data.document_type as DocType, pages: data.page_count, status: data.status, uploadedAt: data.uploaded_at, text: "" };
}

export async function uploadProposalAction(formData: FormData): Promise<Proposal> {
  const projectId = String(formData.get("projectId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("업로드 파일이 없습니다.");
  validatePdf(file);

  const { supabase, userId } = await currentUserId();
  const { organizationId } = await projectOrganization(projectId, userId);
  const proposalId = crypto.randomUUID();
  const storagePath = `${organizationId}/${projectId}/proposals/${proposalId}.pdf`;
  const { error: uploadError } = await supabase.storage.from("procurement-documents").upload(storagePath, file, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw new Error("제안서 파일을 저장하지 못했습니다.");

  const { data, error } = await supabase.from("proposals").insert({
    id: proposalId,
    project_id: projectId,
    filename: file.name,
    storage_path: storagePath,
    page_count: 0,
    status: "processing",
    uploaded_by: userId,
  }).select().single();
  if (error) {
    await supabase.storage.from("procurement-documents").remove([storagePath]);
    throw new Error("제안서 정보를 저장하지 못했습니다.");
  }

  revalidatePath(`/projects/${projectId}/proposal`);
  return { id: data.id, projectId: data.project_id, filename: data.filename, pages: data.page_count, sections: 0, status: data.status, updatedAt: data.uploaded_at };
}

export async function createDocumentSignedUrlAction(documentId: string) {
  const { supabase, userId } = await currentUserId();
  const { data: document, error } = await supabase.from("documents").select("storage_path").eq("id", documentId).single();
  if (error || !document) throw new Error("문서를 찾을 수 없습니다.");
  const { data, error: signedUrlError } = await supabase.storage.from("procurement-documents").createSignedUrl(document.storage_path, 60 * 10);
  if (signedUrlError || !data?.signedUrl) throw new Error("문서 미리보기 주소를 만들지 못했습니다.");
  void userId;
  return data.signedUrl;
}
