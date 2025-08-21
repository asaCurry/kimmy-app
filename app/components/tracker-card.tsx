import * as React from "react";
import { useFetcher, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Clock,
  Play,
  Square,
  Plus,
  BarChart3,
  Timer,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";
import type { Tracker, TrackerEntry } from "~/db/schema";

interface TrackerCardProps {
  tracker: Tracker;
  activeEntry?: TrackerEntry | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  showDetailLink?: boolean;
  memberId?: number;
  stats?: {
    totalValue: number;
    entryCount: number;
    averageValue: number;
  };
}

export function TrackerCard({
  tracker,
  activeEntry,
  onEdit,
  onDelete,
  onRefresh,
  showDetailLink = false,
  memberId,
  stats,
}: TrackerCardProps) {
  const fetcher = useFetcher();
  const [isTracking, setIsTracking] = React.useState(!!activeEntry);
  const [localTrackingStart, setLocalTrackingStart] = React.useState<
    string | null
  >(null);
  const [elapsedTime, setElapsedTime] = React.useState<string>("");

  // Update elapsed time every second while tracking
  React.useEffect(() => {
    if (isTracking && localTrackingStart) {
      const interval = setInterval(() => {
        setElapsedTime(getElapsedTime(localTrackingStart, true)); // Show seconds while tracking
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedTime("");
    }
  }, [isTracking, localTrackingStart]);

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        // Check the fetcher state or form data to determine the action
        const formData = fetcher.formData;
        if (formData) {
          const action = formData.get("_action");
          if (action === "complete-tracking") {
            toast.success("Time tracking completed and saved!", {
              position: "top-right",
            });
            onRefresh?.();
          } else if (action === "quick-log") {
            toast.success("Entry logged successfully!", {
              position: "top-right",
            });
            onRefresh?.();
          }
        }
      } else {
        toast.error(fetcher.data.error || "Action failed", {
          position: "top-right",
        });
        // If tracking failed, reset the local state
        if (fetcher.formData?.get("_action") === "complete-tracking") {
          setIsTracking(false);
          setLocalTrackingStart(null);
        }
      }
    }
  }, [fetcher.data, fetcher.formData, onRefresh]);

  const handleStartTracking = () => {
    // Store start time locally - no database write yet
    const startTime = new Date().toISOString();
    setLocalTrackingStart(startTime);
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    if (!localTrackingStart) return;

    // Calculate duration and save the complete entry
    const endTime = new Date().toISOString();
    const formData = new FormData();
    formData.append("_action", "complete-tracking");
    formData.append("trackerId", tracker.id.toString());
    formData.append("startTime", localTrackingStart);
    formData.append("endTime", endTime);

    // Reset local tracking state
    setLocalTrackingStart(null);
    setIsTracking(false);

    fetcher.submit(formData, {
      method: "post",
      action: "/api/tracker-entries",
    });
  };

  const handleQuickLog = () => {
    const value = prompt(`Enter ${tracker.unit} to log:`);
    if (!value || isNaN(parseFloat(value))) return;

    const formData = new FormData();
    formData.append("_action", "quick-log");
    formData.append("trackerId", tracker.id.toString());
    formData.append("value", value);
    fetcher.submit(formData, {
      method: "post",
      action: "/api/tracker-entries",
    });
  };

  const formatDuration = (minutes: number, showSeconds = true) => {
    if (minutes < 1) {
      // Less than 1 minute, show seconds for precision
      const totalSeconds = Math.round(minutes * 60);
      if (totalSeconds === 0) {
        return "0s"; // Handle very small durations
      }
      return `${totalSeconds}s`;
    }

    if (minutes < 60) {
      if (showSeconds) {
        // While tracking, show minutes and seconds
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes - mins) * 60);
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
      }
      // For completed sessions, show minutes with decimal precision for small values
      if (minutes < 10) {
        return `${minutes.toFixed(1)}m`; // Show decimal for precision
      }
      return `${Math.round(minutes)}m`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (showSeconds && mins > 0) {
      // While tracking, show hours, minutes, and seconds
      const secs = Math.round(mins * 60);
      return `${hours}h ${secs}s`;
    }

    // For completed sessions, show hours and minutes
    return mins > 0 ? `${hours}h ${Math.round(mins)}m` : `${hours}h`;
  };

  const getElapsedTime = (startTime: string, showSeconds = false) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = diffMs / (1000 * 60); // Keep as decimal for seconds calculation
    return formatDuration(diffMins, showSeconds);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/25 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tracker.icon}</span>
            <CardTitle className="text-lg">{tracker.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge
              variant={tracker.type === "time" ? "default" : "secondary"}
              className="text-xs"
            >
              {tracker.type === "time" ? (
                <Timer className="w-3 h-3 mr-1" />
              ) : (
                <BarChart3 className="w-3 h-3 mr-1" />
              )}
              {tracker.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {tracker.unit}
            </Badge>
          </div>
        </div>
        {tracker.description && (
          <p className="text-sm text-muted-foreground">{tracker.description}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {tracker.type === "time" ? (
          <div className="space-y-3">
            {isTracking && localTrackingStart ? (
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">
                      Tracking: {elapsedTime}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleStopTracking}
                    disabled={fetcher.state !== "idle"}
                    className="bg-red-600 hover:bg-red-700 border-red-500/30"
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleStartTracking}
                disabled={fetcher.state !== "idle"}
                className="w-full"
                variant="outline"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={handleQuickLog}
              disabled={fetcher.state !== "idle"}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Quick Log
            </Button>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Total tracked:</span>
            <span className="font-medium text-slate-200">
              {tracker.type === "time"
                ? // For time trackers, show in hours:minutes format for completed sessions
                  stats
                  ? formatDuration(stats.totalValue)
                  : "0h 0m"
                : // For cumulative trackers, show total value
                  stats
                  ? stats.totalValue.toString()
                  : "0"}
            </span>
          </div>
          {tracker.type === "time" && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-400">Sessions:</span>
              <span className="font-medium text-slate-200">
                {stats ? stats.entryCount : 0}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          {showDetailLink && memberId && (
            <Link
              to={`/member/${memberId}/tracker/${tracker.id}`}
              className="flex-1"
            >
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </Link>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="flex-1 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
