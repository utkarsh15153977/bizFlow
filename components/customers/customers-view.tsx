"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InboxIcon } from "@/components/icons";
import { SearchField } from "@/components/ui/search-field";
import type { Customer } from "@/lib/mock-data";

const columns: Column<Customer>[] = [
  {
    id: "name",
    header: "Name",
    cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-muted-foreground md:hidden">{row.company}</p>
      </div>
    ),
  },
  {
    id: "company",
    header: "Company",
    hideOnMobile: true,
    cell: (row) => row.company,
  },
  {
    id: "email",
    header: "Email",
    hideOnMobile: true,
    cell: (row) => row.email,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge tone={row.status === "Active" ? "success" : "neutral"}>{row.status}</Badge>
    ),
  },
  {
    id: "lastOrder",
    header: "Last order",
    hideOnMobile: true,
    cell: (row) => row.lastOrder,
  },
];

export function CustomersView({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.company, customer.email, customer.status]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <SearchField
        id="customer-search"
        label="Search customers"
        value={query}
        onChange={setQuery}
        placeholder="Search by name, company, or email"
      />
      <DataTable
        caption="Customers"
        columns={columns}
        rows={filtered}
        getRowId={(row) => row.id}
        emptyIcon={<InboxIcon />}
        emptyTitle={customers.length === 0 ? "No customers yet" : "No matching customers"}
        emptyDescription={
          customers.length === 0
            ? "When customers are added, they will appear in this table."
            : "Try a different search term to find a customer."
        }
        emptyAction={
          customers.length === 0 ? (
            <Button disabled>Add customer</Button>
          ) : undefined
        }
      />
    </div>
  );
}
