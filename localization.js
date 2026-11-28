const supportedLanguages = ["zh-Hant", "en", "ko", "ja"];
const preferenceKey = "sp-archive-language";
const han = /[\u3400-\u9fff]/;
const hanWords = /[\u3400-\u9fff]+/g;
const token = /\{(\d+)\}/g;
const textAttributes = ["alt", "aria-label", "aria-valuetext", "placeholder", "title"];
const ignored = "script, style, [data-no-translate], #player-comments-widget";
const originals = new WeakMap();
const packs = new Map();
let activeLanguage = "zh-Hant";
let translations = {};
let templates = [];

export function siteLanguage() {
    return activeLanguage;
}

export function commentLanguage() {
    return { "zh-Hant": "zh-TW", en: "en", ko: "ko", ja: "jp" }[activeLanguage];
}

export function sourceText(element) {
    return Array.from(element.childNodes, (node) => originals.get(node)?.get("text")?.source ?? node.textContent).join("");
}

export function sourceAttribute(element, name) {
    return originals.get(element)?.get(name)?.source ?? element.getAttribute(name);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^$\\\{\}()|[\]]/g, "\\$&");
}

function createTemplates(dictionary) {
    return Object.entries(dictionary)
        .filter(([source]) => /\{\d+\}/.test(source))
        .sort(([a], [b]) => b.replace(token, "").length - a.replace(token, "").length)
        .map(([source, target]) => {
            const fragments = source.split(token);
            const positions = fragments.filter((_, index) => index % 2);
            const pattern = fragments.map((value, index) => index % 2 ? "(.+?)" : escapeRegex(value)).join("");
            return { pattern: new RegExp("^" + pattern + "$", "s"), positions, target };
        });
}

export function translate(value, depth = 0) {
    if (!han.test(value) || activeLanguage === "zh-Hant") return value;
    const source = value.trim();
    const translated = translations[source];
    if (translated) return value.replace(source, () => translated);
    if (depth < 3) {
        for (const {pattern, positions, target} of templates) {
            const match = source.match(pattern);
            if (!match) continue;
            const replacements = new Map(positions.map((id, index) => [id, translate(match[index + 1], depth + 1)]));
            return value.replace(source, () => target.replace(token, (part, id) => replacements.get(id) ?? part));
        }
    }
    return value.replace(hanWords, (word) => translations[word] ?? word);
}

function localize(node, key, value, setValue) {
    const recorded = originals.get(node);
    const last = recorded?.get(key);
    const source = last && value === last.localized ? last.source : value;
    if (!han.test(source) && !last) return;
    const localized = translate(source);
    const records = recorded ?? new Map();
    records.set(key, { source, localized });
    if (!recorded) originals.set(node, records);
    if (localized !== value) setValue(localized);
}

function localizeText(node) {
    if (!node.parentElement || node.parentElement.closest(ignored)) return;
    localize(node, "text", node.data, (value) => {
        const option = node.parentElement.closest("option:not([value])");
        if (option) option.value = option.value;
        node.data = value;
    });
}

function localizeAttributes(element) {
    if (element.closest(ignored)) return;
    const attributes = element.matches('meta[name="description"]') ? ["content"] : textAttributes;
    for (const name of attributes) {
        const current = element.getAttribute(name);
        if (current !== null) localize(element, name, current, (value) => element.setAttribute(name, value));
    }
}

function localizeTree(root) {
    if (root.nodeType === Node.TEXT_NODE) {
        localizeText(root);
        return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(ignored)) return;
    localizeAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            return node.nodeType === Node.ELEMENT_NODE && node.matches(ignored)
                ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        },
    });
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE) localizeText(node);
        else localizeAttributes(node);
    }
}

async function loadPack(language) {
    if (language === "zh-Hant") return {};
    if (!packs.has(language)) {
        const url = new URL("./data/languages/" + language + ".json?v=1", import.meta.url);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Language pack unavailable");
        packs.set(language, await response.json());
    }
    return packs.get(language);
}

export function initializeLocalization(onChange) {
    const select = document.querySelector("#language-select");
    const observer = new MutationObserver((records) => {
        for (const record of records) {
            if (record.type === "attributes") localizeAttributes(record.target);
            else if (record.type === "characterData") localizeText(record.target);
            else for (const node of record.addedNodes) localizeTree(node);
        }
    });
    observer.observe(document.documentElement, {
        subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: [...textAttributes, "content"],
    });

    let revision = 0;
    async function activate(language) {
        if (!supportedLanguages.includes(language)) return;
        const requested = ++revision;
        try {
            const dictionary = await loadPack(language);
            if (requested !== revision) return;
            translations = dictionary;
            templates = createTemplates(dictionary);
            activeLanguage = language;
            document.documentElement.lang = language;
            select.value = language;
            localizeTree(document.documentElement);
            onChange?.(language);
            try { localStorage.setItem(preferenceKey, language); } catch { /* Storage may be blocked. */ }
        } catch (error) {
            if (requested === revision) select.value = activeLanguage;
            console.error("Could not load language pack", error);
        }
    }

    select.addEventListener("change", () => activate(select.value));
    try { activate(localStorage.getItem(preferenceKey) ?? activeLanguage); } catch { activate(activeLanguage); }
}
