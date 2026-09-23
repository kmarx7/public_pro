import { FileSearch2 } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <main className="loginPage">
      <section className="loginPanel">
        <header className="loginBrand">
          <span className="brand"><b><FileSearch2 size={15} /></b>ProcureAI</span>
          <p>공공조달 요구사항 추적 및 제안서 검토</p>
        </header>
        <div className="loginBody">
          <h1>로그인</h1>
          <p>조직의 프로젝트와 조달 문서에 접근합니다.</p>
          <LoginForm nextPath={nextPath} />
        </div>
        <footer>승인된 사용자만 접근할 수 있습니다.</footer>
      </section>
    </main>
  );
}
