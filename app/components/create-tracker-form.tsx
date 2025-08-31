import * as React from "react";
import { useFetcher } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { createTrackerSchema, updateTrackerSchema } from "~/lib/schemas";
import type {
  CreateTrackerInput,
  UpdateTrackerInput,
  Tracker,
} from "~/lib/schemas";
import type { User } from "~/db/schema";
import { toast } from "react-toastify";
import { useAuth } from "~/contexts/auth-context";

interface CreateTrackerFormProps {
  tracker?: Tracker;
  householdMembers?: User[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TRACKER_TYPES = [
  {
    value: "time",
    label: "Time Tracking",
    description: "Start/stop timer for activities",
  },
  {
    value: "cumulative",
    label: "Cumulative Log",
    description: "Sum of multiple entries",
  },
];

const UNITS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "count", label: "Count" },
  { value: "pages", label: "Pages" },
  { value: "miles", label: "Miles" },
  { value: "km", label: "Kilometers" },
  { value: "calories", label: "Calories" },
  { value: "custom", label: "Custom" },
];

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

const ICONS = ["⏱️", "🏃‍♂️", "📚", "💪", "🧘‍♀️", "🎯", "📝", "🎨", "🎵", "🍳"];

export function CreateTrackerForm({
  tracker,
  householdMembers = [],
  onSuccess,
  onCancel,
}: CreateTrackerFormProps) {
  const fetcher = useFetcher();
  const { session } = useAuth();
  const [customUnit, setCustomUnit] = React.useState(tracker?.unit || "");
  const [customIcon, setCustomIcon] = React.useState(tracker?.icon || "⏱️");
  
  // Member visibility state
  const [visibleToMembers, setVisibleToMembers] = React.useState<number[]>(() => {
    if (tracker?.visibleToMembers) {
      try {
        return JSON.parse(tracker.visibleToMembers);
      } catch {
        return [];
      }
    }
    return []; // Default to all members
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateTrackerInput>({
    resolver: zodResolver(createTrackerSchema),
    defaultValues: tracker
      ? {
          name: tracker.name,
          description: tracker.description || "",
          type: (tracker.type as "time" | "cumulative") || "time",
          unit: tracker.unit,
          color: tracker.color || "#3b82f6",
          icon: tracker.icon || "⏱️",
        }
      : {
          name: "",
          description: "",
          type: "time",
          unit: "minutes",
          color: "#3b82f6",
          icon: "⏱️",
        },
  });

  const selectedType = watch("type");
  const selectedUnit = watch("unit");

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        toast.success(
          tracker
            ? "Tracker updated successfully!"
            : "Tracker created successfully!",
          { position: "top-right" }
        );
        onSuccess?.();
      } else {
        console.error("Tracker creation failed:", fetcher.data.error);
        toast.error(fetcher.data.error || "Failed to save tracker", {
          position: "top-right",
        });
      }
    }
  }, [fetcher.data, tracker, onSuccess]);

  const onSubmit = (data: CreateTrackerInput) => {
    const formData = new FormData();
    formData.append("_action", tracker ? "update" : "create");

    if (tracker) {
      formData.append("id", tracker.id.toString());
    }

    formData.append("name", data.name);
    formData.append("description", data.description || "");
    formData.append("type", data.type);
    formData.append("unit", selectedUnit === "custom" ? customUnit : data.unit);
    formData.append("color", data.color);
    formData.append("icon", customIcon);
    formData.append("visibleToMembers", JSON.stringify(visibleToMembers));

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100">
          {tracker ? "Edit Tracker" : "Create New Tracker"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Reading Time, Exercise, Work Hours"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Optional description of what this tracker measures"
              rows={2}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={selectedType}
              onValueChange={value =>
                setValue("type", value as "time" | "cumulative")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACKER_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Select
              value={selectedUnit}
              onValueChange={value => setValue("unit", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map(unit => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUnit === "custom" && (
              <Input
                placeholder="Enter custom unit (e.g., chapters, sets)"
                value={customUnit}
                onChange={e => setCustomUnit(e.target.value)}
                className="mt-2"
              />
            )}
            {errors.unit && (
              <p className="text-sm text-destructive">{errors.unit.message}</p>
            )}
          </div>

          {/* Member Visibility Section */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              Available for members
            </Label>
            <p className="text-sm text-slate-400 mb-2">
              Choose which household members can use this tracker. Select "All members" to make it available to everyone.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="all-members-tracker"
                  checked={visibleToMembers.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVisibleToMembers([]);
                    } else {
                      // When unchecking "all members", select current user only as fallback
                      setVisibleToMembers(session?.userId ? [session.userId] : []);
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer transition-all duration-200"
                />
                <label htmlFor="all-members-tracker" className="text-sm text-slate-300 cursor-pointer">
                  All household members
                </label>
              </div>
              
              <div className="text-xs text-slate-500 ml-6">
                Or select specific members:
              </div>
              
              {householdMembers && householdMembers.length > 0 && (
                <div className="ml-6 space-y-2">
                  {householdMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`tracker-member-${member.id}`}
                        checked={visibleToMembers.length === 0 || visibleToMembers.includes(member.id)}
                        onChange={(e) => {
                          if (visibleToMembers.length === 0) {
                            // If "all members" was selected, switching to specific selection
                            if (!e.target.checked) {
                              // User is unchecking a member when all were selected
                              // Select all other members except this one
                              const allOtherMembers = householdMembers
                                .filter(m => m.id !== member.id)
                                .map(m => m.id);
                              setVisibleToMembers(allOtherMembers);
                            }
                            // If checking when all selected, do nothing (already selected)
                          } else {
                            // Normal toggle behavior for specific selection
                            if (e.target.checked) {
                              const newMembers = [...visibleToMembers, member.id];
                              // If all members are now selected, switch to "all members" mode
                              if (newMembers.length === householdMembers.length) {
                                setVisibleToMembers([]);
                              } else {
                                setVisibleToMembers(newMembers);
                              }
                            } else {
                              const newMembers = visibleToMembers.filter(id => id !== member.id);
                              setVisibleToMembers(newMembers);
                            }
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer transition-all duration-200"
                      />
                      <label htmlFor={`tracker-member-${member.id}`} className="text-sm text-slate-300 cursor-pointer">
                        {member.name}
                        {member.role === 'admin' && (
                          <span className="ml-1 text-xs text-blue-400">(Admin)</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    setCustomIcon(icon);
                    setValue("icon", icon);
                  }}
                  className={`p-2 text-lg rounded border-2 transition-all hover:scale-105 ${
                    customIcon === icon
                      ? "border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/50"
                      : "border-slate-600 hover:border-blue-500/50 hover:bg-slate-700/50"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            {errors.icon && (
              <p className="text-sm text-destructive">{errors.icon.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    watch("color") === color
                      ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                      : "border-slate-600"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || fetcher.state !== "idle"}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting || fetcher.state !== "idle"
                ? "Saving..."
                : tracker
                  ? "Update"
                  : "Create"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-slate-600 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
