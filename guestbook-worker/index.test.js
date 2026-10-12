import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "./index.js";

class MemoryD1 {
    constructor() {
        this.entries = [];
        this.loginAttempts = new Map();
        this.postLimits = new Map();
        this.nextId = 1;
    }

    prepare(sql) {
        const statement = {
            all: async () => this.all(sql, [])
        };
        statement.bind = (...values) => ({
            first: async () => this.first(sql, values),
            all: async () => this.all(sql, values),
            run: async () => this.run(sql, values)
        });
        return statement;
    }

    async first(sql, values) {
        if (sql.includes("guestbook_post_limits")) return this.postLimits.get(values[0]) || null;
        if (sql.includes("guestbook_login_attempts")) return this.loginAttempts.get(values[0]) || null;
        return null;
    }

    async all(sql) {
        if (!sql.includes("guestbook_entries")) return { results: [] };
        return { results: [...this.entries].sort((a, b) => b.id - a.id).slice(0, 300) };
    }

    async run(sql, values) {
        if (sql.includes("INSERT INTO guestbook_post_limits")) {
            this.postLimits.set(values[0], { last_post_at: values[1] });
            return { meta: { changes: 1 } };
        }
        if (sql.includes("INSERT INTO guestbook_login_attempts")) {
            this.loginAttempts.set(values[0], { window_started_at: values[1], attempts: values[2] });
            return { meta: { changes: 1 } };
        }
        if (sql.includes("UPDATE guestbook_login_attempts")) {
            const row = this.loginAttempts.get(values[0]);
            if (row) row.attempts += 1;
            return { meta: { changes: row ? 1 : 0 } };
        }
        if (sql.includes("DELETE FROM guestbook_login_attempts")) {
            this.loginAttempts.delete(values[0]);
            return { meta: { changes: 1 } };
        }
        if (sql.includes("INSERT INTO guestbook_entries")) {
            const entry = { id: this.nextId++, name: values[0], message: values[1], created_at: values[2], reply: null, replied_at: null };
            this.entries.push(entry);
            return { meta: { changes: 1, last_row_id: entry.id } };
        }
        if (sql.includes("UPDATE guestbook_entries")) {
            const entry = this.entries.find((item) => item.id === values[2]);
            if (entry) {
                entry.reply = values[0];
                entry.replied_at = values[1];
            }
            return { meta: { changes: entry ? 1 : 0 } };
        }
        if (sql.includes("DELETE FROM guestbook_entries")) {
            const before = this.entries.length;
            this.entries = this.entries.filter((entry) => entry.id !== values[0]);
            return { meta: { changes: before - this.entries.length } };
        }
        throw new Error(`Unhandled SQL in test: ${sql}`);
    }
}

function makeEnv() {
    return {
        DB: new MemoryD1(),
        ALLOWED_ORIGINS: "https://lucienwooo.github.io,http://localhost:8000",
        GUESTBOOK_ADMIN_PASSWORD: "test-admin-password",
        GUESTBOOK_SESSION_SECRET: "test-session-secret-with-more-than-32-characters",
        SESSION_TTL_SECONDS: "3600"
    };
}

function makeRequest(path, { method = "GET", body, token, ip = "192.0.2.1", origin = "https://lucienwooo.github.io" } = {}) {
    const headers = new Headers({ Origin: origin, "CF-Connecting-IP": ip });
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return new Request(`https://worker.example${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
}

async function responseJson(response) {
    return { status: response.status, body: await response.json() };
}

test("anonymous posts persist and public clients cannot reply or delete", async () => {
    const env = makeEnv();
    const posted = await responseJson(await worker.fetch(makeRequest("/api/entries", {
        method: "POST",
        body: { name: "Guest", message: "Hello" }
    }), env));
    assert.equal(posted.status, 201);

    const list = await responseJson(await worker.fetch(makeRequest("/api/entries"), env));
    assert.equal(list.status, 200, JSON.stringify(list.body));
    assert.equal(list.body.entries[0].name, "Guest");

    const reply = await responseJson(await worker.fetch(makeRequest("/api/admin/entries/1/reply", {
        method: "PATCH",
        body: { reply: "Thanks" }
    }), env));
    assert.equal(reply.status, 401);

    const deletion = await responseJson(await worker.fetch(makeRequest("/api/admin/entries/1", { method: "DELETE" }), env));
    assert.equal(deletion.status, 401);
});

test("admin login permits replying and deleting", async () => {
    const env = makeEnv();
    await worker.fetch(makeRequest("/api/entries", { method: "POST", body: { name: "Guest", message: "Hello" } }), env);
    const login = await responseJson(await worker.fetch(makeRequest("/api/admin/login", {
        method: "POST",
        body: { password: env.GUESTBOOK_ADMIN_PASSWORD }
    }), env));
    assert.equal(login.status, 200);

    const reply = await responseJson(await worker.fetch(makeRequest("/api/admin/entries/1/reply", {
        method: "PATCH",
        token: login.body.token,
        body: { reply: "Thanks" }
    }), env));
    assert.equal(reply.status, 200);
    assert.equal(env.DB.entries[0].reply, "Thanks");

    const deletion = await responseJson(await worker.fetch(makeRequest("/api/admin/entries/1", {
        method: "DELETE",
        token: login.body.token
    }), env));
    assert.equal(deletion.status, 200);
    assert.equal(env.DB.entries.length, 0);
});

test("requests from unapproved origins are rejected", async () => {
    const response = await worker.fetch(makeRequest("/api/entries", { origin: "https://attacker.example" }), makeEnv());
    assert.equal(response.status, 403);
});
