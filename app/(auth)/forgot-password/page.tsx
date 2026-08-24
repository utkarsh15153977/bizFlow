"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    null,
  );

  if (state?.success) {
    return (
      <Card className="shadow-lg border-border/80 text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            {state.message ||
              "If the email is registered, you'll receive instructions to reset your password."}
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Back to login
            </Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/80">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          Enter the email address associated with your account and we will send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardBody>
        {state?.error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
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

          <Button
            type="submit"
            isLoading={isPending}
            loadingText="Sending reset link..."
            className="w-full mt-2"
          >
            Send reset link
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            Back to login
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
