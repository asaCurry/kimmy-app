import type { Route } from "./+types/trackers";
import * as React from "react";
import { useLoaderData, useFetcher, useRevalidator } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth } from "~/contexts/auth-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { TrackerCard } from "~/components/tracker-card";
import { CreateTrackerForm } from "~/components/create-tracker-form";
import { Plus, BarChart3, Timer, Clock, TrendingUp } from "lucide-react";
import { toast } from "react-toastify";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { TrackerDB } from "~/lib/tracker-db";
import type { Tracker } from "~/db/schema";
import { Navigation } from "~/components/navigation";

export async function loader({ request, context }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    const trackerDB = new TrackerDB(db);
    const [trackers, activeEntries, trackerEntries] = await Promise.all([
      trackerDB.getTrackers(session.currentHouseholdId),
      trackerDB.getActiveTimeTracking(session.currentHouseholdId),
      trackerDB.getAllTrackerEntries(session.currentHouseholdId),
    ]);

    return { success: true, trackers, activeEntries, trackerEntries };
  });
}


export default function TrackersPage() {
  const { trackers, activeEntries, trackerEntries } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingTracker, setEditingTracker] = React.useState<Tracker | null>(null);

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        if (fetcher.data.action === "delete") {
          toast.success("Tracker deleted successfully!", { position: "top-right" });
          revalidator.revalidate();
        }
      } else {
        toast.error(fetcher.data.error || "Action failed", { position: "top-right" });
      }
    }
  }, [fetcher.data]); // Remove revalidator from dependency array

  const handleDeleteTracker = (tracker: Tracker) => {
    if (!confirm(`Are you sure you want to delete "${tracker.name}"? This will also delete all associated entries.`)) {
      return;
    }

    const formData = new FormData();
    formData.append("_action", "delete");
    formData.append("id", tracker.id.toString());
    fetcher.submit(formData, { method: "post" });
  };

  const handleEditTracker = (tracker: Tracker) => {
    setEditingTracker(tracker);
    setShowCreateForm(true);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingTracker(null);
    revalidator.revalidate();
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingTracker(null);
  };

  const getActiveEntryForTracker = (trackerId: number) => {
    return activeEntries.find(entry => entry.trackerId === trackerId);
  };

  const getTrackerStats = (tracker: Tracker) => {
    const entries = trackerEntries.filter(entry => entry.trackerId === tracker.id);
    
    if (entries.length === 0) {
      return {
        totalValue: 0,
        entryCount: 0,
        averageValue: 0,
      };
    }

    const totalValue = entries.reduce((sum, entry) => sum + (entry.value || 0), 0);
    const entryCount = entries.length;
    const averageValue = entryCount > 0 ? totalValue / entryCount : 0;

    return {
      totalValue,
      entryCount,
      averageValue,
    };
  };

  const getPageStats = () => {
    const totalTrackers = trackers?.length || 0;
    const activeTrackers = activeEntries?.length || 0;
    const timeTrackers = trackers?.filter(t => t.type === "time").length || 0;
    const cumulativeTrackers = trackers?.filter(t => t.type === "cumulative").length || 0;

    return {
      totalTrackers,
      activeTrackers,
      timeTrackers,
      cumulativeTrackers,
    };
  };

  const stats = getPageStats();

  if (!trackers) {
    return (
      <RequireAuth>
        <PageLayout>
          <PageHeader title="Trackers" subtitle="Manage your household's activity trackers" />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading trackers...</p>
            </div>
          </div>
        </PageLayout>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <PageLayout>
        <Navigation currentView="home" />
        <PageHeader 
          title="Trackers" 
          subtitle="Monitor activities, track time, and log progress across your household" 
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-blue-400">{stats.totalTrackers}</p>
                  <p className="text-sm text-slate-400">Total Trackers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-400">{stats.activeTrackers}</p>
                  <p className="text-sm text-slate-400">Active Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Timer className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-purple-400">{stats.timeTrackers}</p>
                  <p className="text-sm text-slate-400">Time Trackers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold text-orange-400">{stats.cumulativeTrackers}</p>
                  <p className="text-sm text-slate-400">Log Trackers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Tracker
          </Button>
        </div>

        {/* Trackers Grid */}
        {trackers.length === 0 ? (
          <Card className="text-center py-12 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardContent>
              <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-200 mb-2">No Trackers Yet</h3>
              <p className="text-slate-400 mb-4">
                Create your first tracker to start monitoring activities and progress.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Tracker
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackers.map((tracker) => (
              <TrackerCard
                key={tracker.id}
                tracker={tracker}
                activeEntry={getActiveEntryForTracker(tracker.id)}
                onEdit={() => handleEditTracker(tracker)}
                onDelete={() => handleDeleteTracker(tracker)}
                onRefresh={() => revalidator.revalidate()}
                showDetailLink={true}
                stats={getTrackerStats(tracker)}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <CreateTrackerForm
                tracker={editingTracker}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}
      </PageLayout>
    </RequireAuth>
  );
}
