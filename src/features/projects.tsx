"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileSearch2, Plus, Search, X } from "lucide-react";
import { AccountControl } from "@/components/account-control";
import { useWorkspace } from "@/components/provider";
import { Badge, Header } from "@/components/ui";

export function Projects() {
  const workspace = useWorkspace();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const projects = workspace.projects.filter((project) =>
    `${project.name}${project.agency}${project.noticeNumber}`.includes(query),
  );

  return (
    <>
      <header className="publicTop">
        <span className="brand"><b><FileSearch2 size={15} /></b>ProcureAI</span>
        <AccountControl />
      </header>
      <main className="projects">
        <Header title="Projects" description="조달 문서 분석과 제안서 대응 검토를 프로젝트 단위로 관리합니다." action={<button className="btn primary" onClick={() => setOpen(true)}><Plus size={14} />New Project</button>} />
        <div className="toolbar">
          <label className="search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="사업명, 기관, 공고번호 검색" /></label>
          <small>{projects.length} projects</small>
        </div>
        <div className="table"><table>
          <thead><tr><th>Project Name</th><th>Agency</th><th>Deadline</th><th>Status</th><th>Requirements</th><th>Missing</th><th>Last updated</th></tr></thead>
          <tbody>{projects.map((project) => {
            const requirements = workspace.requirements.filter((requirement) => requirement.projectId === project.id);
            return <tr key={project.id}>
              <td><Link className="link strong" href={`/projects/${project.id}/overview`}>{project.name}</Link><small>{project.noticeNumber}</small></td>
              <td>{project.agency}</td><td>{project.deadline || "—"}</td><td><Badge value={project.status} /></td>
              <td>{requirements.length}</td><td className="dangerText">{requirements.filter((requirement) => requirement.status === "missing").length}</td>
              <td>{new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(project.updatedAt))}</td>
            </tr>;
          })}</tbody>
        </table></div>
      </main>
      {open && <div className="backdrop" onMouseDown={() => setOpen(false)}>
        <form className="modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError("");
          const form = new FormData(event.currentTarget);
          try {
            const project = await workspace.createProject({
              name: String(form.get("name")), agency: String(form.get("agency")),
              noticeNumber: String(form.get("notice")), deadline: String(form.get("deadline")),
            });
            router.push(`/projects/${project.id}/overview`);
          } catch {
            setError("프로젝트를 생성하지 못했습니다. 다시 시도하세요.");
            setSaving(false);
          }
        }}>
          <header><div><h2>새 프로젝트</h2><p>입찰 공고의 기본 정보를 입력하세요.</p></div><button type="button" onClick={() => setOpen(false)}><X size={16} /></button></header>
          <div className="form">
            <label className="wide">사업명 *<input required name="name" /></label><label>발주기관 *<input required name="agency" /></label>
            <label>공고번호<input name="notice" /></label><label>마감일<input name="deadline" type="date" /></label>
            {error && <p className="formError wide">{error}</p>}
          </div>
          <footer><button type="button" className="btn" onClick={() => setOpen(false)}>취소</button><button className="btn primary" disabled={saving}>{saving ? "생성 중…" : "프로젝트 생성"}</button></footer>
        </form>
      </div>}
    </>
  );
}
