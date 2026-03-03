CREATE TABLE "otp_codes" (
	"otp_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp_code" varchar(6) NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;