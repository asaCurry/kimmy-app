import { eq, and } from "drizzle-orm";
import { createDatabase } from "../../db";
import type { Database } from "../../db";
import * as schema from "../../db/schema";
import type {
  User,
  NewUser,
  RecordType,
  NewRecordType,
  Record,
  NewRecord,
} from "../../db/schema";
import { isDatabaseAvailable } from "./utils";

/**
 * Database utilities for user, household, and record operations
 * Following the correct pattern: each function creates its own database instance
 */

/**
 * Helper function to ensure database is available and create database instance
 */
function ensureDatabase(env: any): Database {
  if (!isDatabaseAvailable(env)) {
    throw new Error("Database not available");
  }
  return createDatabase(env.DB);
}

// User operations
export const userDb = {
  async create(
    env: any,
    userData: {
      name: string;
      email: string;
      password?: string;
      familyId: string;
      role?: string;
      age?: number;
      relationshipToAdmin?: string;
    }
  ): Promise<User> {
    const db = ensureDatabase(env);

    // Simple password hashing - in production, use proper bcrypt
    const hashedPassword = userData.password
      ? `hashed_${userData.password}`
      : null;

    const newUser: NewUser = {
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      hashedPassword,
      familyId: userData.familyId,
      role: userData.role || "member",
      age: userData.age,
      relationshipToAdmin: userData.relationshipToAdmin,
    };

    try {
      const result = await db.insert(schema.users).values(newUser).returning();
      return result[0];
    } catch (error) {
      console.error("Failed to create user:", error);
      throw new Error("Failed to create user account");
    }
  },

  async findByEmail(env: any, email: string): Promise<User | undefined> {
    const db = ensureDatabase(env);

    try {
      const result = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase().trim()))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error("Failed to find user by email:", error);
      throw new Error("Failed to find user");
    }
  },

  async findById(env: any, id: number): Promise<User | undefined> {
    const db = ensureDatabase(env);

    try {
      const result = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error("Failed to find user by ID:", error);
      throw new Error("Failed to find user");
    }
  },

  async findByFamilyId(env: any, familyId: string): Promise<User[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.familyId, familyId));
    } catch (error) {
      console.error("Failed to find users by family ID:", error);
      throw new Error("Failed to find family members");
    }
  },

  async updateRole(env: any, userId: number, role: string): Promise<void> {
    const db = ensureDatabase(env);

    try {
      await db
        .update(schema.users)
        .set({ role })
        .where(eq(schema.users.id, userId));
    } catch (error) {
      console.error("Failed to update user role:", error);
      throw new Error("Failed to update user role");
    }
  },

  async verifyPassword(
    password: string,
    hashedPassword: string | null
  ): Promise<boolean> {
    if (!hashedPassword) return false;
    // Simple comparison - in production, use proper bcrypt comparison
    return hashedPassword === `hashed_${password}`;
  },
};

// Family/Household operations
export const familyDb = {
  async generateFamilyId(): Promise<string> {
    // Generate a unique family ID
    return `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  async getMembers(env: any, familyId: string): Promise<User[]> {
    return await userDb.findByFamilyId(env, familyId);
  },

  async getAdmins(env: any, familyId: string): Promise<User[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.familyId, familyId),
            eq(schema.users.role, "admin")
          )
        );
    } catch (error) {
      console.error("Failed to find family admins:", error);
      throw new Error("Failed to find family admins");
    }
  },

  async addMember(
    env: any,
    memberData: {
      name: string;
      email?: string;
      familyId: string;
      role?: string;
      age?: number;
      relationshipToAdmin?: string;
    }
  ): Promise<User> {
    return await userDb.create(env, {
      name: memberData.name,
      email:
        memberData.email ||
        `${memberData.name.toLowerCase().replace(/\s+/g, ".")}@noemail.local`,
      familyId: memberData.familyId,
      role: memberData.role || "member",
      age: memberData.age,
      relationshipToAdmin: memberData.relationshipToAdmin,
    });
  },
};

// Record Type operations - simplified and focused
export const recordTypeDb = {
  async create(
    env: any,
    recordTypeData: {
      name: string;
      description?: string;
      familyId: string;
      icon?: string;
      color?: string;
      createdBy: number;
      fields?: string;
    }
  ): Promise<RecordType> {
    const db = ensureDatabase(env);

    const newRecordType: NewRecordType = {
      name: recordTypeData.name,
      description: recordTypeData.description,
      familyId: recordTypeData.familyId,
      icon: recordTypeData.icon,
      color: recordTypeData.color,
      createdBy: recordTypeData.createdBy,
    };

    try {
      const result = await db
        .insert(schema.recordTypes)
        .values(newRecordType)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Failed to create record type:", error);
      throw new Error("Failed to create record type");
    }
  },

  async findByFamilyId(env: any, familyId: string): Promise<RecordType[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.recordTypes)
        .where(eq(schema.recordTypes.familyId, familyId));
    } catch (error) {
      console.error("Failed to find record types by family ID:", error);
      throw new Error("Failed to find record types");
    }
  },

  async findById(env: any, id: number): Promise<RecordType | undefined> {
    const db = ensureDatabase(env);

    try {
      const result = await db
        .select()
        .from(schema.recordTypes)
        .where(eq(schema.recordTypes.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error("Failed to find record type by ID:", error);
      throw new Error("Failed to find record type");
    }
  },
};

// Record operations
export const recordDb = {
  async create(
    env: any,
    recordData: {
      title: string;
      content?: string;
      recordTypeId: number;
      familyId: string;
      createdBy: number;
      tags?: string;
      attachments?: string;
    }
  ): Promise<Record> {
    const db = ensureDatabase(env);

    const newRecord: NewRecord = {
      title: recordData.title,
      content: recordData.content,
      recordTypeId: recordData.recordTypeId,
      familyId: recordData.familyId,
      createdBy: recordData.createdBy,
      tags: recordData.tags,
      attachments: recordData.attachments,
    };

    try {
      const result = await db
        .insert(schema.records)
        .values(newRecord)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Failed to create record:", error);
      throw new Error("Failed to create record");
    }
  },

  async findByFamilyId(env: any, familyId: string): Promise<Record[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.records)
        .where(eq(schema.records.familyId, familyId));
    } catch (error) {
      console.error("Failed to find records by family ID:", error);
      throw new Error("Failed to find records");
    }
  },

  async findByRecordType(
    env: any,
    recordTypeId: number,
    familyId: string
  ): Promise<Record[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.records)
        .where(
          and(
            eq(schema.records.recordTypeId, recordTypeId),
            eq(schema.records.familyId, familyId)
          )
        );
    } catch (error) {
      console.error("Failed to find records by type:", error);
      throw new Error("Failed to find records");
    }
  },

  async findById(env: any, id: number): Promise<Record | undefined> {
    const db = ensureDatabase(env);

    try {
      const result = await db
        .select()
        .from(schema.records)
        .where(eq(schema.records.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error("Failed to find record by ID:", error);
      throw new Error("Failed to find records");
    }
  },
};

// Authentication utilities
export const authDb = {
  async authenticateUser(
    env: any,
    email: string,
    password: string
  ): Promise<User | null> {
    console.log("authenticateUser called with:", {
      email,
      passwordLength: password?.length,
    });

    try {
      console.log("authenticateUser - calling userDb.findByEmail...");
      const user = await userDb.findByEmail(env, email);
      console.log("authenticateUser - userDb.findByEmail result:", user);

      if (!user || !user.hashedPassword) {
        console.log("authenticateUser - No user or no hashed password");
        return null;
      }

      console.log("authenticateUser - calling userDb.verifyPassword...");
      const isValid = await userDb.verifyPassword(
        password,
        user.hashedPassword
      );
      console.log("authenticateUser - verifyPassword result:", isValid);

      return isValid ? user : null;
    } catch (error) {
      console.error("authenticateUser - Authentication error:", error);
      return null;
    }
  },

  async createUserWithFamily(
    env: any,
    userData: {
      name: string;
      email: string;
      password: string;
      familyName?: string;
    }
  ): Promise<{ user: User; familyId: string }> {
    try {
      const familyId = await familyDb.generateFamilyId();

      const user = await userDb.create(env, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        familyId,
        role: "admin",
      });

      return { user, familyId };
    } catch (error) {
      console.error("Failed to create user with family:", error);
      throw new Error("Failed to create user account");
    }
  },
};
