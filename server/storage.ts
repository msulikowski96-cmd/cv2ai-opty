import {
  users,
  cvUploads,
  analysisResults,
  payments,
  usageStats,
  type User,
  type UpsertUser,
  type InsertCvUpload,
  type CvUpload,
  type InsertAnalysisResult,
  type AnalysisResult,
  type InsertPayment,
  type Payment,
  type InsertUsageStats,
  type UsageStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithPassword(email: string, password: string, firstName?: string, lastName?: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
  updateUserPremium(userId: string, premiumUntil: Date): Promise<User>;
  updateUserBasic(userId: string): Promise<User>;
  
  // CV operations
  createCvUpload(cvUpload: InsertCvUpload): Promise<CvUpload>;
  getCvUploadsByUser(userId: string): Promise<CvUpload[]>;
  getCvUpload(id: string): Promise<CvUpload | undefined>;
  
  // Analysis operations
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  getAnalysisResultsByCv(cvUploadId: string): Promise<AnalysisResult[]>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: string): Promise<Payment>;
  
  // Usage stats operations
  getOrCreateUsageStats(userId: string): Promise<UsageStats>;
  incrementUsageStat(userId: string, statType: keyof Omit<UsageStats, 'id' | 'userId' | 'lastUpdated'>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUserWithPassword(email: string, password: string, firstName?: string, lastName?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        authProvider: 'email',
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPremium(userId: string, premiumUntil: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        premiumUntil,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserBasic(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        basicPurchased: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // CV operations
  async createCvUpload(cvUpload: InsertCvUpload): Promise<CvUpload> {
    const [upload] = await db.insert(cvUploads).values(cvUpload).returning();
    return upload;
  }

  async getCvUploadsByUser(userId: string): Promise<CvUpload[]> {
    return await db.select().from(cvUploads).where(eq(cvUploads.userId, userId)).orderBy(desc(cvUploads.uploadedAt));
  }

  async getCvUpload(id: string): Promise<CvUpload | undefined> {
    const [upload] = await db.select().from(cvUploads).where(eq(cvUploads.id, id));
    return upload;
  }

  // Analysis operations
  async createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult> {
    const [analysisResult] = await db.insert(analysisResults).values(result).returning();
    return analysisResult;
  }

  async getAnalysisResultsByCv(cvUploadId: string): Promise<AnalysisResult[]> {
    return await db.select().from(analysisResults).where(eq(analysisResults.cvUploadId, cvUploadId));
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [paymentResult] = await db.insert(payments).values(payment).returning();
    return paymentResult;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Usage stats operations
  async getOrCreateUsageStats(userId: string): Promise<UsageStats> {
    const [existing] = await db.select().from(usageStats).where(eq(usageStats.userId, userId));
    
    if (existing) {
      return existing;
    }

    const [newStats] = await db.insert(usageStats).values({ userId }).returning();
    return newStats;
  }

  async incrementUsageStat(userId: string, statType: keyof Omit<UsageStats, 'id' | 'userId' | 'lastUpdated'>): Promise<void> {
    const stats = await this.getOrCreateUsageStats(userId);
    const currentValue = stats[statType] as number || 0;
    
    await db
      .update(usageStats)
      .set({
        [statType]: currentValue + 1,
        lastUpdated: new Date(),
      })
      .where(eq(usageStats.userId, userId));
  }
}

export const storage = new DatabaseStorage();
