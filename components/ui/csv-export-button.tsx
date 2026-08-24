"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportBusinessCsv } from "@/lib/analytics-actions";

type ExportKind = "customers" | "tasks";

export function CsvExportButton({ kind }: { kind: ExportKind }) {
  const [pending, setPending] = useState(false);
  async function exportData() {
    setPending(true);
    const csv = await exportBusinessCsv(kind);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bizflow-${kind}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setPending(false);
  }
  return <Button variant="secondary" disabled={pending} onClick={exportData}>{pending ? "Exporting..." : "Export CSV"}</Button>;
}
