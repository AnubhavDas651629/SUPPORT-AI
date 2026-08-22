import * as React from "react";
import { cn } from "@/lib/utils";

/** Horizontal-scroll container — tables never push the page sideways. */
export function TableWrap({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-max sm:min-w-full">{children}</div>
    </div>
  );
}

export function Table({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <table className={cn("w-full border-collapse text-sm", className)}>
      {children}
    </table>
  );
}

export function Th({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-left text-[11.5px] font-medium uppercase tracking-[0.06em] text-subtle",
        "border-b border-line bg-surface-2/60 whitespace-nowrap",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 align-middle border-b border-line", className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function Tr({
  className,
  interactive,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "last:[&>td]:border-b-0",
        interactive && "cursor-pointer transition-colors hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}
