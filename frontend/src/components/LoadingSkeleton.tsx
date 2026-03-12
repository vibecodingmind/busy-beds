export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="h-6 w-2/3 rounded bg-black/10 dark:bg-zinc-700" />
      <div className="mt-4 h-4 w-full rounded bg-black/10 dark:bg-zinc-700" />
      <div className="mt-2 h-4 w-4/5 rounded bg-black/10 dark:bg-zinc-700" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-2"><div className="h-4 w-20 rounded bg-black/10 dark:bg-zinc-700" /></td>
      <td className="px-4 py-2"><div className="h-4 w-24 rounded bg-black/10 dark:bg-zinc-700" /></td>
      <td className="px-4 py-2"><div className="h-4 w-16 rounded bg-black/10 dark:bg-zinc-700" /></td>
    </tr>
  );
}
