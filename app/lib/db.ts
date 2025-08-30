import { eq, and } from "drizzle-orm";
import { createDatabase } from "../../db";
import type { Database } from "../../db";
import * as schema from "../../db/schema";
import { hashPassword, verifyPassword } from "./password-utils";
import { generateSecureToken, generateInviteCode } from "./token-utils";
import type {
  User,
  NewUser,
  RecordType,
  NewRecordType,
  Record,
  NewRecord,
} from "../../db/schema";
import { isDatabaseAvailable } from "./utils";
import { dbLogger } from "./logger";

/**
 * Database utilities for user, household, and record operations
 * Following the correct pattern: each function creates its own database instance
 */

/**
 * Helper function to ensure database is available and create database instance
 */
function ensureDatabase(env: any): Database {
  dbLogger.debug("Database connection check", {
    hasEnv: !!env,
    hasDB: !!env?.DB,
    dbType: typeof env?.DB,
  });

  if (!isDatabaseAvailable(env)) {
    dbLogger.error("Database not available");
    throw new Error("Database not available");
  }

  dbLogger.debug("Database instance created successfully");
  const db = createDatabase(env.DB);
  return db;
}

// User operations
export const userDb = {
  async create(
    env: any,
    userData: {
      name: string;
      email: string;
      password?: string;
      householdId: string;
      role?: string;
      age?: number;
      relationshipToAdmin?: string;
    }
  ): Promise<User> {
    dbLogger.info("Creating new user", {
      name: userData.name,
      email: userData.email.replace(/(.{2}).*@/, "$1***@"),
      hasPassword: !!userData.password,
      householdId: userData.householdId,
      role: userData.role,
    });

    const db = ensureDatabase(env);
    dbLogger.debug("Database connection established for user creation");

    // Proper password hashing with bcrypt
    const hashedPassword = userData.password
      ? await hashPassword(userData.password)
      : null;

    const newUser: NewUser = {
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      hashedPassword,
      householdId: userData.householdId,
      role: userData.role || "member",
      age: userData.age,
      relationshipToAdmin: userData.relationshipToAdmin,
    };
    dbLogger.debug("Prepared user data for insertion");

    try {
      dbLogger.info("Inserting user into database");
      const result = await db.insert(schema.users).values(newUser).returning();
      dbLogger.info("User created successfully", { userId: result[0].id });
      return result[0];
    } catch (error) {
      dbLogger.error("Failed to create user", { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

  async findByHouseholdId(env: any, householdId: string): Promise<User[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.householdId, householdId));
    } catch (error) {
      console.error("Failed to find users by household ID:", error);
      throw new Error("Failed to find household members");
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
    
    // Handle legacy hashed passwords (will be migrated during login)
    if (hashedPassword.startsWith('hashed_')) {
      return hashedPassword === `hashed_${password}`;
    }
    
    // Use proper PBKDF2 verification for new passwords
    return verifyPassword(password, hashedPassword);
  },

  /**
   * Migrate a user's password to the secure format
   * Called during login when legacy hash is detected
   */
  async migrateUserPassword(
    env: any,
    userId: number,
    plaintextPassword: string
  ): Promise<boolean> {
    try {
      const db = ensureDatabase(env);
      const secureHash = await hashPassword(plaintextPassword);
      
      await db
        .update(schema.users)
        .set({ hashedPassword: secureHash })
        .where(eq(schema.users.id, userId));

      console.log(`🔄 Migrated password for user ${userId} to secure format`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to migrate password for user ${userId}:`, error);
      return false;
    }
  },
};

// Household/Household operations
export const householdDb = {
  async generateHouseholdId(): Promise<string> {
    // Generate a secure unique household ID
    const timestamp = Date.now().toString(36);
    const randomPart = generateSecureToken(16);
    return `household_${timestamp}_${randomPart}`;
  },

  async getMembers(env: any, householdId: string): Promise<User[]> {
    return await userDb.findByHouseholdId(env, householdId);
  },

  async getAdmins(env: any, householdId: string): Promise<User[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.householdId, householdId),
            eq(schema.users.role, "admin")
          )
        );
    } catch (error) {
      console.error("Failed to find household admins:", error);
      throw new Error("Failed to find household admins");
    }
  },

  async addMember(
    env: any,
    memberData: {
      name: string;
      email?: string;
      householdId: string;
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
      householdId: memberData.householdId,
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
      householdId: string;
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
      householdId: recordTypeData.householdId,
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

  async findByhouseholdId(
    env: any,
    householdId: string
  ): Promise<RecordType[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.recordTypes)
        .where(eq(schema.recordTypes.householdId, householdId));
    } catch (error) {
      console.error("Failed to find record types by household ID:", error);
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
      householdId: string;
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
      householdId: recordData.householdId,
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

  async findByhouseholdId(env: any, householdId: string): Promise<Record[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.records)
        .where(eq(schema.records.householdId, householdId));
    } catch (error) {
      console.error("Failed to find records by household ID:", error);
      throw new Error("Failed to find records");
    }
  },

  async findByRecordType(
    env: any,
    recordTypeId: number,
    householdId: string
  ): Promise<Record[]> {
    const db = ensureDatabase(env);

    try {
      return await db
        .select()
        .from(schema.records)
        .where(
          and(
            eq(schema.records.recordTypeId, recordTypeId),
            eq(schema.records.householdId, householdId)
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

  async update(
    env: any,
    id: number,
    updates: Partial<{
      title: string;
      content: string;
      tags: string;
      isPrivate: number;
      datetime: string;
    }>
  ): Promise<Record> {
    const db = ensureDatabase(env);

    try {
      const updateData = {
        ...updates,
      };

      const result = await db
        .update(schema.records)
        .set(updateData)
        .where(eq(schema.records.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to update record:", error);
      throw new Error("Failed to update record");
    }
  },

  async delete(env: any, id: number): Promise<void> {
    const db = ensureDatabase(env);

    try {
      await db.delete(schema.records).where(eq(schema.records.id, id));
    } catch (error) {
      console.error("Failed to delete record:", error);
      throw new Error("Failed to delete record");
    }
  },
};

// Invite code operations
export const inviteCodeDb = {
  /**
   * Generate a cryptographically secure invite code
   */
  generateSecureInviteCode(): string {
    // Generate cryptographically secure invite code
    const firstPart = generateInviteCode();
    const secondPart = generateInviteCode().substring(0, 4);

    // Format: XXXXXXXX-XXXX (8 alphanumeric + hyphen + 4 alphanumeric)
    return `${firstPart}-${secondPart}`;
  },

  /**
   * Validate an invite code format
   */
  validateInviteCodeFormat(code: string): boolean {
    // Format: XXXXXXXX-XXXX (8 alphanumeric + hyphen + 4 alphanumeric)
    const inviteCodeRegex = /^[A-Z0-9]{8}-[A-Z0-9]{4}$/;
    return inviteCodeRegex.test(code);
  },

  /**
   * Create a new household with invite code
   */
  async createHousehold(
    env: any,
    householdData: {
      id: string;
      name: string;
    }
  ) {
    console.log("🏗️ Starting createHousehold with data:", householdData);

    const db = ensureDatabase(env);
    console.log("✅ Database connection established");

    const inviteCode = this.generateSecureInviteCode();
    console.log("🔑 Generated invite code:", inviteCode);

    const newHousehold = {
      id: householdData.id,
      name: householdData.name,
      inviteCode,
    };
    console.log("📋 Prepared household data:", newHousehold);

    try {
      console.log("💾 Inserting household into database...");
      const result = await db
        .insert(schema.households)
        .values(newHousehold)
        .returning();
      console.log("✅ Household inserted successfully:", result[0]);
      return { household: result[0], inviteCode };
    } catch (error) {
      console.error("❌ Failed to create household:", error);
      throw new Error("Failed to create household");
    }
  },

  /**
   * Get household by invite code
   */
  async getHouseholdByInviteCode(env: any, inviteCode: string) {
    const db = ensureDatabase(env);

    try {
      const result = await db
        .select()
        .from(schema.households)
        .where(eq(schema.households.inviteCode, inviteCode))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Failed to get household by invite code:", error);
      return null;
    }
  },

  /**
   * Generate a new invite code for an existing household
   */
  async regenerateInviteCode(env: any, householdId: string) {
    const db = ensureDatabase(env);

    const newInviteCode = this.generateSecureInviteCode();

    try {
      const result = await db
        .update(schema.households)
        .set({
          inviteCode: newInviteCode,
        })
        .where(eq(schema.households.id, householdId))
        .returning();

      return result[0]?.inviteCode || null;
    } catch (error) {
      console.error("Failed to regenerate invite code:", error);
      throw new Error("Failed to regenerate invite code");
    }
  },

  /**
   * Get household by ID
   */
  async getHouseholdById(env: any, householdId: string) {
    const db = ensureDatabase(env);

    try {
      const result = await db
        .select()
        .from(schema.households)
        .where(eq(schema.households.id, householdId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Failed to get household by ID:", error);
      return null;
    }
  },

  /**
   * Delete a household (for cleanup)
   */
  async deleteHousehold(env: any, householdId: string) {
    const db = ensureDatabase(env);

    try {
      await db
        .delete(schema.households)
        .where(eq(schema.households.id, householdId));

      return true;
    } catch (error) {
      console.error("Failed to delete household:", error);
      throw new Error("Failed to delete household");
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

      if (!isValid) {
        return null;
      }

      // 🔄 GRADUAL MIGRATION: If user has legacy hash, migrate it now
      if (user.hashedPassword.startsWith('hashed_')) {
        console.log(`🔄 Migrating legacy password for user ${email}`);
        await userDb.migrateUserPassword(env, user.id, password);
      }

      return user;
    } catch (error) {
      console.error("authenticateUser - Authentication error:", error);
      return null;
    }
  },

  async createUserWithHousehold(
    env: any,
    userData: {
      name: string;
      email: string;
      password: string;
      householdName?: string;
    }
  ): Promise<{ user: User; householdId: string }> {
    try {
      console.log("🚀 Starting createUserWithHousehold with data:", {
        name: userData.name,
        email: userData.email,
        hasPassword: !!userData.password,
        householdName: userData.householdName,
      });

      const householdId = await householdDb.generateHouseholdId();
      console.log("📝 Generated household ID:", householdId);

      // Create the household first
      let householdName = userData.householdName;
      if (!householdName) {
        // For "only me" option, create a personal household name
        const firstName = userData.name.split(" ")[0];
        householdName = `${firstName}'s Personal Space`;
      }
      console.log("🏠 Creating household with name:", householdName);

      const { household } = await inviteCodeDb.createHousehold(env, {
        id: householdId,
        name: householdName,
      });
      console.log("✅ Household created successfully:", household);

      // Create the user
      console.log("👤 Creating user with household ID:", householdId);
      const user = await userDb.create(env, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        householdId,
        role: "admin",
      });
      console.log("✅ User created successfully:", user);

      return { user, householdId };
    } catch (error) {
      console.error("❌ Failed to create user with household:", error);
      throw new Error("Failed to create user account");
    }
  },
};
