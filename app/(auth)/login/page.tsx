"use client";

import { useActionState, use, useState } from "react";
import Link from "next/link";
import { signInWithPassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string; message?: string }>;
}) {
  const resolvedParams = use(searchParams);
  const redirectTo = resolvedParams.redirectTo || "/";
  const urlError = resolvedParams.error;
  const urlMessage = resolvedParams.message;

  const [state, formAction, isPending] = useActionState(signInWithPassword, null);
  const [showPassword, setShowPassword] = useState(false);

  const displayError = state?.error || urlError;

  return (
    <Card className="shadow-lg border-border/80">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your BizFlow workspace.
        </CardDescription>
      </CardHeader>
      <CardBody>
        {displayError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {displayError}
          </div>
        )}

        {urlMessage && !displayError && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success"
          >
            {urlMessage}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isPending}
            loadingText="Signing in..."
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-accent hover:underline"
          >
            Create one
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
