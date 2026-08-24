import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth/actions";
import { getActivityById } from "@/lib/analytics-actions";

type ActivityDetailProps = { params: Promise<{ id: string }> };

export default async function ActivityDetailPage({ params }: ActivityDetailProps) {
  const context = await getCurrentUserContext();
  if (!context.user) redirect("/login");
  const { id } = await params;
  const activity = await getActivityById(id);
  if (!activity) notFound();
  const relatedHref = activity.entity_type === "task" ? `/tasks/${activity.entity_id}` : activity.entity_type === "customer" ? `/customers/${activity.entity_id}` : null;

  return <div><PageHeader title={activity.title} description="Activity details and related records." /><Card className="max-w-2xl"><CardHeader><CardTitle>{activity.title}</CardTitle><CardDescription>{new Date(activity.created_at).toLocaleString()}</CardDescription></CardHeader><CardBody className="space-y-4 text-sm"><div><p className="text-muted-foreground">Type</p><p className="mt-1 font-medium">{activity.entity_type}</p></div><div><p className="text-muted-foreground">Description</p><p className="mt-1 font-medium">{activity.detail || "No description"}</p></div><div><p className="text-muted-foreground">Customer</p><p className="mt-1 font-medium">{activity.customerName || "Not related to a customer"}</p></div><div><p className="text-muted-foreground">Created by</p><p className="mt-1 font-medium">{activity.creatorName || "System"}</p></div>{relatedHref && <Link href={relatedHref} className="inline-block font-medium text-accent hover:underline">Open related record</Link>}<Link href="/activities" className="block font-medium text-accent hover:underline">Back to activities</Link></CardBody></Card></div>;
}
