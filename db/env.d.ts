declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    APP_ORIGIN?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    SESSION_SECRET?: string;
    TOKEN_ENCRYPTION_KEY?: string;
    GITHUB_DISCUSSIONS_OWNER?: string;
    GITHUB_DISCUSSIONS_REPO?: string;
    GITHUB_DISCUSSIONS_REPOSITORY_ID?: string;
    FOUNDER_GITHUB_USER_ID?: string;
  }
}
