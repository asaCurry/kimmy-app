import { useState, useEffect, useCallback } from "react";
import { useFetcher } from "react-router";
import type {
  FieldSuggestions,
  AutoCompletionSuggestion,
} from "~/lib/auto-completion-service";

interface UseAutoCompletionProps {
  recordTypeId: number;
  householdId: string;
  memberId?: number;
  fieldId?: string;
  enabled?: boolean;
}

interface UseAutoCompletionResult {
  suggestions: FieldSuggestions | null;
  titleSuggestions: AutoCompletionSuggestion[];
  tagSuggestions: string[];
  smartDefaults: {
    suggestedTime?: string;
    suggestedTags?: string[];
    commonPatterns?: Record<string, any>;
  } | null;
  isLoading: boolean;
  error: string | null;
  refreshSuggestions: () => void;
  getFieldSuggestions: (
    fieldId: string,
    currentValue?: string
  ) => Promise<FieldSuggestions>;
}

export function useAutoCompletion({
  recordTypeId,
  householdId,
  memberId,
  enabled = true,
}: UseAutoCompletionProps): UseAutoCompletionResult {
  const fetcher = useFetcher();
  const [suggestions, setSuggestions] = useState<FieldSuggestions | null>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<
    AutoCompletionSuggestion[]
  >([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [smartDefaults, setSmartDefaults] = useState<{
    suggestedTime?: string;
    suggestedTags?: string[];
    commonPatterns?: Record<string, any>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSuggestions = useCallback(() => {
    if (!enabled || !recordTypeId || !householdId) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("_action", "get-suggestions");
    formData.append("recordTypeId", recordTypeId.toString());
    formData.append("householdId", householdId);
    if (memberId) formData.append("memberId", memberId.toString());

    fetcher.submit(formData, {
      method: "post",
      action: "/api/auto-completion",
    });
  }, [enabled, recordTypeId, householdId, memberId, fetcher]);

  const getFieldSuggestions = useCallback(
    async (
      targetFieldId: string,
      currentValue?: string
    ): Promise<FieldSuggestions> => {
      if (!enabled || !recordTypeId || !householdId) {
        return { recent: [], frequent: [], contextual: [] };
      }

      const formData = new FormData();
      formData.append("_action", "get-field-suggestions");
      formData.append("fieldId", targetFieldId);
      formData.append("recordTypeId", recordTypeId.toString());
      formData.append("householdId", householdId);
      if (memberId) formData.append("memberId", memberId.toString());
      if (currentValue) formData.append("currentValue", currentValue);

      return new Promise(resolve => {
        // Use fetch with credentials to include cookies for authentication
        fetch("/api/auto-completion", {
          method: "POST",
          body: formData,
          credentials: "include", // This ensures cookies are sent
        })
          .then(response => response.json())
          .then((data: any) => {
            if (data.success && data.fieldSuggestions) {
              resolve(data.fieldSuggestions);
            } else {
              resolve({ recent: [], frequent: [], contextual: [] });
            }
          })
          .catch(() => {
            resolve({ recent: [], frequent: [], contextual: [] });
          });
      });
    },
    [enabled, recordTypeId, householdId, memberId]
  );

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      setIsLoading(false);

      const data = fetcher.data as any;
      if (data.success) {
        if (data.fieldSuggestions) {
          setSuggestions(data.fieldSuggestions);
        }
        if (data.titleSuggestions) {
          setTitleSuggestions(data.titleSuggestions);
        }
        if (data.tagSuggestions) {
          setTagSuggestions(data.tagSuggestions);
        }
        if (data.smartDefaults) {
          setSmartDefaults(data.smartDefaults);
        }
      } else {
        // Handle authentication errors gracefully - don't show auth errors to users
        if (data.error === "Authentication required") {
          console.log("Auto-completion: Authentication required");
        } else {
          setError(data.error || "Failed to load suggestions");
        }
      }
    }
  }, [fetcher.data]);

  // Handle loading state
  useEffect(() => {
    if (fetcher.state === "submitting") {
      setIsLoading(true);
    }
  }, [fetcher.state]);

  // Initial load
  useEffect(() => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  return {
    suggestions,
    titleSuggestions,
    tagSuggestions,
    smartDefaults,
    isLoading,
    error,
    refreshSuggestions,
    getFieldSuggestions,
  };
}

// Hook specifically for field suggestions with debouncing
export function useFieldAutoCompletion(
  fieldId: string,
  currentValue: string,
  recordTypeId: number,
  householdId: string,
  memberId?: number,
  debounceMs: number = 300
) {
  const [suggestions, setSuggestions] = useState<FieldSuggestions>({
    recent: [],
    frequent: [],
    contextual: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(currentValue);

  // Debounce the current value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(currentValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [currentValue, debounceMs]);

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (
      !fieldId ||
      !recordTypeId ||
      !householdId ||
      debouncedValue.length < 2
    ) {
      setSuggestions({ recent: [], frequent: [], contextual: [] });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("_action", "get-field-suggestions");
    formData.append("fieldId", fieldId);
    formData.append("recordTypeId", recordTypeId.toString());
    formData.append("householdId", householdId);
    formData.append("currentValue", debouncedValue);
    if (memberId) formData.append("memberId", memberId.toString());

    fetch("/api/auto-completion", {
      method: "POST",
      body: formData,
      credentials: "include", // This ensures cookies are sent
    })
      .then(response => response.json())
      .then((data: any) => {
        if (data.success && data.fieldSuggestions) {
          setSuggestions(data.fieldSuggestions);
        }
      })
      .catch(() => {
        setSuggestions({ recent: [], frequent: [], contextual: [] });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [debouncedValue, fieldId, recordTypeId, householdId, memberId]);

  return { suggestions, isLoading };
}
