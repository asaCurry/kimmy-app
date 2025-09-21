import * as React from "react";
import type { Record, RecordType } from "~/db/schema";

interface RecordManagementState {
  selectedRecord: Record | null;
  selectedRecordType: RecordType | null;
  isDrawerOpen: boolean;
  drawerMode: "view" | "edit";
  isDeleting: boolean;
  isUpdating: boolean;
  householdMembers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    age?: number;
    relationshipToAdmin?: string;
  }>;
  householdId: string;
  memberId: string;
  category: string;
}

interface RecordManagementActions {
  openRecord: (record: Record, recordType: RecordType) => void;
  closeRecord: () => void;
  setDrawerMode: (mode: "view" | "edit") => void;
  deleteRecord: (recordId: number) => Promise<void>;
  updateRecord: (recordId: number, updates: Partial<Record>) => Promise<void>;
  setDeleting: (isDeleting: boolean) => void;
  setUpdating: (isUpdating: boolean) => void;
}

interface RecordManagementContextValue
  extends RecordManagementState,
    RecordManagementActions {}

const RecordManagementContext = React.createContext<
  RecordManagementContextValue | undefined
>(undefined);

interface RecordManagementProviderProps {
  children: React.ReactNode;
  householdMembers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    age?: number;
    relationshipToAdmin?: string;
  }>;
  householdId: string;
  memberId: string;
  category: string;
  onRecordDelete?: (recordId: number) => Promise<void>;
  onRecordUpdate?: (
    recordId: number,
    updates: Partial<Record>
  ) => Promise<void>;
}

export const RecordManagementProvider: React.FC<
  RecordManagementProviderProps
> = ({
  children,
  householdMembers,
  householdId,
  memberId,
  category,
  onRecordDelete,
  onRecordUpdate,
}) => {
  const [state, setState] = React.useState<RecordManagementState>({
    selectedRecord: null,
    selectedRecordType: null,
    isDrawerOpen: false,
    drawerMode: "view",
    isDeleting: false,
    isUpdating: false,
    householdMembers,
    householdId,
    memberId,
    category,
  });

  const openRecord = React.useCallback(
    (record: Record, recordType: RecordType) => {
      setState(prev => ({
        ...prev,
        selectedRecord: record,
        selectedRecordType: recordType,
        isDrawerOpen: true,
        drawerMode: "view",
      }));
    },
    []
  );

  const closeRecord = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedRecord: null,
      selectedRecordType: null,
      isDrawerOpen: false,
      drawerMode: "view",
    }));
  }, []);

  const setDrawerMode = React.useCallback((mode: "view" | "edit") => {
    setState(prev => ({
      ...prev,
      drawerMode: mode,
    }));
  }, []);

  const deleteRecord = React.useCallback(
    async (recordId: number) => {
      if (!onRecordDelete) {
        console.warn("No delete handler provided");
        return;
      }

      setState(prev => ({ ...prev, isDeleting: true }));
      try {
        await onRecordDelete(recordId);
        closeRecord();
      } catch (error) {
        console.error("Failed to delete record:", error);
      } finally {
        setState(prev => ({ ...prev, isDeleting: false }));
      }
    },
    [onRecordDelete, closeRecord]
  );

  const updateRecord = React.useCallback(
    async (recordId: number, updates: Partial<Record>) => {
      if (!onRecordUpdate) {
        console.warn("No update handler provided");
        return;
      }

      setState(prev => ({ ...prev, isUpdating: true }));
      try {
        await onRecordUpdate(recordId, updates);
        setState(prev => ({ ...prev, drawerMode: "view" }));
      } catch (error) {
        console.error("Failed to update record:", error);
      } finally {
        setState(prev => ({ ...prev, isUpdating: false }));
      }
    },
    [onRecordUpdate]
  );

  const setDeleting = React.useCallback((isDeleting: boolean) => {
    setState(prev => ({ ...prev, isDeleting }));
  }, []);

  const setUpdating = React.useCallback((isUpdating: boolean) => {
    setState(prev => ({ ...prev, isUpdating }));
  }, []);

  const contextValue: RecordManagementContextValue = React.useMemo(
    () => ({
      ...state,
      openRecord,
      closeRecord,
      setDrawerMode,
      deleteRecord,
      updateRecord,
      setDeleting,
      setUpdating,
    }),
    [
      state,
      openRecord,
      closeRecord,
      setDrawerMode,
      deleteRecord,
      updateRecord,
      setDeleting,
      setUpdating,
    ]
  );

  return (
    <RecordManagementContext.Provider value={contextValue}>
      {children}
    </RecordManagementContext.Provider>
  );
};

export const useRecordManagement = (): RecordManagementContextValue => {
  const context = React.useContext(RecordManagementContext);
  if (context === undefined) {
    throw new Error(
      "useRecordManagement must be used within a RecordManagementProvider"
    );
  }
  return context;
};

// Hook for components that only need to read the state
export const useRecordManagementState = (): RecordManagementState => {
  const context = React.useContext(RecordManagementContext);
  if (context === undefined) {
    throw new Error(
      "useRecordManagementState must be used within a RecordManagementProvider"
    );
  }
  const {
    selectedRecord,
    selectedRecordType,
    isDrawerOpen,
    drawerMode,
    isDeleting,
    isUpdating,
    householdMembers,
    householdId,
    memberId,
    category,
  } = context;
  return {
    selectedRecord,
    selectedRecordType,
    isDrawerOpen,
    drawerMode,
    isDeleting,
    isUpdating,
    householdMembers,
    householdId,
    memberId,
    category,
  };
};

// Hook for components that only need the actions
export const useRecordManagementActions = (): RecordManagementActions => {
  const context = React.useContext(RecordManagementContext);
  if (context === undefined) {
    throw new Error(
      "useRecordManagementActions must be used within a RecordManagementProvider"
    );
  }
  const {
    openRecord,
    closeRecord,
    setDrawerMode,
    deleteRecord,
    updateRecord,
    setDeleting,
    setUpdating,
  } = context;
  return {
    openRecord,
    closeRecord,
    setDrawerMode,
    deleteRecord,
    updateRecord,
    setDeleting,
    setUpdating,
  };
};
