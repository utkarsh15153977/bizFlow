import Image from "next/image";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth/actions";

export default async function ProfilePage() {
  const userContext = await getCurrentUserContext();

  if (!userContext.user) {
    redirect("/login");
  }

  const displayName = userContext.profile?.full_name || userContext.user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your personal account and workspace membership."
      />

      <div className="grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardBody className="flex flex-col items-center text-center">
            {userContext.profile?.avatar_url ? (
              <Image
                src={userContext.profile.avatar_url}
                alt={displayName}
                width={96}
                height={96}
                unoptimized
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-accent-foreground">
                {initials || "BF"}
              </div>
            )}
            <h2 className="mt-4 text-xl font-semibold text-foreground">{displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{userContext.user.email}</p>
            <a
              href="/settings"
              className="mt-5 text-sm font-medium text-accent hover:underline"
            >
              Edit profile
            </a>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>Information associated with your BizFlow account.</CardDescription>
          </CardHeader>
          <CardBody className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Full name</p>
              <p className="mt-1 font-medium text-foreground">{userContext.profile?.full_name || "Not set"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="mt-1 font-medium text-foreground">{userContext.user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="mt-1 font-medium text-foreground">{userContext.profile?.phone || "Not set"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Organization</p>
              <p className="mt-1 font-medium text-foreground">{userContext.organization?.name || "Not assigned"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="mt-1 font-medium capitalize text-foreground">{userContext.role || "Not assigned"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Account created</p>
              <p className="mt-1 font-medium text-foreground">
                {userContext.profile?.created_at
                  ? new Date(userContext.profile.created_at).toLocaleDateString()
                  : "Unavailable"}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
