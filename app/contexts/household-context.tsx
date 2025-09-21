/**
 * Household context for managing household members state.
 * Note: Database operations should happen in route actions - this is for local state only.
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import type { User } from "~/db/schema";

interface AddMemberData {
  firstName: string;
  lastName: string;
  email?: string;
  memberType: "adult" | "child";
  relationship: string;
  dateOfBirth?: Date;
}

interface HouseholdContextType {
  householdMembers: User[];
  addMember: (householdId: string, memberData: AddMemberData) => Promise<User>;
  addAdminMember: (
    householdId: string,
    userId: number,
    userData: { firstName: string; lastName: string; email: string }
  ) => Promise<User>;
  removeMember: (memberId: number) => Promise<void>;
  updateMember: (memberId: number, updates: Partial<User>) => Promise<void>;
  getMembersByRole: (householdId: string, role: "admin" | "member") => User[];
  refreshMembers: (householdId: string) => Promise<void>;
  setHouseholdMembers: (members: User[]) => void;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(
  undefined
);

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
};

interface HouseholdProviderProps {
  children: React.ReactNode;
}

export const HouseholdProvider: React.FC<HouseholdProviderProps> = ({
  children,
}) => {
  const [householdMembers, setHouseholdMembers] = useState<User[]>([]);

  const calculateAge = useCallback((dateOfBirth?: Date): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      return age - 1;
    }

    return age;
  }, []);

  const addAdminMember = useCallback(
    async (
      householdId: string,
      userId: number,
      userData: { firstName: string; lastName: string; email: string }
    ): Promise<User> => {
      try {
        const adminMember: User = {
          id: userId,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          hashedPassword: null,
          householdId,
          role: "admin",
          admin: 0,
          age: null,
          relationshipToAdmin: "self",
          createdAt: new Date().toISOString(),
        };

        setHouseholdMembers(prev => {
          const existing = prev.find(m => m.id === userId);
          if (existing) {
            return prev.map(m => (m.id === userId ? adminMember : m));
          }
          return [...prev, adminMember];
        });

        return adminMember;
      } catch (error) {
        console.error("Failed to add admin member:", error);
        throw error;
      }
    },
    []
  );

  const addMember = useCallback(
    async (householdId: string, memberData: AddMemberData): Promise<User> => {
      try {
        const newMember: User = {
          id: Date.now(),
          name: `${memberData.firstName} ${memberData.lastName}`,
          email: memberData.email || "",
          hashedPassword: null,
          householdId,
          role: "member",
          admin: 0,
          age: memberData.dateOfBirth
            ? calculateAge(memberData.dateOfBirth)
            : null,
          relationshipToAdmin: memberData.relationship,
          createdAt: new Date().toISOString(),
        };

        setHouseholdMembers(prev => [...prev, newMember]);
        return newMember;
      } catch (error) {
        console.error("Failed to add member:", error);
        throw error;
      }
    },
    [calculateAge]
  );

  const removeMember = useCallback(async (memberId: number): Promise<void> => {
    setHouseholdMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);

  const updateMember = useCallback(
    async (memberId: number, updates: Partial<User>): Promise<void> => {
      setHouseholdMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const getMembersByRole = useCallback(
    (householdId: string, role: "admin" | "member"): User[] => {
      return householdMembers.filter(
        m => m.householdId === householdId && m.role === role
      );
    },
    [householdMembers]
  );

  const refreshMembers = useCallback(
    async (_householdId: string): Promise<void> => {
      // Member fetching handled by route loaders
    },
    []
  );

  const value: HouseholdContextType = {
    householdMembers,
    addMember,
    addAdminMember,
    removeMember,
    updateMember,
    getMembersByRole,
    refreshMembers,
    setHouseholdMembers,
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};

// Hook for getting current household members
// This should be used in components that need to display household members
export const useCurrentHouseholdMembers = (householdId?: string): User[] => {
  const { householdMembers } = useHousehold();

  if (!householdId) {
    return [];
  }

  return householdMembers.filter(member => member.householdId === householdId);
};
