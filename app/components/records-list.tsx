import * as React from "react";
import { useFetcher, Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus, Eye, Edit, Trash2, Lock, Grid3X3, Table } from "lucide-react";
import { DateDisplay, RelativeDate } from "~/components/ui/date-display";
import { RecordContentDisplay } from "~/components/ui/record-content-display";
import { Accordion, AccordionItem } from "~/components/ui/accordion";
import { RecordsTable } from "~/components/ui/records-table";
import type { Record, RecordType } from "~/db/schema";

interface RecordsListProps {
  records: Record[];
  recordType: RecordType;
  memberId: string;
  category: string;
  familyId: string;
}

export const RecordsList: React.FC<RecordsListProps> = ({
  records,
  recordType,
  memberId,
  category,
  familyId,
}) => {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state === "submitting";
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");

  const handleDelete = (recordId: number) => {
    if (confirm("Are you sure you want to delete this record?")) {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("recordId", recordId.toString());

      fetcher.submit(formData, {
        method: "post",
        action: "/api/records",
      });
    }
  };

  // Parse record type fields for better content display
  const parsedRecordType = React.useMemo(() => {
    try {
      return {
        ...recordType,
        fields: recordType.fields ? JSON.parse(recordType.fields) : [],
      };
    } catch (error) {
      console.error("RecordsList - Error parsing record type fields:", error);
      return { ...recordType, fields: [] };
    }
  }, [recordType]);

  const recordCount = records.length;
  const subtitle = `${recordCount} record${recordCount !== 1 ? "s" : ""} found`;

  return (
    <AccordionItem
      title={recordType.name}
      subtitle={subtitle}
      defaultOpen={false}
      className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700"
      memberId={Number(memberId)}
      category={category}
      recordType={recordType}
    >
      <div className="space-y-4">
        {/* Header with Create Button and View Toggle */}
        <div className="pt-2 flex items-center justify-end">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">View as:</span>
              <div className="flex border border-slate-600 rounded-lg overflow-hidden ">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={`h-8 px-3 rounded-none ${
                    viewMode === "cards"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={`h-8 px-3 rounded-none ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Table className="w-4 h-4 mr-2" />
                  Table
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Records Display */}
        {viewMode === "cards" ? (
          <RecordsCards
            records={records}
            recordType={recordType}
            memberId={memberId}
            category={category}
            familyId={familyId}
            parsedRecordType={parsedRecordType}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        ) : (
          <RecordsTable
            records={records}
            recordType={recordType}
            memberId={memberId}
            category={category}
            familyId={familyId}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </AccordionItem>
  );
};

// Separate component for card view
interface RecordsCardsProps {
  records: Record[];
  recordType: RecordType;
  memberId: string;
  category: string;
  familyId: string;
  parsedRecordType: any;
  onDelete: (recordId: number) => void;
  isDeleting: boolean;
}

const RecordsCards: React.FC<RecordsCardsProps> = ({
  records,
  recordType,
  memberId,
  category,
  familyId,
  parsedRecordType,
  onDelete,
  isDeleting,
}) => {
  if (records.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">
            No {recordType.name} records yet
          </h3>
          <p className="text-slate-400 mb-6">
            Get started by creating your first {recordType.name.toLowerCase()}{" "}
            record.
          </p>
          <Link
            to={`/member/${memberId}/category/${encodeURIComponent(category)}/record/${recordType.id}`}
          >
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Record
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {records.map(record => (
        <Card
          key={record.id}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
        >
          <CardHeader className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold text-slate-100 mb-2 line-clamp-2">
                  {record.title}
                </CardTitle>

                {/* Date Information */}
                <div className="space-y-1">
                  {record.datetime && record.datetime !== record.createdAt ? (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-400">Happened:</span>
                      <DateDisplay
                        date={record.datetime}
                        format="short"
                        className="text-slate-300 font-medium"
                      />
                    </div>
                  ) : null}

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Recorded:</span>
                    <RelativeDate
                      date={record.createdAt}
                      className="text-slate-300 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy indicator */}
              {record.isPrivate && (
                <Lock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            {/* Record Content */}
            <div className="mb-4">
              <RecordContentDisplay
                content={record.content}
                recordType={parsedRecordType}
                maxFields={4}
                className="text-xs"
              />
            </div>

            {/* Tags */}
            {record.tags && (
              <div className="flex flex-wrap gap-1 mb-4">
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
                {record.tags.split(",").length > 3 && (
                  <span className="px-2 py-1 bg-slate-700/30 text-slate-500 text-xs rounded-full border border-slate-600">
                    +{record.tags.split(",").length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 px-3"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8 px-3"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(record.id)}
                disabled={isDeleting}
                className="border-red-600 text-red-400 hover:bg-red-900/20 h-8 px-3"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
