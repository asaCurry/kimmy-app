import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Clock, User, Tag, Lock, Eye, Edit } from "lucide-react";
import { cn } from "~/lib/utils";
import { useRecordManagement } from "~/contexts/record-management-context";
import type { RecordType } from "~/db/schema";

interface RecentRecord {
  id: number;
  title: string;
  content: string | null;
  memberId: number | null;
  memberName: string;
  recordTypeId: number | null;
  recordTypeName: string;
  recordTypeCategory: string;
  recordTypeIcon: string;
  recordTypeColor: string;
  createdAt: string | null;
  datetime?: string | null;
  isPrivate: number | null;
  tags?: string | null;
}

interface RecentRecordsListProps {
  records: RecentRecord[];
}

export const RecentRecordsList: React.FC<RecentRecordsListProps> = ({
  records,
}) => {
  const { openRecord } = useRecordManagement();

  if (records.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">
            No records yet
          </h3>
          <p className="text-slate-400">
            Start creating records to see recent activity here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Health: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      Activities: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Personal: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Education: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Finance: "bg-green-500/20 text-green-400 border-green-500/30",
      Food: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      Travel: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      Home: "bg-stone-500/20 text-stone-400 border-stone-500/30",
    };

    return (
      colors[category] || "bg-slate-500/20 text-slate-400 border-slate-500/30"
    );
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Clock className="w-5 h-5 text-blue-400" />
          Recent Household Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {records.map(record => (
          <div
            key={record.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            {/* Record Type Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-lg">
              {record.recordTypeIcon}
            </div>

            {/* Record Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-slate-100 truncate">
                  {record.title}
                </h4>
                {record.isPrivate && (
                  <Lock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>

              {/* Record Type and Member */}
              <div className="flex items-center gap-2 mb-2 text-sm">
                <span
                  className={cn(
                    "px-2 py-1 text-xs rounded-full border",
                    getCategoryColor(record.recordTypeCategory)
                  )}
                >
                  {record.recordTypeCategory}
                </span>
                <span className="text-slate-400">•</span>
                <div className="flex items-center gap-1 text-slate-400">
                  <User className="w-3 h-3" />
                  <span>{record.memberName}</span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400">{record.recordTypeName}</span>
              </div>

              {/* Tags */}
              {record.tags && (
                <div className="flex items-center gap-1 mb-2">
                  <Tag className="w-3 h-3 text-slate-500" />
                  <div className="flex flex-wrap gap-1">
                    {record.tags
                      .split(",")
                      .slice(0, 3)
                      .map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full border border-slate-600"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(record.createdAt || "")}</span>
                {record.datetime && record.datetime !== record.createdAt && (
                  <>
                    <span>•</span>
                    <span>Happened: {formatDate(record.datetime || "")}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  // Create a mock record type object for the context
                  const mockRecordType: RecordType = {
                    id: record.recordTypeId || 0,
                    name: record.recordTypeName,
                    description: "",
                    category: record.recordTypeCategory,
                    householdId: "",
                    fields: "[]",
                    icon: record.recordTypeIcon,
                    color: record.recordTypeColor,
                    allowPrivate: record.isPrivate ? 1 : 0,
                    createdBy: null,
                    createdAt: "",
                  };

                  // Create a mock record object for the context
                  const mockRecord = {
                    id: record.id,
                    title: record.title,
                    content: record.content,
                    recordTypeId: record.recordTypeId,
                    householdId: "",
                    memberId: record.memberId,
                    createdBy: null,
                    tags: record.tags || null,
                    attachments: null,
                    isPrivate: record.isPrivate,
                    datetime: record.datetime || null,
                    createdAt: record.createdAt || "",
                    updatedAt: null,
                  };

                  openRecord(mockRecord, mockRecordType);
                }}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Eye className="w-3 h-3" />
                View
              </button>

              <Link
                to={`/member/${record.memberId}/category/${encodeURIComponent(record.recordTypeCategory)}/record/${record.recordTypeId}/edit/${record.id}`}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                <Edit className="w-3 h-3" />
                Edit
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
