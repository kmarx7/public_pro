"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";

export function AccountControl() {
  return <form action={signOutAction} className="accountControl"><button type="submit" title="로그아웃"><LogOut size={14} /><span>로그아웃</span></button></form>;
}
