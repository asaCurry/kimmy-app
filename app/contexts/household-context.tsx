/**
 * Database-backed household data context for managing family members
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
  familyMembers: User[];
  addMember: (familyId: string, memberData: AddMemberData) => Promise<User>;
  addAdminMember: (
    familyId: string,
    userId: number,
    userData: { firstName: string; lastName: string; email: string }
  ) => Promise<User>;
  removeMember: (memberId: number) => Promise<void>;
  updateMember: (memberId: number, updates: Partial<User>) => Promise<void>;
  getMembersByRole: (familyId: string, role: "admin" | "member") => User[];
  refreshMembers: (familyId: string) => Promise<void>;
  setFamilyMembers: (members: User[]) => void;
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
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);

  const calculateAge = (dateOfBirth?: Date): number => {
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
  };

  const addAdminMember = useCallback(
    async (
      familyId: string,
      userId: number,
      userData: { firstName: string; lastName: string; email: string }
    ): Promise<User> => {
      try {
        // Note: In the new architecture, database operations should happen in route actions
        // This is just for local state management
        const adminMember: User = {
          id: userId,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          hashedPassword: null,
          familyId,
          role: "admin",
          age: null,
          relationshipToAdmin: "self",
          createdAt: new Date().toISOString(),
        };

        setFamilyMembers(prev => {
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
    async (familyId: string, memberData: AddMemberData): Promise<User> => {
      try {
        // Note: In the new architecture, database operations should happen in route actions
        // This is just for local state management
        const newMember: User = {
          id: Date.now(), // Temporary ID - should come from database
          name: `${memberData.firstName} ${memberData.lastName}`,
          email: memberData.email || "",
          hashedPassword: null,
          familyId,
          role: "member",
          age: memberData.dateOfBirth
            ? calculateAge(memberData.dateOfBirth)
            : null,
          relationshipToAdmin: memberData.relationship,
          createdAt: new Date().toISOString(),
        };

        setFamilyMembers(prev => [...prev, newMember]);
        return newMember;
      } catch (error) {
        console.error("Failed to add member:", error);
        throw error;
      }
    },
    [calculateAge]
  );

  const removeMember = useCallback(async (memberId: number): Promise<void> => {
    // TODO: In the new architecture, this should be handled by route actions
    setFamilyMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);

  const updateMember = useCallback(
    async (memberId: number, updates: Partial<User>): Promise<void> => {
      // TODO: In the new architecture, this should be handled by route actions
      setFamilyMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const getMembersByRole = useCallback(
    (familyId: string, role: "admin" | "member"): User[] => {
      return familyMembers.filter(
        m => m.familyId === familyId && m.role === role
      );
    },
    [familyMembers]
  );

  const refreshMembers = useCallback(
    async (familyId: string): Promise<void> => {
      // TODO: In the new architecture, this should be handled by route loaders
      // For now, just do nothing - the loader will handle member fetching
    },
    []
  );

  const value: HouseholdContextType = {
    familyMembers,
    addMember,
    addAdminMember,
    removeMember,
    updateMember,
    getMembersByRole,
    refreshMembers,
    setFamilyMembers,
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};

// Hook for getting current household members
// This should be used in components that need to display family members
export const useCurrentHouseholdMembers = (familyId?: string): User[] => {
  const { familyMembers } = useHousehold();

  if (!familyId) {
    return [];
  }

  return familyMembers.filter(member => member.familyId === familyId);
};
