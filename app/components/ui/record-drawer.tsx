import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  Button,
  RecordContentDisplay,
  DateDisplay,
  RelativeDate,
} from "~/components/ui";
import { DynamicRecordForm } from "~/components/dynamic-record-form";
import { useRecordManagement } from "~/contexts";
import {
  Edit,
  Trash2,
  Lock,
  Calendar,
  User,
  Tag,
  Eye,
  Save,
  X,
} from "lucide-react";
import type { Record, RecordType } from "~/db/schema";

interface RecordDrawerProps {
  householdId: string;
  memberId: string;
  category: string;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  householdId,
  memberId,
  category,
}) => {
  const {
    selectedRecord: record,
    selectedRecordType: recordType,
    isDrawerOpen: isOpen,
    drawerMode: mode,
    isDeleting,
    isUpdating,
    closeRecord: onClose,
    setDrawerMode: setMode,
    deleteRecord: onDelete,
    updateRecord: onUpdate,
    householdMembers,
  } = useRecordManagement();

  // Reset mode when drawer opens/closes or record changes
  React.useEffect(() => {
    if (isOpen) {
      setMode("view");
    }
  }, [isOpen, record?.id]);

  // Parse the fields JSON for the record type - moved before conditional return
  const parsedRecordType = React.useMemo(() => {
    if (!recordType?.fields) return null;

    try {
      let parsed;
      if (typeof recordType.fields === "string") {
        parsed = JSON.parse(recordType.fields);
      } else if (Array.isArray(recordType.fields)) {
        parsed = recordType.fields;
      } else {
        parsed = recordType.fields;
      }

      let normalizedFields = [];
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.fields)
      ) {
        normalizedFields = parsed.fields;
      } else if (Array.isArray(parsed)) {
        normalizedFields = parsed;
      } else {
        normalizedFields = [];
      }

      return {
        ...recordType,
        fields: normalizedFields,
      };
    } catch (error) {
      return {
        ...recordType,
        fields: [],
      };
    }
  }, [recordType]);

  if (!record || !recordType) {
    return null;
  }

  // Find the member this record is about
  const recordMember = householdMembers.find(m => m.id === record.memberId);

  // Find who created the record
  const recordCreator = householdMembers.find(m => m.id === record.createdBy);

  const handleDelete = async () => {
    if (
      onDelete &&
      confirm(`Are you sure you want to delete "${record.title}"?`)
    ) {
      await onDelete(record.id);
    }
  };

  const handleUpdate = async (updates: Partial<Record>) => {
    if (onUpdate) {
      try {
        await onUpdate(record.id, updates);
        setMode("view"); // Switch back to view mode after successful update
      } catch (error) {
        console.error("Failed to update record:", error);
        // You could show an error toast here
      }
    }
  };

  const handleClose = () => {
    if (mode === "edit") {
      // Ask for confirmation if there are unsaved changes
      if (
        confirm("You have unsaved changes. Are you sure you want to close?")
      ) {
        setMode("view");
        onClose();
      }
    } else {
      onClose();
    }
  };

  const drawerTitle =
    mode === "view"
      ? `${recordType.name}: ${record.title}`
      : `Edit ${recordType.name}`;

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={drawerTitle} size="xl">
      {mode === "view" ? (
        // View Mode
        <>
          <DrawerContent className="space-y-6">
            {/* Record Content */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-slate-200">
                Record Details
              </h4>
              {parsedRecordType && (
                <RecordContentDisplay
                  content={record.content}
                  recordType={parsedRecordType}
                  className="text-sm"
                  maxFields={15} // Show more fields in drawer view
                />
              )}
            </div>

            {/* Metadata Section */}
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <h4 className="text-lg font-medium text-slate-200">
                Record Information
              </h4>

              <div className="grid grid-cols-1 gap-4">
                {/* Dates */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-400">
                        When it happened
                      </div>
                      <div className="text-slate-200">
                        {record.datetime &&
                        record.datetime !== record.createdAt ? (
                          <DateDisplay date={record.datetime} format="long" />
                        ) : (
                          <span className="text-slate-500 italic">
                            Not specified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-400">Recorded on</div>
                      <div className="text-slate-200">
                        <DateDisplay date={record.createdAt} format="long" />
                      </div>
                    </div>
                  </div>

                  {record.updatedAt &&
                    record.updatedAt !== record.createdAt && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-400">
                            Last updated
                          </div>
                          <div className="text-slate-200">
                            <RelativeDate date={record.updatedAt} />
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* People */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-400">About</div>
                      <div className="text-slate-200">
                        {recordMember?.name || "Unknown Member"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-400">Created by</div>
                      <div className="text-slate-200">
                        {recordCreator?.name || "Unknown User"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Indicator */}
                {record.isPrivate && (
                  <div className="flex items-center space-x-2 text-yellow-500 text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Private record - only visible to you</span>
                  </div>
                )}

                {/* Tags */}
                {record.tags && (
                  <div className="flex items-start space-x-3 pt-2">
                    <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {record.tags.split(",").map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-full border border-slate-600"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DrawerContent>

          <DrawerFooter>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setMode("edit")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Record
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </>
      ) : (
        // Edit Mode
        <>
          <DrawerContent>
            {parsedRecordType && (
              <DynamicRecordForm
                recordType={parsedRecordType}
                householdId={householdId}
                memberId={parseInt(memberId)}
                createdBy={record.createdBy || undefined}
                initialData={record}
                onSubmit={handleUpdate}
                onCancel={() => setMode("view")}
                isSubmitting={isUpdating}
                mode="edit"
              />
            )}
          </DrawerContent>
        </>
      )}
    </Drawer>
  );
};
