"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { FileSearch2 } from "lucide-react";
import { AccountControl } from "./account-control";
import { useWorkspace } from "./provider";

const nav = ["overview", "documents", "requirements", "proposal", "review"];

export function Shell({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const path = usePathname();
  const workspace = useWorkspace();
  const project = workspace.projects.find((item) => item.id === projectId);
  if (!project) return <main className="empty"><h1>프로젝트를 찾을 수 없습니다</h1><Link className="btn primary" href="/">Projects로 돌아가기</Link></main>;

  return <div>
    <header className="top">
      <Link className="brand" href="/"><b><FileSearch2 size={15} /></b>ProcureAI</Link><strong>{project.name}</strong>
      {projectId === "culture-ai-platform" && <span className="demo">DEMO</span>}<AccountControl />
    </header>
    <div className="frame">
      <aside>
        <div className="context"><small>공고번호</small><b>{project.noticeNumber || "미입력"}</b><span>{project.agency}</span></div>
        <nav>{nav.map((item) => <Link className={path.endsWith(item) ? "active" : ""} href={`/projects/${projectId}/${item}`} key={item}>
          <span>{item[0].toUpperCase() + item.slice(1)}</span>
          {item === "requirements" && <em>{workspace.requirements.filter((requirement) => requirement.projectId === projectId).length}</em>}
          {item === "review" && <em>{workspace.issues.filter((issue) => issue.projectId === projectId && issue.status === "open").length}</em>}
        </Link>)}</nav>
        <footer><small>제안 마감</small><b>{project.deadline || "미정"}</b></footer>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  </div>;
}
