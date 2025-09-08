import * as React from "react";
import { useFetcher } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Clock, Calendar, Trash2, Edit, BarChart3 } from "lucide-react";
import { toast } from "react-toastify";
import type { Tracker, TrackerEntry } from "~/db/schema";

interface TrackerHistoryProps {
  tracker: Tracker;
  entries: TrackerEntry[];
  onRefresh?: () => void;
  onEditEntry?: (entry: TrackerEntry) => void;
}

export function TrackerHistory({
  tracker,
  entries,
  onRefresh,
  onEditEntry,
}: TrackerHistoryProps) {
  const fetcher = useFetcher();
  const [filteredEntries, setFilteredEntries] =
    React.useState<TrackerEntry[]>(entries);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [timeRange, setTimeRange] = React.useState("7");
  const [sortBy, setSortBy] = React.useState("newest");

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        if (fetcher.data.action === "delete-entry") {
          toast.success("Entry deleted successfully!", {
            position: "top-right",
          });
          onRefresh?.();
        }
      } else {
        toast.error(fetcher.data.error || "Action failed", {
          position: "top-right",
        });
      }
    }
  }, [fetcher.data, onRefresh]);

  React.useEffect(() => {
    let filtered = [...entries];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        entry =>
          entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by time range
    if (timeRange !== "all") {
      const days = parseInt(timeRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(
        entry => entry.createdAt && new Date(entry.createdAt) >= cutoffDate
      );
    }

    // Sort entries
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || "").getTime() -
          new Date(b.createdAt || "").getTime()
        );
      } else if (sortBy === "value-high") {
        return b.value - a.value;
      } else if (sortBy === "value-low") {
        return a.value - b.value;
      }
      return 0;
    });

    setFilteredEntries(filtered);
  }, [entries, searchTerm, timeRange, sortBy]);

  const handleDeleteEntry = (entry: TrackerEntry) => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    const formData = new FormData();
    formData.append("action", "delete-entry");
    formData.append("id", entry.id.toString());
    fetcher.submit(formData, {
      method: "post",
      action: "/api/tracker-entries",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatValue = (value: number) => {
    if (tracker.type === "time") {
      return formatDuration(value);
    }
    return `${value} ${tracker.unit}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTotalValue = () => {
    return filteredEntries.reduce((sum, entry) => sum + entry.value, 0);
  };

  const getAverageValue = () => {
    if (filteredEntries.length === 0) return 0;
    return Math.round(getTotalValue() / filteredEntries.length);
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total {tracker.unit}
                </p>
                <p className="text-2xl font-bold">
                  {formatValue(getTotalValue())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Entries</p>
                <p className="text-2xl font-bold">{filteredEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-2xl font-bold">
                  {formatValue(getAverageValue())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search notes or tags..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeRange">Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="value-high">Highest value</SelectItem>
                  <SelectItem value="value-low">Lowest value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setTimeRange("7");
                  setSortBy("newest");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No entries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-sm">
                        {formatValue(entry.value)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {entry.createdAt
                          ? formatDate(entry.createdAt)
                          : "Unknown date"}
                      </span>
                      {entry.isActive && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm mb-1">{entry.notes}</p>
                    )}
                    {entry.tags && (
                      <div className="flex gap-1">
                        {entry.tags.split(",").map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {onEditEntry && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditEntry(entry)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEntry(entry)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
