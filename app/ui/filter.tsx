"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const statusList = ["Pending", "Paid", "Canceled", "Overdue"];

export default function Filter() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleFilter = useDebouncedCallback((option: string) => {
    console.log(`Searching... ${option}`);

    const params = new URLSearchParams(searchParams);

    params.set("page", "1");

    if (option) {
      params.set("filter", option);
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
