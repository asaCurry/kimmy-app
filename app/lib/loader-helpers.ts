/**
 * Loader helper functions for household data
 */

import { userDb, householdDb } from "./db";
import { parseCookies, extractSessionFromCookies } from "./utils";

export interface HouseholdData {
  householdId: string | null;
  householdMembers: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    admin?: number;
    age?: number;
    relationshipToAdmin?: string;
  }>;
}

export async function loadHouseholdData(
  request: Request,
  env: any
): Promise<HouseholdData> {
  try {
    // Extract session from cookies using utility function
    const session = extractSessionFromCookies(request.headers.get("cookie"));

    if (!session) {
      return { householdId: null, householdMembers: [] };
    }

    const householdId = session.currentHouseholdId;
    if (!householdId) {
      return { householdId: null, householdMembers: [] };
    }

    // Load household members from database
    const members = await userDb.findByHouseholdId(env, householdId);

    return {
      householdId,
      householdMembers: members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role || "member",
        admin: member.admin || 0,
        age: member.age || undefined,
        relationshipToAdmin: member.relationshipToAdmin || undefined,
      })),
    };
  } catch (error) {
    console.error("Failed to load household data:", error);
    return { householdId: null, householdMembers: [] };
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
 * Load household data with additional member information
 */
export async function loadHouseholdDataWithMember(
  request: Request,
  env: any,
  memberId?: string
): Promise<HouseholdData & { currentMember: any | null }> {
  const { householdId, householdMembers } = await loadHouseholdData(
    request,
    env
  );

  let currentMember = null;
  if (householdId && memberId) {
    currentMember =
      householdMembers.find(member => member.id.toString() === memberId) ||
      null;
  }

  return { householdId, householdMembers, currentMember };
}

/**
 * Load household data with category information
 * Useful for routes that need category-based data
 */
export async function loadHouseholdDataWithCategories(
  request: Request,
  env: any
): Promise<HouseholdData & { categories: string[] }> {
  const { householdId, householdMembers } = await loadHouseholdData(
    request,
    env
  );

  // Default categories - in a real app, these might come from the database
  const defaultCategories = [
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

  return {
    householdId,
    householdMembers,
    categories: defaultCategories,
  };
}
