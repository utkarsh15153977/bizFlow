import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest updates across customers, leads, and tasks.</CardDescription>
      </CardHeader>
      <CardBody className="p-0">
        <ol className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">{item.time}</time>
              </div>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
