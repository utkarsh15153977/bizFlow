import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RevenuePoint = {
  label: string;
  value: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RevenueOverview({ data }: { data: RevenuePoint[] }) {
  const max = Math.max(...data.map((point) => point.value));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Lead pipeline</CardTitle>
        <CardDescription>Active leads by stage.</CardDescription>
      </CardHeader>
      <CardBody>
        <div
          className="flex h-48 items-end gap-3 sm:gap-4"
          role="img"
          aria-label="Bar chart of leads by stage"
        >
          {data.map((point) => {
            const height = Math.max(8, Math.round((point.value / max) * 100));

            return (
              <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center">
                  <div
                    className="w-full max-w-12 rounded-t-md bg-accent"
                    style={{ height: `${height}%` }}
                    title={`${point.label}: ${formatCurrency(point.value)}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{point.label}</span>
              </div>
            );
          })}
        </div>

        <table className="sr-only">
          <caption>Lead pipeline</caption>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.label}>
                <td>{point.label}</td>
                <td>{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
