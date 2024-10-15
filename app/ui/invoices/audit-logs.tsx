"use client";

import { formatDateToLocal } from "@/app/lib/utils";
import RestoreButton from "./restore-button";

export default function AuditLogs({ logs }: { logs: any[] }) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold">Audit Logs</h2>
      {logs.length > 0 ? (
        <ul className="mt-4">
          {logs.map((log) => (
            <li key={log.changed_at} className="border p-4 mb-2">
              <p>
                <strong>Old Status:</strong> {log.old_status},{" "}
                <strong>New Status:</strong> {log.new_status}
              </p>
              <p>
                <strong>Changed by:</strong> {log.changed_by},{" "}
                <strong>Date:</strong> {formatDateToLocal(log.changed_at)}
              </p>
              <RestoreButton logId={log.id} /> {/* Restore button */}
            </li>
          ))}
        </ul>
      ) : (
        <p>No audit logs available for this invoice.</p>
      )}
    </div>
  );
}
