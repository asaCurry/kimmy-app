import type { LoaderFunctionArgs } from "react-router";
import { performanceMonitor } from "~/lib/performance-monitor";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Performance metrics are disabled for security
    return Response.json(
      { error: "Performance metrics not available" },
      { status: 403 }
    );

    // eslint-disable-next-line no-unreachable
    const url = new URL(request.url);
    const operation = url.searchParams.get("operation");

    if (operation) {
      // Get stats for specific operation
      const operationStats = performanceMonitor.getOperationStats(operation!);
      return Response.json({
        operation,
        stats: operationStats,
      });
    } else {
      // Get general stats
      const generalStats = performanceMonitor.getStats();
      return Response.json({
        stats: generalStats,
        availableOperations: [
          "auto_completion_field_suggestions",
          "auto_completion_general_suggestions",
        ],
      });
    }
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return Response.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 }
    );
  }
}
