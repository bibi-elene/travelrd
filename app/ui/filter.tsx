"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const statusList = ["All", "Pending", "Paid", "Canceled", "Overdue"];

export default function Filter() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleFilter = useDebouncedCallback((term: string) => {
    params.set("page", "1");

    if (term && term !== "all") {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Filter
      </label>
      {statusList.map((status) => (
        <button
          key={status}
          className="peer block w-full rounded-md border border-gray-200 py-[9px] mx-3 text-sm outline-2 "
          onClick={() => handleFilter(status.toLowerCase())}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
