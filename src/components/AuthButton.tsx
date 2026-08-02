"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButton() {
  const { data, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-[var(--muted)]">会话加载中……</span>;
  }

  if (!data?.user) {
    return (
      <button
        type="button"
        className="btn-ghost"
        onClick={() => signIn("github")}
      >
        GitHub 登录
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--muted)]">
        {data.user.login || data.user.name}
      </span>
      <button type="button" className="btn-ghost" onClick={() => signOut()}>
        退出
      </button>
    </div>
  );
}
