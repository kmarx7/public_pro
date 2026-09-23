import "server-only";

import { demo } from "@/lib/demo";
import type { Document, Issue, Project, Proposal, Requirement, Workspace } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

type MappingRow = {
  requirement_id: string;
  status: Requirement["status"];
  reason: string;
  matched_text: string | null;
  proposal_sections: { title: string } | { title: string }[] | null;
};

function proposalTitle(value: MappingRow["proposal_sections"]) {
  if (Array.isArray(value)) return value[0]?.title;
  return value?.title;
}

export async function loadWorkspace(): Promise<Workspace> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return demo;

  const [projectsResult, documentsResult, requirementsResult, proposalsResult, mappingsResult, issuesResult] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("documents").select("*"),
    supabase.from("requirements").select("*"),
    supabase.from("proposals").select("*"),
    supabase.from("requirement_mappings").select("requirement_id,status,reason,matched_text,proposal_sections(title)"),
    supabase.from("review_issues").select("*"),
  ]);

  const firstError = [projectsResult, documentsResult, requirementsResult, proposalsResult, mappingsResult, issuesResult]
    .map((result) => result.error)
    .find(Boolean);
  if (firstError) throw new Error("워크스페이스 데이터를 불러오지 못했습니다.");

  const projects: Project[] = (projectsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    agency: row.agency,
    noticeNumber: row.notice_number,
    deadline: row.deadline ?? "",
    status: row.status as Project["status"],
    updatedAt: row.updated_at,
  }));
  const documents: Document[] = (documentsResult.data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    type: row.document_type as Document["type"],
    pages: row.page_count,
    status: row.status as Document["status"],
    uploadedAt: row.uploaded_at,
    text: "",
  }));

  const mappings = new Map(((mappingsResult.data ?? []) as MappingRow[]).map((mapping) => [mapping.requirement_id, mapping]));
  const requirements: Requirement[] = (requirementsResult.data ?? []).map((row) => {
    const mapping = mappings.get(row.id);
    return {
      id: row.id,
      projectId: row.project_id,
      code: row.requirement_code,
      category: row.category,
      text: row.requirement_text,
      mandatory: row.mandatory,
      documentId: row.source_document_id,
      page: row.source_page,
      section: row.source_section ?? "",
      proposalSection: proposalTitle(mapping?.proposal_sections ?? null),
      matchedText: mapping?.matched_text ?? undefined,
      status: mapping?.status ?? "needs_review",
      reason: mapping?.reason ?? "아직 제안서 대응 분석이 수행되지 않았습니다.",
    };
  });
  const proposals: Proposal[] = (proposalsResult.data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    filename: row.filename,
    pages: row.page_count,
    sections: 0,
    status: row.status as Proposal["status"],
    updatedAt: row.last_analyzed_at ?? row.uploaded_at,
  }));
  const issues: Issue[] = (issuesResult.data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    requirementId: row.requirement_id ?? "",
    severity: row.severity as Issue["severity"],
    title: row.title,
    description: row.description,
    status: row.status as Issue["status"],
  }));

  return {
    projects: [...projects, ...demo.projects],
    documents: [...documents, ...demo.documents],
    requirements: [...requirements, ...demo.requirements],
    proposals: [...proposals, ...demo.proposals],
    issues: [...issues, ...demo.issues],
  };
}
