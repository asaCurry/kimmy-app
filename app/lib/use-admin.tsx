/**
 * Hook to check if current user has admin privileges
 * Admin status is set directly in the database and controls debug UI visibility
 */

import React from "react";
import { useAuth } from "~/contexts/auth-context";

export function useAdmin() {
  const { session } = useAuth();

  // Check admin field from session (database-driven admin privileges)
  const isAdmin = Boolean(session?.admin);

  return {
    isAdmin,
    userId: session?.userId,
    debugMode: isAdmin, // Alias for backward compatibility
  };
}

/**
 * Component wrapper that only renders children if user is admin
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdmin();

  if (!isAdmin) return null;

  return <>{children}</>;
}

/**
 * Debug info component that shows development information
 */
export function DebugInfo({
  data,
  title = "Debug Info",
}: {
  data: any;
  title?: string;
}) {
  const { isAdmin } = useAdmin();

  if (!isAdmin) return null;

  return (
    <div className="mt-4 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
      <details>
        <summary className="cursor-pointer text-sm text-slate-300 hover:text-slate-100">
          🔧 {title}
        </summary>
        <pre className="mt-2 text-xs text-slate-400 whitespace-pre-wrap overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
