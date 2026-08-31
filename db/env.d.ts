declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    APP_ORIGIN?: string;
    ACCOUNT_ORIGIN?: string;
    FORUM_ORIGIN?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    GITHUB_PUBLIC_READ_TOKEN?: string;
    SESSION_SECRET?: string;
    TOKEN_ENCRYPTION_KEY?: string;
    GITHUB_DISCUSSIONS_OWNER?: string;
    GITHUB_DISCUSSIONS_REPO?: string;
    GITHUB_DISCUSSIONS_REPOSITORY_ID?: string;
    FOUNDER_GITHUB_USER_ID?: string;
  }
}
