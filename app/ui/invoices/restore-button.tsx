"use client";

import { useTransition } from "react";
import { restoreInvoiceStatus } from "@/app/lib/actions"; // Import your restore action

export default function RestoreButton({ logId }: { logId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleRestore = () => {
    startTransition(async () => {
      await restoreInvoiceStatus(logId);
    });
  };

  return (
    <button
      onClick={handleRestore}
      disabled={isPending}
      className="mt-4 rounded-md bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-300"
      >
      {isPending ? "Restoring..." : "Restore to this state"}
    </button>
  );
}
