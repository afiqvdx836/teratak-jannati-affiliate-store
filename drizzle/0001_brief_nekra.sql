CREATE TABLE "magic_link_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_name" text DEFAULT '[Nama Brand]' NOT NULL,
	"tagline" text DEFAULT 'Semua link produk dari video TikTok kami' NOT NULL,
	"about_content" text,
	"logo_url" text,
	"favicon_url" text,
	"accent_color" text DEFAULT '#b5482a' NOT NULL,
	"bg_scheme" text DEFAULT 'cream' NOT NULL,
	"font_body" text DEFAULT 'plus-jakarta-sans' NOT NULL,
	"font_display" text DEFAULT 'fraunces' NOT NULL,
	"social_tiktok" text,
	"social_shopee" text,
	"social_instagram" text,
	"custom_domain" text,
	"owner_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
