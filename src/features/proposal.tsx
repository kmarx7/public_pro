"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { useWorkspace } from "@/components/provider";
import { Badge, Header } from "@/components/ui";

export function Proposal() {
  const { projectId } = useParams<{ projectId: string }>();
  const workspace = useWorkspace();
  const proposal = workspace.proposals.find((item) => item.projectId === projectId);
  const requirements = workspace.requirements.filter((item) => item.projectId === projectId);
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await workspace.addProposal(projectId, file);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "제안서 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return <div className="page">
    <Header title="Proposal" description="기존 제안서를 섹션 단위로 분석하고 요구사항과 대응시킵니다." action={<>
      <input ref={ref} hidden type="file" accept="application/pdf" onChange={(event) => upload(event.target.files?.[0])} />
      <button className="btn primary" disabled={uploading} onClick={() => ref.current?.click()}><Upload size={14} />{uploading ? "Uploading…" : proposal ? "Replace Proposal" : "Upload Proposal"}</button>
    </>} />
    {error && <p className="formError pageError">{error}</p>}
    {proposal ? <>
      <section className="proposalFile"><span><FileCheck2 size={21} /></span><div><h2>{proposal.filename}</h2><dl><dt>Pages</dt><dd>{proposal.pages || "—"}</dd><dt>Sections</dt><dd>{proposal.sections || "—"}</dd><dt>Last analyzed</dt><dd>{proposal.updatedAt.slice(0, 10)}</dd></dl></div><Badge value={proposal.status} /></section>
      <section className="pipeline"><small>ANALYSIS PIPELINE</small><h2>대응 분석 상태</h2><div>{["Text extraction", "Section detection", "Candidate retrieval", "Condition verification"].map((item) => <span key={item}>{item}</span>)}</div><p>검색 유사도는 후보를 찾는 데만 사용하며, 요구 조건 충족 여부는 별도로 검증합니다.</p></section>
      <section className="sectionList"><header><h2>Proposal sections</h2><small>{proposal.sections || 0} sections · {requirements.length} requirements assessed</small></header><table><thead><tr><th>Section</th><th>Matched Requirements</th><th>Assessment</th></tr></thead><tbody><tr><td colSpan={3} className="muted">분석이 완료되면 섹션별 대응 결과가 표시됩니다.</td></tr></tbody></table></section>
    </> : <section className="uploadEmpty"><FileCheck2 size={27} /><h2>제안서가 업로드되지 않았습니다</h2><p>PDF를 추가하면 요구사항별 후보 섹션과 실제 충족 여부를 검증합니다.</p><button className="btn primary" onClick={() => ref.current?.click()}>제안서 선택</button></section>}
  </div>;
}
