CREATE TABLE IF NOT EXISTS guestbook_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 32),
    message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 500),
    created_at TEXT NOT NULL,
    reply TEXT,
    replied_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_guestbook_entries_created_at
    ON guestbook_entries(created_at DESC);

CREATE TABLE IF NOT EXISTS guestbook_login_attempts (
    ip_hash TEXT PRIMARY KEY,
    window_started_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS guestbook_post_limits (
    ip_hash TEXT PRIMARY KEY,
    last_post_at INTEGER NOT NULL
);
