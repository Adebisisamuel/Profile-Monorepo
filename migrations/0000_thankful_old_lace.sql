CREATE TABLE "churches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"denomination" text NOT NULL,
	"location" text NOT NULL,
	"logo_url" text,
	"created_by_id" integer NOT NULL,
	"created_at" text DEFAULT '2025-04-02T08:57:13.466Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"apostle" integer NOT NULL,
	"prophet" integer NOT NULL,
	"evangelist" integer NOT NULL,
	"herder" integer NOT NULL,
	"teacher" integer NOT NULL,
	"responses" jsonb NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_by_id" integer NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"invite_code" text NOT NULL,
	"church_id" integer,
	CONSTRAINT "teams_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"name" text NOT NULL,
	"birth_date" date,
	"country" text,
	"city" text,
	"current_sector" text,
	"preferred_sector" text,
	"referral_source" text,
	"role" text DEFAULT 'user' NOT NULL,
	"team_id" integer,
	"created_at" text DEFAULT '2025-04-02T08:57:13.464Z' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
