import * as React from "react";

interface Category {
  name: string;
  recordTypeCount: number;
  recordCount: number;
  isDefault: boolean;
}

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface CategoriesActions {
  loadCategories: (householdId: string) => Promise<void>;
  addCategory: (householdId: string, categoryName: string) => Promise<void>;
  searchCategories: (query: string) => Category[];
  getCategorySuggestions: (query: string, maxResults?: number) => Category[];
}

interface CategoriesContextValue extends CategoriesState, CategoriesActions {}

const CategoriesContext = React.createContext<
  CategoriesContextValue | undefined
>(undefined);

// Default categories that are always available
const DEFAULT_CATEGORIES = [
  "Health",
  "Activities",
  "Personal",
  "Education",
  "Finance",
  "Food",
  "Travel",
  "Home",
  "Work",
  "Social",
  "Technology",
  "Creative",
  "Fitness",
  "Spiritual",
];

interface CategoriesProviderProps {
  children: React.ReactNode;
}

export const CategoriesProvider: React.FC<CategoriesProviderProps> = ({
  children,
}) => {
  const [state, setState] = React.useState<CategoriesState>({
    categories: [],
    isLoading: false,
    error: null,
  });

  const loadCategories = React.useCallback(async (_householdId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real implementation, you'd fetch from the database
      // For now, we'll simulate this with the default categories
      const defaultCategories: Category[] = DEFAULT_CATEGORIES.map(name => ({
        name,
        recordTypeCount: 0,
        recordCount: 0,
        isDefault: true,
      }));

      setState(prev => ({
        ...prev,
        categories: defaultCategories,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to load categories:", error);
      setState(prev => ({
        ...prev,
        error: "Failed to load categories",
        isLoading: false,
      }));
    }
  }, []);

  const addCategory = React.useCallback(
    async (householdId: string, categoryName: string) => {
      const trimmedName = categoryName.trim();
      if (!trimmedName) return;

      // Check if category already exists
      const existingCategory = state.categories.find(
        cat => cat.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (existingCategory) return;

      const newCategory: Category = {
        name: trimmedName,
        recordTypeCount: 0,
        recordCount: 0,
        isDefault: false,
      };

      setState(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }));
    },
    [state.categories]
  );

  const searchCategories = React.useCallback(
    (query: string): Category[] => {
      if (!query.trim()) return state.categories;

      const lowerQuery = query.toLowerCase();
      return state.categories.filter(category =>
        category.name.toLowerCase().includes(lowerQuery)
      );
    },
    [state.categories]
  );

  const getCategorySuggestions = React.useCallback(
    (query: string, maxResults: number = 10): Category[] => {
      if (!query.trim()) {
        // Return default categories when no query
        return state.categories
          .filter(cat => cat.isDefault)
          .slice(0, maxResults);
      }

      const lowerQuery = query.toLowerCase();
      const exactMatches = state.categories.filter(
        cat => cat.name.toLowerCase() === lowerQuery
      );

      const startsWithMatches = state.categories.filter(
        cat =>
          cat.name.toLowerCase().startsWith(lowerQuery) &&
          cat.name.toLowerCase() !== lowerQuery
      );

      const containsMatches = state.categories.filter(
        cat =>
          cat.name.toLowerCase().includes(lowerQuery) &&
          !cat.name.toLowerCase().startsWith(lowerQuery) &&
          cat.name.toLowerCase() !== lowerQuery
      );

      // Combine and limit results
      const allMatches = [
        ...exactMatches,
        ...startsWithMatches,
        ...containsMatches,
      ];
      return allMatches.slice(0, maxResults);
    },
    [state.categories]
  );

  const contextValue: CategoriesContextValue = React.useMemo(
    () => ({
      ...state,
      loadCategories,
      addCategory,
      searchCategories,
      getCategorySuggestions,
    }),
    [
      state,
      loadCategories,
      addCategory,
      searchCategories,
      getCategorySuggestions,
    ]
  );

  return (
    <CategoriesContext.Provider value={contextValue}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = (): CategoriesContextValue => {
  const context = React.useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
};

// Hook for components that only need to read the state
export const useCategoriesState = (): CategoriesState => {
  const context = React.useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error(
      "useCategoriesState must be used within a CategoriesProvider"
    );
  }
  const { categories, isLoading, error } = context;
  return { categories, isLoading, error };
};

// Hook for components that only need the actions
export const useCategoriesActions = (): CategoriesActions => {
  const context = React.useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error(
      "useCategoriesActions must be used within a CategoriesProvider"
    );
  }
  const {
    loadCategories,
    addCategory,
    searchCategories,
    getCategorySuggestions,
  } = context;
  return {
    loadCategories,
    addCategory,
    searchCategories,
    getCategorySuggestions,
  };
};
