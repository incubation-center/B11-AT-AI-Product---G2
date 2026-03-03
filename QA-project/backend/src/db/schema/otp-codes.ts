import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const otpCodes = pgTable("otp_codes", {
  otpId: serial("otp_id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: integer("is_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
