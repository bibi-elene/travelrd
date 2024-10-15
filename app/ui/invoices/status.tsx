"use client";
import { updateInvoiceStatus } from "@/app/lib/actions";
import {
  CheckIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState } from "react";

const statusList = ["Pending", "Paid", "Canceled", "Overdue"];

export default function InvoiceStatus({
  status,
  id,
}: Readonly<{
  status: string;
  id: string;
}>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDropdownOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleStatusChange = (id: string, item: string) => {
    updateInvoiceStatus(id, item.toLowerCase());
    handleDropdownOpen();
  };

  return (
    <div>
      <button
        className={clsx(
          "inline-flex items-center rounded-full px-2 py-1 text-xs",
          {
            "bg-gray-100 text-gray-500": status === "pending",
            "bg-green-500 text-white": status === "paid",
            "bg-red-500 text-white": status === "canceled",
            "bg-black text-white": status === "overdue",
          }
        )}
        onClick={handleDropdownOpen}
      >
        {status === "pending" ? (
          <>
            Pending
            <ClockIcon className="ml-1 w-4 text-gray-500" />
          </>
        ) : null}
        {status === "paid" ? (
          <>
            Paid
            <CheckIcon className="ml-1 w-4 text-white" />
          </>
        ) : null}
        {status === "canceled" ? (
          <>
            Canceled
            <XMarkIcon className="ml-1 w-4 text-white" />
          </>
        ) : null}
        {status === "overdue" ? (
          <>
            Overdue
            <ExclamationCircleIcon className="ml-1 w-4 text-white" />
          </>
        ) : null}
      </button>
      {isOpen && (
        <div className="absolute w-24 bg-white p-2 rounded-lg shadow-md">
          {statusList.map(
            (item) =>
              item.toLowerCase() !== status && (
                <button
                  key={item}
                  className="block w-full text-left py-1"
                  onClick={() => handleStatusChange(id, item)}
                >
                  {item}
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
}
