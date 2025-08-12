/**
 * Loader helper functions for family data
 */

import { userDb, familyDb } from "./db";
import { parseCookies, extractSessionFromCookies } from "./utils";

export interface FamilyData {
  familyId: string | null;
  familyMembers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    age?: number;
    relationshipToAdmin?: string;
  }>;
}

export async function loadFamilyData(
  request: Request,
  env: any
): Promise<FamilyData> {
  try {
    // Extract session from cookies using utility function
    const session = extractSessionFromCookies(request.headers.get("cookie"));

    if (!session) {
      return { familyId: null, familyMembers: [] };
    }

    const familyId = session.currentHouseholdId;
    if (!familyId) {
      return { familyId: null, familyMembers: [] };
    }

    // Load family members from database
    const members = await userDb.findByFamilyId(env, familyId);

    return {
      familyId,
      familyMembers: members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role || "member",
        age: member.age || undefined,
        relationshipToAdmin: member.relationshipToAdmin || undefined,
      })),
    };
  } catch (error) {
    console.error("Failed to load family data:", error);
    return { familyId: null, familyMembers: [] };
  }
}

export async function loadUserSession(
  request: Request,
  env: any
): Promise<any> {
  try {
    // Extract session from cookies using utility function
    const session = extractSessionFromCookies(request.headers.get("cookie"));

    if (!session) {
      return null;
    }

    // Validate session by checking if user still exists
    const user = await userDb.findById(env, session.userId);
    if (!user) {
      return null;
    }

    return {
      ...session,
      user,
    };
  } catch (error) {
    console.error("Failed to load user session:", error);
    return null;
  }
}

/**
 * Load family data with additional member information
 */
export async function loadFamilyDataWithMember(
  request: Request,
  env: any,
  memberId?: string
): Promise<FamilyData & { currentMember: any | null }> {
  const { familyId, familyMembers } = await loadFamilyData(request, env);

  let currentMember = null;
  if (familyId && memberId) {
    currentMember =
      familyMembers.find(member => member.id.toString() === memberId) || null;
  }

  return { familyId, familyMembers, currentMember };
}

/**
 * Load family data with category information
 * Useful for routes that need category-based data
 */
export async function loadFamilyDataWithCategories(
  request: Request,
  env: any
): Promise<FamilyData & { categories: string[] }> {
  const { familyId, familyMembers } = await loadFamilyData(request, env);

  // Default categories - in a real app, these might come from the database
  const defaultCategories = [
    "Health",
    "Activities",
    "Personal",
    "Education",
    "Finance",
  ];

  return {
    familyId,
    familyMembers,
    categories: defaultCategories,
  };
}
