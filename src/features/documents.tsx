"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { createDocumentSignedUrlAction } from "@/app/actions";
import { useWorkspace } from "@/components/provider";
import { Badge, Header } from "@/components/ui";
import type { DocType } from "@/lib/domain";

const names: Record<DocType, string> = { notice: "입찰공고", rfp: "제안요청서", statement_of_work: "과업지시서", specification: "규격서", evaluation_criteria: "평가기준", attachment: "첨부", other: "기타" };

export function Documents() {
  const { projectId } = useParams<{ projectId: string }>();
  const workspace = useWorkspace();
  const documents = workspace.documents.filter((item) => item.projectId === projectId);
  const [selected, setSelected] = useState<string | undefined>(() => documents[0]?.id);
  const [tab, setTab] = useState<"original" | "extracted">("extracted");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const [signedDocumentId, setSignedDocumentId] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const document = documents.find((item) => item.id === selected);

  useEffect(() => {
    if (!document || tab !== "original" || document.id.startsWith("rfp") || document.id.startsWith("sow")) return;
    createDocumentSignedUrlAction(document.id).then((url) => {
      setSignedDocumentId(document.id);
      setSignedUrl(url);
    }).catch(() => setError("원문 미리보기를 불러오지 못했습니다."));
  }, [document, tab]);

  async function upload(files: File[]) {
    setUploading(true);
    setError("");
    try {
      for (const file of files) await workspace.addDocument(projectId, file, "other");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "문서 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return <div className={`page split ${document ? "opened" : ""}`}>
    <div className="mainPane">
      <Header title="Documents" description="입찰 관련 원문과 시스템이 추출한 내용을 함께 관리합니다." action={<>
        <input ref={ref} hidden type="file" accept="application/pdf" multiple onChange={(event) => upload(Array.from(event.target.files ?? []))} />
        <button className="btn primary" disabled={uploading} onClick={() => ref.current?.click()}><Upload size={14} />{uploading ? "Uploading…" : "Upload"}</button>
      </>} />
      {error && <p className="formError pageError">{error}</p>}
      <div className="note"><b>{documents.length}개 문서</b><span>PDF는 조직별 비공개 Storage에 저장되며 분석 상태를 추적합니다.</span></div>
      <div className="table"><table><thead><tr><th>Name</th><th>Document Type</th><th>Pages</th><th>Status</th><th>Uploaded At</th></tr></thead><tbody>
        {documents.map((item) => <tr key={item.id} onClick={() => setSelected(item.id)} className={item.id === selected ? "selected" : ""}><td><button className="tableLink"><FileText size={14} />{item.name}</button></td><td>{names[item.type]}</td><td>{item.pages || "—"}</td><td><Badge value={item.status} /></td><td>{item.uploadedAt.slice(0, 10)}</td></tr>)}
      </tbody></table></div>
    </div>
    {document && <aside className="panel"><header><div><small>DOCUMENT</small><b>{document.name}</b></div><button onClick={() => setSelected(undefined)}><X size={16} /></button></header>
      <div className="tabs"><button className={tab === "original" ? "active" : ""} onClick={() => setTab("original")}>Original</button><button className={tab === "extracted" ? "active" : ""} onClick={() => setTab("extracted")}>Extracted</button></div>
      {tab === "extracted" ? <div className="paper"><small>PAGE 1</small><pre>{document.text || "텍스트 추출 대기 중입니다."}</pre></div> : <div className="pdf">{signedUrl && signedDocumentId === document.id ? <iframe title={`${document.name} 원문`} src={signedUrl} /> : <><FileText size={25} /><b>PDF 원문 미리보기</b><p>{document.status === "processing" ? "분석 준비 중입니다." : "원문 주소를 준비하고 있습니다."}</p><span>Page 1 / {document.pages || "—"}</span></>}</div>}
    </aside>}
  </div>;
}
