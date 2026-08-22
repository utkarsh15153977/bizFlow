"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InboxIcon } from "@/components/icons";
import { SearchField } from "@/components/ui/search-field";
import type { Lead } from "@/lib/mock-data";

const stageTone = {
  New: "accent",
  Qualified: "success",
  Proposal: "warning",
} as const;

const columns: Column<Lead>[] = [
  {
    id: "name",
    header: "Name",
    cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-muted-foreground md:hidden">{row.source}</p>
      </div>
    ),
  },
  {
    id: "source",
    header: "Source",
    hideOnMobile: true,
    cell: (row) => row.source,
  },
  {
    id: "email",
    header: "Email",
    hideOnMobile: true,
    cell: (row) => row.email,
  },
  {
    id: "stage",
    header: "Stage",
    cell: (row) => <Badge tone={stageTone[row.stage]}>{row.stage}</Badge>,
  },
  {
    id: "estimatedValue",
    header: "Est. value",
    hideOnMobile: true,
    cell: (row) => row.estimatedValue,
  },
];

export function LeadsView({ leads }: { leads: Lead[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return leads;
    }

    return leads.filter((lead) =>
      [lead.name, lead.source, lead.email, lead.stage]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [leads, query]);

  return (
    <div className="space-y-4">
      {leads.length > 0 ? (
        <SearchField
          id="lead-search"
          label="Search leads"
          value={query}
          onChange={setQuery}
          placeholder="Search by name, source, or email"
        />
      ) : null}
      <DataTable
        caption="Leads"
        columns={columns}
        rows={filtered}
        getRowId={(row) => row.id}
        emptyIcon={<InboxIcon />}
        emptyTitle={leads.length === 0 ? "No leads yet" : "No matching leads"}
        emptyDescription={
          leads.length === 0
            ? "New opportunities will show up here as a clean pipeline table."
            : "Try a different search term to find a lead."
        }
        emptyAction={
          leads.length === 0 ? (
            <Button disabled>Add lead</Button>
          ) : undefined
        }
      />
    </div>
  );
}
