import * as React from "react";
import { Eye, Edit, Trash2, Lock } from "lucide-react";
import { Button } from "./button";
import { DateDisplay, RelativeDate } from "./date-display";
import { RecordContentDisplay } from "./record-content-display";
import type { Record, RecordType } from "~/db/schema";

interface RecordsTableProps {
  records: Record[];
  recordType: RecordType;
  _memberId: string;
  _category: string;
  _householdId: string;
  onDelete: (recordId: number) => void;
  isDeleting: boolean;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  recordType,
  _memberId,
  _category,
  _householdId,
  onDelete,
  isDeleting,
}) => {
  // Parse record type fields for better content display
  const parsedRecordType = React.useMemo(() => {
    try {
      return {
        ...recordType,
        fields: recordType.fields ? JSON.parse(recordType.fields) : [],
      };
    } catch (error) {
      console.error("RecordsTable - Error parsing record type fields:", error);
      return { ...recordType, fields: [] };
    }
  }, [recordType]);

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📝</div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          No {recordType.name} records yet
        </h3>
        <p className="text-slate-400">
          Get started by creating your first {recordType.name.toLowerCase()}{" "}
          record.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 font-medium text-slate-300">
              Title
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">
              Content
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">
              Tags
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">
              Happened
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">
              Recorded
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">
              Privacy
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {records.map(record => (
            <tr
              key={record.id}
              className="hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4">
                <div
                  className="font-medium text-slate-100 max-w-xs truncate"
                  title={record.title}
                >
                  {record.title}
                </div>
              </td>
              <td className="py-3 px-4 max-w-xs">
                <RecordContentDisplay
                  content={record.content}
                  recordType={parsedRecordType}
                  maxFields={2}
                  className="text-xs"
                />
              </td>
              <td className="py-3 px-4">
                {record.tags ? (
                  <div className="flex flex-wrap gap-1">
                    {record.tags
                      .split(",")
                      .slice(0, 2)
                      .map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full border border-slate-600"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    {record.tags.split(",").length > 2 && (
                      <span className="px-2 py-1 bg-slate-700/30 text-slate-500 text-xs rounded-full border border-slate-600">
                        +{record.tags.split(",").length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500 text-xs">No tags</span>
                )}
              </td>
              <td className="py-3 px-4">
                {record.datetime && record.datetime !== record.createdAt ? (
                  <DateDisplay
                    date={record.datetime}
                    format="short"
                    className="text-xs"
                  />
                ) : (
                  <span className="text-slate-500 text-xs">
                    Same as recorded
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <RelativeDate date={record.createdAt} className="text-xs" />
              </td>
              <td className="py-3 px-4">
                {record.isPrivate ? (
                  <div className="flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-yellow-500" />
                    <span className="text-yellow-400 text-xs">Private</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Shared</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-7 px-2"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 h-7 px-2"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(record.id)}
                    disabled={isDeleting}
                    className="border-red-600 text-red-400 hover:bg-red-900/20 h-7 px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
