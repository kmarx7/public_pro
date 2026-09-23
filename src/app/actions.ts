"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { DocType, Document, Project, Proposal, Requirement } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

const projectInput = z.object({
  name: z.string().trim().min(1).max(200),
  agency: z.string().trim().min(1).max(200),
  noticeNumber: z.string().trim().max(100),
  deadline: z.string().date().or(z.literal("")),
});

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const requirementCategories = ["FUNC", "PERF", "TECH", "SEC", "DATA", "OPS", "PM", "STAFF", "QUAL", "DOC", "SCHEDULE", "PRICE", "LEGAL", "EVAL"] as const;
const requirementExtractionSchema = z.object({
  requirements: z.array(z.object({
    requirement_code: z.string(),
    category: z.enum(requirementCategories),
    requirement_text: z.string(),
    mandatory: z.boolean(),
    source_page: z.number().int().positive(),
    source_section: z.string(),
    source_quote: z.string(),
    evaluation_information: z.string(),
  })),
});

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

type ExtractedPage = { num: number; text: string };

async function parsePdf(data: ArrayBuffer): Promise<ExtractedPage[]> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(data) });
  try {
    const result = await parser.getText();
    return result.pages.map((page) => ({ num: page.num, text: page.text.trim() }));
  } finally {
    await parser.destroy();
  }
}

function mapRequirement(row: Record<string, unknown>): Requirement {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    code: String(row.requirement_code),
    category: String(row.category),
    text: String(row.requirement_text),
    mandatory: Boolean(row.mandatory),
    documentId: String(row.source_document_id),
    page: Number(row.source_page),
    section: String(row.source_section ?? ""),
    status: "needs_review",
    reason: "요구사항이 추출되었습니다. 제안서 업로드 후 대응 여부를 분석하세요.",
  };
}

async function extractRequirements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
  projectId: string,
  pages: ExtractedPage[],
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI가 설정되지 않았습니다.");
  const sourceText = pages.map((page) => `[[PAGE ${page.num}]]\n${page.text}`).join("\n\n").slice(0, 120000);
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.parse({
    model: "gpt-4.1-mini",
    temperature: 0,
    messages: [
      { role: "system", content: "당신은 공공조달 RFP 분석 담당자입니다. 제공된 원문에 실제로 적힌 요구사항만 추출합니다. 원문에 없는 수치, 인증, 실적, 기능을 추론하거나 생성하지 마세요. source_quote는 입력 원문에서 그대로 복사해야 하며, source_page는 [[PAGE N]]의 N이어야 합니다. 평가기준이나 제출조건도 요구사항으로 분리하고, 애매하면 mandatory는 false로 두세요." },
      { role: "user", content: `다음 RFP 원문에서 검증 가능한 요구사항을 추출하세요. 각 항목에는 짧고 안정적인 코드(예: REQ-FUNC-001)를 부여하세요.\n\n${sourceText}` },
    ],
    response_format: zodResponseFormat(requirementExtractionSchema, "requirement_extraction"),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("요구사항 추출 결과가 비어 있습니다.");
  const pageMap = new Map(pages.map((page) => [page.num, page.text]));
  const rows = parsed.requirements.flatMap((item) => {
    const pageText = pageMap.get(item.source_page);
    if (!pageText || !item.requirement_text.trim()) return [];
    const quote = item.source_quote.trim();
    return [{
      project_id: projectId,
      requirement_code: item.requirement_code.trim().slice(0, 80),
      category: item.category,
      requirement_text: item.requirement_text.trim(),
      mandatory: item.mandatory,
      source_document_id: documentId,
      source_page: item.source_page,
      source_section: item.source_section.trim(),
      source_quote: quote && pageText.includes(quote) ? quote : null,
      evaluation_information: item.evaluation_information.trim(),
    }];
  });
  if (!rows.length) return [];
  const { data, error } = await supabase.from("requirements").upsert(rows, { onConflict: "project_id,requirement_code" }).select();
  if (error) throw new Error("요구사항을 저장하지 못했습니다.");
  return (data ?? []).map((row) => mapRequirement(row as Record<string, unknown>));
}

export async function analyzeDocumentAction(documentId: string): Promise<{ document: Document; requirements: Requirement[]; warning?: string }> {
  const { supabase } = await currentUserId();
  const { data: documentRow, error: documentError } = await supabase.from("documents").select("*").eq("id", documentId).single();
  if (documentError || !documentRow) throw new Error("문서를 찾을 수 없습니다.");
  const { data: file, error: downloadError } = await supabase.storage.from("procurement-documents").download(documentRow.storage_path);
  if (downloadError || !file) throw new Error("문서 파일을 불러오지 못했습니다.");

  let pages: ExtractedPage[];
  try {
    pages = await parsePdf(await file.arrayBuffer());
  } catch {
    await supabase.from("documents").update({ status: "error", error_message: "PDF 텍스트를 추출하지 못했습니다." }).eq("id", documentId);
    throw new Error("PDF 텍스트를 추출하지 못했습니다.");
  }
  await supabase.from("document_pages").delete().eq("document_id", documentId);
  await supabase.from("document_sections").delete().eq("document_id", documentId);
  if (pages.length) {
    await supabase.from("document_pages").insert(pages.map((page) => ({ document_id: documentId, page_number: page.num, extracted_text: page.text })));
    await supabase.from("document_sections").insert(pages.map((page, index) => ({ document_id: documentId, title: page.text.split("\n")[0]?.slice(0, 160) || `Page ${page.num}`, start_page: page.num, end_page: page.num, extracted_text: page.text, sort_order: index })));
  }
  const { data: updated, error: updateError } = await supabase.from("documents").update({ page_count: pages.length, status: "ready", error_message: null }).eq("id", documentId).select().single();
  if (updateError || !updated) throw new Error("문서 분석 상태를 저장하지 못했습니다.");

  let requirements: Requirement[] = [];
  let warning: string | undefined;
  try {
    requirements = await extractRequirements(supabase, documentId, documentRow.project_id, pages);
  } catch {
    warning = "텍스트 추출은 완료했지만 AI 요구사항 추출에 실패했습니다. 다시 분석해 주세요.";
  }
  return {
    document: { id: updated.id, projectId: updated.project_id, name: updated.name, type: updated.document_type as DocType, pages: updated.page_count, status: updated.status, uploadedAt: updated.uploaded_at, text: pages[0]?.text ?? "" },
    requirements,
    warning,
  };
}
