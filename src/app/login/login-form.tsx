"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return (
    <form action={action} className="loginForm">
      <input type="hidden" name="next" value={nextPath} />
      <label>이메일<input name="email" type="email" autoComplete="email" required /></label>
      <label>비밀번호<input name="password" type="password" autoComplete="current-password" minLength={6} required /></label>
      {state.error && <p className="formError">{state.error}</p>}
      <button className="btn primary loginButton" disabled={pending}>{pending ? "로그인 중…" : "로그인"}</button>
    </form>
  );
}
