const encoder = new TextEncoder();
const MAX_NAME_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 500;
const MAX_BODY_BYTES = 4096;
const LOGIN_WINDOW_SECONDS = 600;
const LOGIN_MAX_ATTEMPTS = 8;
const POST_INTERVAL_SECONDS = 10;

function jsonResponse(body, status, headers = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...headers,
            "Cache-Control": "no-store",
            "Content-Type": "application/json; charset=utf-8"
        }
    });
}

function corsHeaders(request, env) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = new Set((env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean));
    if (origin && !allowedOrigins.has(origin)) return null;
    if (!origin) return {};
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
    };
}

async function readJson(request) {
    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_BODY_BYTES) throw new Error("請求內容過大。");
    const text = await request.text();
    if (encoder.encode(text).byteLength > MAX_BODY_BYTES) throw new Error("請求內容過大。");
    try {
        return JSON.parse(text);
    } catch {
        throw new Error("請求格式錯誤。");
    }
}

function validateText(value, maxLength, fieldName) {
    if (typeof value !== "string") throw new Error(`${fieldName}格式錯誤。`);
    const text = value.trim();
    if (!text || text.length > maxLength) throw new Error(`${fieldName}不可空白，且最多 ${maxLength} 個字元。`);
    return text;
}

async function hashText(value) {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function rateLimitKey(request, env) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    return hashText(`${env.GUESTBOOK_SESSION_SECRET}:${ip}`);
}

async function isPostRateLimited(request, env, now) {
    const key = await rateLimitKey(request, env);
    const row = await env.DB.prepare("SELECT last_post_at FROM guestbook_post_limits WHERE ip_hash = ?")
        .bind(key)
        .first();
    if (row && now - row.last_post_at < POST_INTERVAL_SECONDS) return true;
    await env.DB.prepare(`INSERT INTO guestbook_post_limits (ip_hash, last_post_at)
        VALUES (?, ?) ON CONFLICT(ip_hash) DO UPDATE SET last_post_at = excluded.last_post_at`)
        .bind(key, now)
        .run();
    return false;
}

async function recordLoginAttempt(request, env, now) {
    const key = await rateLimitKey(request, env);
    const row = await env.DB.prepare("SELECT window_started_at, attempts FROM guestbook_login_attempts WHERE ip_hash = ?")
        .bind(key)
        .first();
    if (row && now - row.window_started_at < LOGIN_WINDOW_SECONDS && row.attempts >= LOGIN_MAX_ATTEMPTS) return null;
    if (!row || now - row.window_started_at >= LOGIN_WINDOW_SECONDS) {
        await env.DB.prepare(`INSERT INTO guestbook_login_attempts (ip_hash, window_started_at, attempts)
            VALUES (?, ?, 1) ON CONFLICT(ip_hash) DO UPDATE SET window_started_at = excluded.window_started_at, attempts = 1`)
            .bind(key, now)
            .run();
        return key;
    }
    await env.DB.prepare("UPDATE guestbook_login_attempts SET attempts = attempts + 1 WHERE ip_hash = ?")
        .bind(key)
        .run();
    return key;
}

function constantTimeEqual(first, second) {
    const left = encoder.encode(first);
    const right = encoder.encode(second);
    let difference = left.length ^ right.length;
    const maxLength = Math.max(left.length, right.length);
    for (let index = 0; index < maxLength; index += 1) difference |= (left[index] || 0) ^ (right[index] || 0);
    return difference === 0;
}

function base64UrlEncode(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signToken(payload, secret) {
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    return base64UrlEncode(new Uint8Array(signature));
}

async function createAdminToken(secret, now, ttlSeconds) {
    const payload = base64UrlEncode(encoder.encode(JSON.stringify({ exp: now + ttlSeconds })));
    return `${payload}.${await signToken(payload, secret)}`;
}

async function verifyAdminToken(request, secret, now) {
    const authorization = request.headers.get("Authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return false;
    if (!constantTimeEqual(signature, await signToken(payload, secret))) return false;
    try {
        const claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
        return Number.isInteger(claims.exp) && claims.exp > now;
    } catch {
        return false;
    }
}

function requireStorage(env) {
    if (!env.DB) throw new Error("留言資料庫尚未設定。");
}

function requireAdminSecrets(env) {
    if (!env.GUESTBOOK_ADMIN_PASSWORD || !env.GUESTBOOK_SESSION_SECRET || env.GUESTBOOK_SESSION_SECRET.length < 32) {
        throw new Error("管理登入尚未完成安全設定。");
    }
}

export default {
    async fetch(request, env) {
        const headers = corsHeaders(request, env);
        if (headers === null) return jsonResponse({ error: "來源網址不允許。" }, 403);
        if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

        const url = new URL(request.url);
        const now = Math.floor(Date.now() / 1000);
        try {
            if (url.pathname === "/api/entries" && request.method === "GET") {
                requireStorage(env);
                const result = await env.DB.prepare(`SELECT id, name, message, created_at, reply, replied_at
                    FROM guestbook_entries ORDER BY id DESC LIMIT 300`).all();
                return jsonResponse({ entries: result.results || [] }, 200, headers);
            }

            if (url.pathname === "/api/entries" && request.method === "POST") {
                requireStorage(env);
                requireAdminSecrets(env);
                const body = await readJson(request);
                const name = validateText(body.name, MAX_NAME_LENGTH, "名稱");
                const message = validateText(body.message, MAX_MESSAGE_LENGTH, "留言");
                if (await isPostRateLimited(request, env, now)) {
                    return jsonResponse({ error: "送出太頻繁，請稍候再試。" }, 429, headers);
                }
                const result = await env.DB.prepare(`INSERT INTO guestbook_entries (name, message, created_at)
                    VALUES (?, ?, ?)`)
                    .bind(name, message, new Date().toISOString())
                    .run();
                return jsonResponse({ id: result.meta?.last_row_id }, 201, headers);
            }

            if (url.pathname === "/api/admin/login" && request.method === "POST") {
                requireStorage(env);
                requireAdminSecrets(env);
                const key = await recordLoginAttempt(request, env, now);
                if (!key) return jsonResponse({ error: "登入嘗試過多，請稍後再試。" }, 429, headers);
                const body = await readJson(request);
                const password = typeof body.password === "string" ? body.password : "";
                if (!constantTimeEqual(password, env.GUESTBOOK_ADMIN_PASSWORD)) {
                    return jsonResponse({ error: "管理密碼錯誤。" }, 401, headers);
                }
                await env.DB.prepare("DELETE FROM guestbook_login_attempts WHERE ip_hash = ?").bind(key).run();
                const ttlSeconds = Math.max(900, Math.min(Number(env.SESSION_TTL_SECONDS) || 28800, 86400));
                const token = await createAdminToken(env.GUESTBOOK_SESSION_SECRET, now, ttlSeconds);
                return jsonResponse({ token, expiresAt: now + ttlSeconds }, 200, headers);
            }

            const replyMatch = url.pathname.match(/^\/api\/admin\/entries\/(\d+)\/reply$/);
            if (replyMatch && request.method === "PATCH") {
                requireStorage(env);
                requireAdminSecrets(env);
                if (!await verifyAdminToken(request, env.GUESTBOOK_SESSION_SECRET, now)) {
                    return jsonResponse({ error: "請先登入管理者帳號。" }, 401, headers);
                }
                const body = await readJson(request);
                const reply = validateText(body.reply, MAX_MESSAGE_LENGTH, "回覆");
                const id = Number(replyMatch[1]);
                const result = await env.DB.prepare("UPDATE guestbook_entries SET reply = ?, replied_at = ? WHERE id = ?")
                    .bind(reply, new Date().toISOString(), id)
                    .run();
                if (!result.meta?.changes) return jsonResponse({ error: "找不到這則留言。" }, 404, headers);
                return jsonResponse({ saved: true }, 200, headers);
            }

            const deleteMatch = url.pathname.match(/^\/api\/admin\/entries\/(\d+)$/);
            if (deleteMatch && request.method === "DELETE") {
                requireStorage(env);
                requireAdminSecrets(env);
                if (!await verifyAdminToken(request, env.GUESTBOOK_SESSION_SECRET, now)) {
                    return jsonResponse({ error: "請先登入管理者帳號。" }, 401, headers);
                }
                const result = await env.DB.prepare("DELETE FROM guestbook_entries WHERE id = ?")
                    .bind(Number(deleteMatch[1]))
                    .run();
                if (!result.meta?.changes) return jsonResponse({ error: "找不到這則留言。" }, 404, headers);
                return jsonResponse({ deleted: true }, 200, headers);
            }

            return jsonResponse({ error: "找不到 API。" }, 404, headers);
        } catch (error) {
            console.error("Guestbook request failed:", error?.name || "Error", error?.message || "Unknown error");
            const status = error.message === "請求內容過大。" ? 413
                : error.message === "請求格式錯誤。" ? 400
                    : error.message.includes("不可空白") || error.message.includes("格式錯誤") ? 400
                        : error.message.includes("最多") ? 400
                            : error.message.includes("尚未設定") ? 503
                                : 500;
            return jsonResponse({ error: status === 500 ? "留言服務暫時無法使用。" : error.message }, status, headers);
        }
    }
};
