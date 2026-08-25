"use client";

import { SearchIcon } from "@/components/icons";

type SearchFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
};

export function SearchField({
  id,
  label,
  value,
  onChange,
  onKeyDown,
  placeholder,
}: SearchFieldProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-card py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}
