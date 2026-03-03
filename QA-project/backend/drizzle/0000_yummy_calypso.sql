CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "datasets" (
	"dataset_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"upload_type" varchar(50) NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "defects" (
	"defect_id" serial PRIMARY KEY NOT NULL,
	"dataset_id" integer NOT NULL,
	"bug_id" varchar(100),
	"title" varchar(500) NOT NULL,
	"module" varchar(255),
	"severity" varchar(50),
	"priority" varchar(50),
	"environment" varchar(100),
	"status" varchar(50),
	"created_date" timestamp,
	"resolved_date" timestamp,
	"closed_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "defect_lifecycle" (
	"lifecycle_id" serial PRIMARY KEY NOT NULL,
	"defect_id" integer NOT NULL,
	"from_status" varchar(50),
	"to_status" varchar(50),
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reopen_count" integer DEFAULT 0,
	"resolution_days" integer
);
--> statement-breakpoint
CREATE TABLE "analytics_results" (
	"result_id" serial PRIMARY KEY NOT NULL,
	"dataset_id" integer NOT NULL,
	"reopen_rate" real,
	"avg_resolution_time" real,
	"defect_leakage_rate" real,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_risk_scores" (
	"risk_id" serial PRIMARY KEY NOT NULL,
	"dataset_id" integer NOT NULL,
	"module_name" varchar(255) NOT NULL,
	"bug_count" integer DEFAULT 0,
	"reopen_rate" real,
	"risk_score" real,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_documents" (
	"doc_id" serial PRIMARY KEY NOT NULL,
	"dataset_id" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"pinecone_vector_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "ai_queries" (
	"query_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"dataset_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"source_reference" varchar(1000),
	"asked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"report_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"dataset_id" integer NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"file_path" varchar(500),
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(500) NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_dataset_id_datasets_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("dataset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defect_lifecycle" ADD CONSTRAINT "defect_lifecycle_defect_id_defects_defect_id_fk" FOREIGN KEY ("defect_id") REFERENCES "public"."defects"("defect_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_results" ADD CONSTRAINT "analytics_results_dataset_id_datasets_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("dataset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_risk_scores" ADD CONSTRAINT "module_risk_scores_dataset_id_datasets_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("dataset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_documents" ADD CONSTRAINT "ai_documents_dataset_id_datasets_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("dataset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_dataset_id_datasets_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("dataset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_dataset_id_datasets_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("dataset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;