const RETAINED_VISIT_DAYS = 2;
const TAIPEI_DAY_MS = 24 * 60 * 60 * 1000;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname !== "/" || request.method !== "GET") {
            return new Response("Not found", { status: 404 });
        }

        const ipAddress = request.headers.get("CF-Connecting-IP");
        const secret = env.VISITOR_HASH_SECRET;
        if (!ipAddress || !secret || secret.length < 32) {
            return new Response("Visitor counter is not configured.", {
                status: 503,
                headers: { "Cache-Control": "no-store" }
            });
        }

        const day = getTaipeiDay();
        const visitorHash = await hashVisitor(ipAddress, day, secret);
        const counter = env.VISITOR_COUNTER.get(env.VISITOR_COUNTER.idFromName("site-total"));
        const result = await counter.fetch("https://counter.internal/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day, visitorHash })
        });
        if (!result.ok) {
            return new Response("Visitor counter is unavailable.", {
                status: 503,
                headers: { "Cache-Control": "no-store" }
            });
        }

        const { total } = await result.json();
        return new Response(createBadgeSvg(total), {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Content-Type": "image/svg+xml; charset=utf-8",
                "X-Content-Type-Options": "nosniff"
            }
        });
    }
};

export class VisitorCounter {
    constructor(ctx) {
        this.ctx = ctx;
    }

    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname !== "/record" || request.method !== "POST") {
            return new Response("Not found", { status: 404 });
        }

        const { day, visitorHash } = await request.json();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^[a-f0-9]{64}$/.test(visitorHash)) {
            return new Response("Invalid visit record.", { status: 400 });
        }

        const state = await this.ctx.storage.get("state") || { total: 0, dailyVisitors: {} };
        const dailyVisitors = state.dailyVisitors && typeof state.dailyVisitors === "object"
            ? state.dailyVisitors
            : {};
        const cutoffDay = getTaipeiDay(new Date(Date.now() - RETAINED_VISIT_DAYS * TAIPEI_DAY_MS));
        for (const storedDay of Object.keys(dailyVisitors)) {
            if (storedDay < cutoffDay) delete dailyVisitors[storedDay];
        }

        const visitors = Array.isArray(dailyVisitors[day]) ? dailyVisitors[day] : [];
        if (!visitors.includes(visitorHash)) {
            visitors.push(visitorHash);
            dailyVisitors[day] = visitors;
            state.total = Number.isSafeInteger(state.total) && state.total >= 0 ? state.total + 1 : 1;
        }
        state.dailyVisitors = dailyVisitors;
        await this.ctx.storage.put("state", state);

        return Response.json({ total: state.total });
    }
}

function getTaipeiDay(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

async function hashVisitor(ipAddress, day, secret) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const digest = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${day}:${ipAddress}`)
    );
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createBadgeSvg(total) {
    const count = String(total);
    const valueWidth = Math.max(34, count.length * 8 + 14);
    const width = 64 + valueWidth;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="visitors: ${count}" viewBox="0 0 ${width} 20"><rect width="64" height="20" rx="3" fill="#26322b"/><rect x="64" width="${valueWidth}" height="20" rx="3" fill="#62d6a2"/><path fill="#62d6a2" d="M61 0h6v20h-6z"/><g fill="#fff" font-family="Verdana,sans-serif" font-size="11" text-anchor="middle"><text x="32" y="14">visitors</text></g><g fill="#111713" font-family="Verdana,sans-serif" font-size="11" text-anchor="middle"><text x="${64 + valueWidth / 2}" y="14">${count}</text></g></svg>`;
}
