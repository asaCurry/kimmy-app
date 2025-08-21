import * as React from "react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./card";
import { Button } from "./button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import { RecordContentDisplay } from "./record-content-display";
import { DateDisplay, RelativeDate } from "./date-display";
import {
  Edit,
  Trash2,
  Lock,
  Calendar,
  User as UserIcon,
  Tag,
  ArrowLeft,
} from "lucide-react";
import type { Record, RecordType, User } from "~/db/schema";

interface RecordDetailViewProps {
  record: Record;
  recordType: RecordType;
  householdMembers: User[];
  memberId: string;
  category: string;
  recordTypeId: string;
  onDelete?: (recordId: number) => void;
  isDeleting?: boolean;
  className?: string;
}

export const RecordDetailView: React.FC<RecordDetailViewProps> = ({
  record,
  recordType,
  householdMembers,
  memberId,
  category,
  recordTypeId,
  onDelete,
  isDeleting = false,
  className = "",
}) => {
  // Find the member this record is about
  const recordMember = householdMembers.find(m => m.id === record.memberId);

  // Find who created the record
  const recordCreator = householdMembers.find(m => m.id === record.createdBy);

  // Parse the fields JSON for the record type
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
      }

      return {
        ...recordType,
        fields: normalizedFields,
      };
    } catch (_error) {
      return {
        ...recordType,
        fields: [],
      };
    }
  }, [recordType]);

  const handleDelete = () => {
    if (
      onDelete &&
      confirm(`Are you sure you want to delete "${record.title}"?`)
    ) {
      onDelete(record.id);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/member/${memberId}`}>
                {recordMember?.name || "Member"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to={`/member/${memberId}/category/${encodeURIComponent(category)}`}
              >
                {category}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{recordType.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back Button */}
      <div className="flex items-center">
        <Link
          to={`/member/${memberId}/category/${encodeURIComponent(category)}`}
          className="inline-flex items-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {category} records
        </Link>
      </div>

      {/* Main Record Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl">{recordType.icon || "📝"}</span>
                <div>
                  <CardTitle className="text-2xl text-slate-100">
                    {record.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {recordType.name} • {category}
                  </CardDescription>
                </div>
              </div>

              {/* Privacy Indicator */}
              {record.isPrivate && (
                <div className="flex items-center space-x-2 text-yellow-500 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Private record - only visible to you</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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
                maxFields={10} // Show more fields in detail view
              />
            )}
          </div>

          {/* Metadata Section */}
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h4 className="text-lg font-medium text-slate-200">
              Record Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {record.updatedAt && record.updatedAt !== record.createdAt && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-400">Last updated</div>
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
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-400">About</div>
                    <div className="text-slate-200">
                      {recordMember?.name || "Unknown Member"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-400">Created by</div>
                    <div className="text-slate-200">
                      {recordCreator?.name || "Unknown User"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
        </CardContent>

        {/* Action Buttons */}
        <CardFooter className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <Link
              to={`/member/${memberId}/category/${encodeURIComponent(category)}/record/${recordTypeId}/edit/${record.id}`}
            >
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Record
              </Button>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="border-red-600 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
