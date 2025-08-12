import { useCallback } from "react";
import { useFetcher } from "react-router";

export interface RecordData {
  title: string;
  content?: string;
  recordTypeId: number;
  familyId: string;
  tags?: string;
  isPrivate?: boolean;
  fields?: Record<string, any>;
}

export interface UseRecordsReturn {
  createRecord: (data: RecordData) => void;
  updateRecord: (recordId: number, data: Partial<RecordData>) => void;
  deleteRecord: (recordId: number) => void;
  isSubmitting: boolean;
  data: any;
  error: any;
}

export function useRecords(): UseRecordsReturn {
  const fetcher = useFetcher();

  const createRecord = useCallback(
    (data: RecordData) => {
      const formData = new FormData();
      formData.append("_action", "create");
      formData.append("title", data.title);
      formData.append("content", data.content || "");
      formData.append("tags", data.tags || "");
      formData.append("recordTypeId", data.recordTypeId.toString());
      formData.append("familyId", data.familyId);
      formData.append("isPrivate", (data.isPrivate || false).toString());

      // Add dynamic field values
      if (data.fields) {
        Object.entries(data.fields).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (typeof value === "boolean") {
              formData.append(`field_${key}`, value ? "true" : "false");
            } else {
              formData.append(`field_${key}`, String(value));
            }
          }
        });
      }

      fetcher.submit(formData, {
        method: "post",
      });
    },
    [fetcher]
  );

  const updateRecord = useCallback(
    (recordId: number, data: Partial<RecordData>) => {
      const formData = new FormData();
      formData.append("_action", "update");
      formData.append("recordId", recordId.toString());

      if (data.title) formData.append("title", data.title);
      if (data.content !== undefined) formData.append("content", data.content);
      if (data.tags !== undefined) formData.append("tags", data.tags);
      if (data.isPrivate !== undefined)
        formData.append("isPrivate", data.isPrivate.toString());

      // Add dynamic field values
      if (data.fields) {
        Object.entries(data.fields).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (typeof value === "boolean") {
              formData.append(`field_${key}`, value ? "true" : "false");
            } else {
              formData.append(`field_${key}`, String(value));
            }
          }
        });
      }

      fetcher.submit(formData, {
        method: "post",
      });
    },
    [fetcher]
  );

  const deleteRecord = useCallback(
    (recordId: number) => {
      if (confirm("Are you sure you want to delete this record?")) {
        const formData = new FormData();
        formData.append("_action", "delete");
        formData.append("recordId", recordId.toString());

        fetcher.submit(formData, {
          method: "post",
        });
      }
    },
    [fetcher]
  );

  return {
    createRecord,
    updateRecord,
    deleteRecord,
    isSubmitting: fetcher.state === "submitting",
    data: fetcher.data,
    error: fetcher.data?.error,
  };
}
