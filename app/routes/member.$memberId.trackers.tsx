import type { Route } from "./+types/member.$memberId.trackers";
import * as React from "react";
import { useLoaderData, useFetcher, useRevalidator, useParams } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { TrackerCard } from "~/components/tracker-card";
import { CreateTrackerForm } from "~/components/create-tracker-form";
import { Plus, BarChart3, Timer, Clock } from "lucide-react";
import { toast } from "react-toastify";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { TrackerDB } from "~/lib/tracker-db";
import type { Tracker, TrackerEntry } from "~/db/schema";

export async function loader({ request, context }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    const trackerDB = new TrackerDB(db);
    const [trackers, activeEntries, trackerEntries] = await Promise.all([
      trackerDB.getTrackers(session.currentHouseholdId),
      trackerDB.getActiveTimeTracking(session.currentHouseholdId),
      trackerDB.getAllTrackerEntries(session.currentHouseholdId),
    ]);

    console.log("Loader fetched data:", {
      trackersCount: trackers.length,
      activeEntriesCount: activeEntries.length,
      trackerEntriesCount: trackerEntries.length,
      sampleTrackerEntries: trackerEntries.slice(0, 3)
    });
    console.log("trackerEntries", trackerEntries);
    return { success: true, trackers, activeEntries, trackerEntries };
  });
}

export async function action({ request, context }: Route.ActionArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    const formData = await request.formData();
    const action = formData.get("_action") as string;

    console.log("Member trackers action received:", action);
    console.log("Form data contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const trackerDB = new TrackerDB(db);

    switch (action) {
      case "create": {
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const type = formData.get("type") as "time" | "cumulative";
        const unit = formData.get("unit") as string;
        const color = formData.get("color") as string;
        const icon = formData.get("icon") as string;

        if (!name || !type || !unit) {
          throw new Response("Missing required fields", { status: 400 });
        }

        const newTracker = await trackerDB.createTracker({
          name,
          description: description || "",
          type,
          unit,
          color: color || "#3b82f6",
          icon: icon || "⏱️",
        }, session.currentHouseholdId, session.userId);

        return { success: true, tracker: newTracker };
      }
      
      case "update": {
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const type = formData.get("type") as "time" | "cumulative";
        const unit = formData.get("unit") as string;
        const color = formData.get("color") as string;
        const icon = formData.get("icon") as string;

        if (!id || !name || !type || !unit) {
          throw new Response("Missing required fields", { status: 400 });
        }

        const updatedTracker = await trackerDB.updateTracker(parseInt(id), {
          name,
          description: description || "",
          type,
          unit,
          color: color || "#3b82f6",
          icon: icon || "⏱️",
        }, session.currentHouseholdId);

        return { success: true, tracker: updatedTracker };
      }
      
      case "delete": {
        const id = formData.get("id") as string;
        if (!id) {
          throw new Response("Missing tracker ID", { status: 400 });
        }

        await trackerDB.deleteTracker(parseInt(id), session.currentHouseholdId);
        
        return { success: true, action: "delete" };
      }
      
      default:
        throw new Response("Invalid action", { status: 400 });
    }
  });
}

export default function TrackersPage() {
  const { trackers, activeEntries, trackerEntries } = useLoaderData<typeof loader>();
  const { session } = useAuth();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingTracker, setEditingTracker] = React.useState<Tracker | null>(null);
  const { memberId } = useParams();

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
    console.log("getTrackerStats called for tracker:", tracker.id);
    console.log("All trackerEntries:", trackerEntries);
    
    const entries = trackerEntries.filter(entry => entry.trackerId === tracker.id);
    console.log("Filtered entries for tracker", tracker.id, ":", entries);
    
    if (entries.length === 0) {
      console.log("No entries found for tracker", tracker.id);
      return {
        totalValue: 0,
        entryCount: 0,
        averageValue: 0,
      };
    }

    const totalValue = entries.reduce((sum, entry) => {
      console.log("Entry value:", entry.value, "Current sum:", sum);
      return sum + (entry.value || 0);
    }, 0);
    
    const entryCount = entries.length;
    const averageValue = entryCount > 0 ? totalValue / entryCount : 0;

    console.log("Calculated stats for tracker", tracker.id, ":", { totalValue, entryCount, averageValue });

    return {
      totalValue,
      entryCount,
      averageValue,
    };
  };

  if (!trackers) {
    return (
      <RequireAuth>
        <PageLayout>
          <PageHeader title="Trackers" />
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading trackers...</p>
          </div>
        </PageLayout>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <PageLayout>
        <Navigation currentView="categories" member={trackers[0] ? { id: parseInt(memberId!), name: "Member", email: "", role: "member" as const } : undefined} />
        <PageHeader title="Trackers">
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Tracker
          </Button>
        </PageHeader>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {showCreateForm ? (
            <div className="flex justify-center">
              <CreateTrackerForm
                tracker={editingTracker}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          ) : (
            <>
              {trackers.length === 0 ? (
                <Card className="text-center py-12 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                  <CardContent>
                    <BarChart3 className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-slate-200">No trackers yet</h3>
                    <p className="text-slate-400 mb-4">
                      Create your first tracker to start monitoring activities, time, or progress.
                    </p>
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Tracker
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Active Tracking Section */}
                  {activeEntries.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-200">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Currently Tracking
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeEntries.map((entry) => {
                          const tracker = trackers.find(t => t.id === entry.trackerId);
                          if (!tracker) return null;
                          
                          return (
                            <TrackerCard
                              key={entry.id}
                              tracker={tracker}
                              activeEntry={entry}
                              onEdit={() => handleEditTracker(tracker)}
                              onDelete={() => handleDeleteTracker(tracker)}
                              onRefresh={() => revalidator.revalidate()}
                              showDetailLink={true}
                              memberId={parseInt(memberId!)}
                              stats={getTrackerStats(tracker)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All Trackers Section */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-200">
                      <BarChart3 className="w-5 h-5 text-slate-400" />
                      All Trackers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trackers.map((tracker) => {
                        const activeEntry = getActiveEntryForTracker(tracker.id);
                        const stats = getTrackerStats(tracker);
                        
                        return (
                          <TrackerCard
                            key={tracker.id}
                            tracker={tracker}
                            activeEntry={activeEntry}
                            onEdit={() => handleEditTracker(tracker)}
                            onDelete={() => handleDeleteTracker(tracker)}
                            onRefresh={() => revalidator.revalidate()}
                            showDetailLink={true}
                            memberId={parseInt(memberId!)}
                            stats={stats}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </PageLayout>
    </RequireAuth>
  );
}
