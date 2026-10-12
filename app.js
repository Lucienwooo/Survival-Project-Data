const DATA_URL = new URL("./data/cards.json?v=11", import.meta.url);
const ART_BASE_URL = new URL("./images/global_card_images/", import.meta.url);
const CHARACTER_ART_URL = new URL("./images/characters/", import.meta.url);
const GOLD_NUMBER_URL = new URL("./images/card_effects/images_global_card_out_line_l_gold_number.png", import.meta.url);
const elementArtwork = [
    ["火", "fire"],
    ["水", "water"],
    ["土", "earth"],
    ["風", "wind"]
];

const effectLabels = {
    max_speed: ["增加最大速度", "減少最大速度"],
    attack_speed: ["增加攻擊速度", "減少攻擊速度"],
    attack_time: ["增加攻擊時間", "減少攻擊時間"],
    attack_damage: ["攻擊傷害增加", "攻擊傷害減少"],
    attack_delay: ["增加攻擊延遲", "減少攻擊延遲"],
    mp_consumption: ["增加MP消耗", "減少MP消耗"],
    bp_consumption: ["增加BP消耗", "減少BP消耗"],
    hp_recovery: ["增加HP恢復", "減少HP恢復"],
    bp_recovery: ["增加BP恢復", "減少BP恢復"],
    mp_recovery: ["增加MP恢復", "減少MP恢復"],
    weapon_speed: ["增加武器速度", "減少武器速度"],
    vibration_rate: ["震動率增加", "震動率減少"]
};

const smallArtworkOnly = new Set(["2:fire:wand"]);
const characters = [
    ["Xyrho", "火"], ["Shamoo", "火"], ["Sven", "水"], ["Cream", "水"],
    ["Roland", "土"], ["Aurelli", "風"], ["Hawk", "風"], ["Hazel", "土"],
    ["Cara", "火"], ["Warren", "土"], ["Lucy", "水"], ["Will", "風"]
].map(([name, element], index) => ({ id: index + 1, name, element }));
const compareSlots = { magic: null, weapon: null, armor: null };
const searchInput = document.querySelector("#search-input");
const elementFilter = document.querySelector("#filter-element");
const equipmentLevel = document.querySelector("#equipment-level");
const skillOneFilter = document.querySelector("#filter-skill-one");
const skillTwoFilter = document.querySelector("#filter-skill-two");
const effectFilters = document.querySelector("#effect-filters");
const effectFilterOptions = document.querySelector("#effect-filter-options");
const effectFilterNote = document.querySelector("#effect-filter-note");
const cardGrid = document.querySelector("#card-grid");
const emptyState = document.querySelector("#empty-state");
const loadStatus = document.querySelector("#load-status");
const visibleCount = document.querySelector("#visible-count");
const comparePanel = document.querySelector("#compare-panel");
const compareToggle = document.querySelector("#toggle-compare");
const compareTotalList = document.querySelector("#compare-total-list");
const compareActivationList = document.querySelector("#compare-activation-list");
const characterOptions = document.querySelector("#character-options");
const characterSelectButton = document.querySelector("#character-select-button");
const characterPickerMenu = document.querySelector("#character-picker-menu");
const editorToolbar = document.querySelector("#editor-toolbar");
const adminDialog = document.querySelector("#admin-dialog");
const adminPasswordInput = document.querySelector("#admin-password");
const themeToggle = document.querySelector("#theme-toggle");
const importCardFile = document.querySelector("#import-card-file");
const editorStatus = document.querySelector(".editor-status");
let selectedCharacterId = 1;
let editMode = false;
let cards = [];

document.querySelector("#reset-filters").addEventListener("click", resetFilters);
compareToggle.addEventListener("click", toggleComparePanel);
characterSelectButton.addEventListener("click", toggleCharacterPicker);
document.addEventListener("click", (event) => {
    if (!characterPickerMenu.hidden && !characterSelectButton.closest(".character-picker").contains(event.target)) closeCharacterPicker();
});
themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    setTheme(nextTheme, true);
});
const sponsorDialog = document.querySelector("#sponsor-dialog");
document.querySelector("#open-sponsor").addEventListener("click", () => sponsorDialog.showModal());
document.querySelector("#close-sponsor").addEventListener("click", () => sponsorDialog.close());
searchInput.addEventListener("input", renderCards);
elementFilter.addEventListener("change", renderCards);
skillOneFilter.addEventListener("change", renderCards);
skillTwoFilter.addEventListener("change", renderCards);
equipmentLevel.addEventListener("change", () => {
    updateEffectFilterState();
    renderCards();
});
document.querySelector("#admin-entry").addEventListener("click", () => {
    adminDialog.showModal();
    adminPasswordInput.focus();
});
document.querySelector("#close-admin-dialog").addEventListener("click", () => adminDialog.close());
document.querySelector("#admin-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (adminPasswordInput.value !== "306478") {
        adminPasswordInput.setCustomValidity("密碼不正確");
        adminPasswordInput.reportValidity();
        adminPasswordInput.setCustomValidity("");
        adminPasswordInput.select();
        return;
    }
    adminDialog.close();
    adminPasswordInput.value = "";
    enterEditMode();
});
document.querySelector("#save-all-edits").addEventListener("click", saveAllCardEdits);
document.querySelector("#export-card-data").addEventListener("click", exportCardData);
document.querySelector("#import-card-data").addEventListener("click", () => importCardFile.click());
importCardFile.addEventListener("change", () => {
    const [file] = importCardFile.files;
    if (file) importCardData(file);
    importCardFile.value = "";
});
document.querySelector("#exit-edit-mode").addEventListener("click", exitEditMode);

renderEffectFilters();
renderCharacterOptions();
setTheme(getSavedTheme());
selectCharacter(selectedCharacterId);
updateEffectFilterState();

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !characterPickerMenu.hidden) closeCharacterPicker();
    if (event.key === "/" && !sponsorDialog.open && !isTextEntry(event.target)) {
        event.preventDefault();
        searchInput.focus();
    }
});

sponsorDialog.addEventListener("click", (event) => {
    if (event.target === sponsorDialog) sponsorDialog.close();
});

loadCatalog();

async function loadCatalog() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const catalog = await response.json();
        cards = Object.values(catalog).filter((card) => card && card.id !== undefined && card.art_subtype);
        applySavedCardEdits();
        cards.sort((first, second) => Number(first.id) - Number(second.id));
        elementFilter.value = "";

        document.querySelector("#stat-total").textContent = cards.length;
        renderSpecialSkillFilters();
        loadStatus.hidden = true;
        renderCards();
    } catch (error) {
        loadStatus.dataset.state = "error";
        loadStatus.textContent = "卡片資料載入失敗。請透過本機網站伺服器或 GitHub Pages 開啟此頁。";
        console.error("Unable to load the card catalog:", error);
    }
}

function renderCards() {
    const query = searchInput.value.trim().toLocaleLowerCase("zh-TW");
    const selectedElement = elementFilter.value;
    const selectedSkillOne = skillOneFilter.value;
    const selectedSkillTwo = skillTwoFilter.value;
    const selectedEffects = [...effectFilterOptions.querySelectorAll("input:checked")]
        .map((input) => ({ key: input.dataset.statKey, direction: input.dataset.statDirection }));
    const filtered = cards.filter((card) => {
        const searchable = [card.id, card.name_zh, card.name_en, card.element]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("zh-TW");

        return (!query || searchable.includes(query))
            && (!selectedElement || card.element === selectedElement)
            && (!selectedSkillOne || getSpecialSkillLabels(card)[0] === selectedSkillOne)
            && (!selectedSkillTwo || getSpecialSkillLabels(card)[1] === selectedSkillTwo)
            && (equipmentLevel.value !== "9" || selectedEffects.every(({ key, direction }) => {
                const value = card.stats?.[key];
                return typeof value === "number" && (direction === "increase" ? value > 0 : value < 0);
            }));
    });

    filtered.sort((first, second) => Number(first.id) - Number(second.id));

    const fragment = document.createDocumentFragment();
    filtered.forEach((card, index) => fragment.append(createCard(card, index)));
    cardGrid.replaceChildren(fragment);
    visibleCount.textContent = `${filtered.length} / ${cards.length}`;
    emptyState.hidden = filtered.length !== 0;
}

function createCard(card, index) {
    const article = document.createElement("article");
    article.className = "catalog-card";
    article.dataset.cardId = card.id;
    article.dataset.tone = getTone(card);
    article.style.setProperty("--card-order", index % 12);

    const head = document.createElement("div");
    head.className = "card-head";
    const id = document.createElement("span");
    id.className = "card-id";
    id.textContent = `ID / ${card.id}`;
    const level = document.createElement("span");
    level.className = "card-level";
    level.textContent = `LV. ${equipmentLevel.value}`;
    head.append(id, level);

    const art = document.createElement("div");
    art.className = "card-art";
    addArtwork(art, card);

    const nameZh = document.createElement("h3");
    nameZh.className = "card-name-zh";
    nameZh.textContent = card.name_zh || "未命名卡片";
    const nameLine = document.createElement("div");
    nameLine.className = "card-name-line";
    const wearButton = document.createElement("button");
    wearButton.className = "card-wear-button";
    wearButton.type = "button";
    const slot = equipmentSlotForCard(card);
    const isWorn = compareSlots[slot]?.card.id === card.id;
    wearButton.textContent = isWorn ? "已穿戴" : "穿戴";
    wearButton.classList.toggle("is-worn", isWorn);
    wearButton.setAttribute("aria-pressed", String(isWorn));
    wearButton.addEventListener("click", () => wearCard(card));
    nameLine.append(nameZh, wearButton);
    const nameEn = document.createElement("p");
    nameEn.className = "card-name-en";
    nameEn.textContent = card.name_en || "";

    article.append(head, art, nameLine, nameEn);
    const effects = createEffectList(card, equipmentLevel.value, editMode);
    if (effects) article.append(effects);
    return article;
}

function equipmentSlotForCard(card) {
    return card.art_subtype === "magic"
        ? "magic"
        : ["axe", "bow", "sword", "wand"].includes(card.art_subtype) ? "weapon" : "armor";
}

function createEffectList(card, level = equipmentLevel.value, editable = false) {
    if (String(level) !== "9") return null;
    const section = document.createElement("section");
    section.className = "card-ability-block";
    const list = document.createElement("ul");
    list.className = "card-effects";
    if (Array.isArray(card._text_overrides?.stats)) {
        appendTextLines(list, card._text_overrides.stats);
    } else {
        for (const [key, value] of Object.entries(card.stats || {})) list.append(createStatItem(key, value));
    }
    section.append(list);

    const divider = document.createElement("hr");
    divider.className = "card-special-divider";
    section.append(divider);

    const specialEffects = document.createElement("ul");
    specialEffects.className = "card-special-effects";
    if (Array.isArray(card._text_overrides?.special)) {
        appendTextLines(specialEffects, card._text_overrides.special, true);
    } else {
        for (const [key, value] of Object.entries(card.special_stats || {})) {
            const item = createStatItem(key, value);
            item.classList.add("card-special-stat");
            specialEffects.append(item);
        }
        for (const description of card.special_skills || []) appendHighlightedSkill(specialEffects, description);
    }
    if (!specialEffects.childElementCount) {
        const item = document.createElement("li");
        item.className = "waiting-state";
        item.textContent = "特殊技能資料待更新";
        specialEffects.append(item);
    }
    section.append(specialEffects);
    if (editable) section.append(createCardEditor(card));
    return section;
}

function createStatItem(key, value) {
    const item = document.createElement("li");
    const [increaseLabel, decreaseLabel] = effectLabels[key];
    const label = document.createElement("span");
    label.className = "card-effect-label";
    label.textContent = value < 0 ? decreaseLabel : increaseLabel;
    const valueText = document.createElement("span");
    valueText.className = "card-effect-value";
    valueText.textContent = `${Math.abs(value)}%`;
    item.append(label, valueText);
    return item;
}

function appendTextLines(list, lines, highlightDuration = false) {
    for (const line of lines) {
        if (!line) continue;
        if (highlightDuration) appendHighlightedSkill(list, line);
        else {
            const item = document.createElement("li");
            item.textContent = line;
            list.append(item);
        }
    }
}

function appendHighlightedSkill(list, description) {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.className = "skill-description";
    const rateMatch = description.match(/^(.*?\S)\s+(\d+(?:\.\d+)?%)$/);
    const descriptionText = rateMatch ? rateMatch[1] : description;
    const match = descriptionText.match(/^(.*?)(\d+(?:\.\d+)?)(秒.*)$/);
    if (match) {
        text.append(document.createTextNode(match[1]));
        const duration = document.createElement("span");
        duration.className = "skill-duration";
        duration.textContent = match[2];
        text.append(duration, document.createTextNode(match[3]));
    } else {
        text.textContent = descriptionText;
    }
    item.append(text);
    if (rateMatch) {
        const rate = document.createElement("span");
        rate.className = "skill-proc-rate";
        rate.textContent = rateMatch[2];
        item.append(rate);
    }
    list.append(item);
}

function createCardEditor(card) {
    const editor = document.createElement("div");
    editor.className = "card-editor";
    editor.dataset.cardId = card.id;
    const normalField = createEditorField("一般技能", getCardTextLines(card, "stats"), "stats");
    const specialLines = getCardTextLines(card, "special");
    const firstSpecial = createEditorField("特殊技能 S1", [specialLines[0] || ""], "special-one");
    const secondSpecial = createEditorField("特殊技能 S2", [specialLines[1] || ""], "special-two");
    const saveButton = document.createElement("button");
    saveButton.className = "card-editor-save";
    saveButton.type = "button";
    saveButton.textContent = "儲存此卡";
    saveButton.addEventListener("click", () => saveCardEdits(card.id, editor.closest(".catalog-card")));
    editor.append(normalField, firstSpecial, secondSpecial, saveButton);
    return editor;
}

function createEditorField(labelText, lines, group) {
    const label = document.createElement("label");
    label.className = "card-editor-field";
    label.textContent = labelText;
    const input = document.createElement("textarea");
    input.rows = Math.max(2, Math.min(lines.length, 6));
    input.value = lines.join("\n");
    input.dataset.editGroup = group;
    label.append(input);
    return label;
}

function getCardTextLines(card, group) {
    if (Array.isArray(card._text_overrides?.[group])) return [...card._text_overrides[group]];
    if (group === "stats") {
        return Object.entries(card.stats || {}).map(([key, value]) => formatStatLine(key, value));
    }
    return [
        ...Object.entries(card.special_stats || {}).map(([key, value]) => formatStatLine(key, value)),
        ...(card.special_skills || [])
    ];
}

function formatStatLine(key, value) {
    const [increaseLabel, decreaseLabel] = effectLabels[key];
    return `${value < 0 ? decreaseLabel : increaseLabel} ${Math.abs(value)}%`;
}

function addArtwork(container, card, level = equipmentLevel.value, isBlack = false) {
    container.classList.toggle("gold-card-art", !isBlack);
    const filename = artworkFor(card, "l", level);
    if (filename) {
        const image = document.createElement("img");
        image.src = new URL(filename, ART_BASE_URL).href;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => {
            if (!image.dataset.smallFallback) {
                image.dataset.smallFallback = "true";
                image.src = new URL(artworkFor(card, "s", level), ART_BASE_URL).href;
                return;
            }
            container.replaceChildren(createFallback(card));
            if (!isBlack) container.append(createGoldNumber());
        }, { once: true });
        container.append(image);
    } else {
        container.append(createFallback(card));
    }
    if (!isBlack) container.append(createGoldNumber());
}

function createFallback(card) {
    const fallback = document.createElement("div");
    fallback.className = "art-fallback";
    const symbol = document.createElement("span");
    symbol.className = "art-fallback-symbol";
    symbol.textContent = "✦";
    const label = document.createElement("span");
    label.className = "art-fallback-label";
    label.textContent = "裝備圖片未提供";
    fallback.append(symbol, label);
    return fallback;
}

function createGoldNumber() {
    const number = document.createElement("span");
    number.className = "gold-card-number";
    number.setAttribute("aria-hidden", "true");
    for (const digit of "365") {
        const glyph = document.createElement("span");
        glyph.className = "gold-card-digit";
        glyph.style.backgroundPosition = `${-Number(digit) * 9}px 0`;
        glyph.style.backgroundImage = `url("${GOLD_NUMBER_URL.href}")`;
        number.append(glyph);
    }
    return number;
}

function artworkFor(card, size, level = equipmentLevel.value) {
    const element = elementArtwork.find(([label]) => (card.element || "").includes(label));
    if (!element || !card.art_subtype) return "";
    const key = `${level}:${element[1]}:${card.art_subtype}`;
    const imageSize = size === "l" && smallArtworkOnly.has(key) ? "s" : size;
    return `images_global_card_card_image_gold_black_level${level}_${imageSize}_${element[1]}_${card.art_subtype}.png`;
}

function getTone(card) {
    const text = card.element || "";
    if (text.includes("火")) return "fire";
    if (text.includes("水")) return "water";
    if (text.includes("土")) return "earth";
    if (text.includes("風")) return "wind";
    return "water";
}

function resetFilters() {
    searchInput.value = "";
    elementFilter.value = "";
    equipmentLevel.value = "9";
    skillOneFilter.value = "";
    skillTwoFilter.value = "";
    effectFilterOptions.querySelectorAll("input").forEach((input) => { input.checked = false; });
    updateEffectFilterState();
    renderCards();
    searchInput.focus();
}

function enterEditMode() {
    editMode = true;
    editorToolbar.hidden = false;
    renderCards();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitEditMode() {
    editMode = false;
    editorToolbar.hidden = true;
    renderCards();
}

function applySavedCardEdits() {
    try {
        const saved = JSON.parse(localStorage.getItem("sp-card-catalog-edits") || "{}");
        for (const card of cards) {
            if (card.stats === "等待更新") card.stats = {};
            const changes = saved[String(card.id)];
            if (!changes || typeof changes !== "object") continue;
            for (const key of ["stats", "special_stats", "special_skills", "_text_overrides"]) {
                if (Object.hasOwn(changes, key)) card[key] = changes[key];
            }
            if (card.stats === "等待更新") card.stats = {};
            if (Array.isArray(card._text_overrides?.stats)) {
                card._text_overrides.stats = card._text_overrides.stats.filter((line) => line !== "能力資料待更新");
                if (!card._text_overrides.stats.length) delete card._text_overrides.stats;
                if (!Object.keys(card._text_overrides).length) card._text_overrides = null;
            }
        }
    } catch {
        return;
    }
}

function readCardEditor(card, article) {
    if (!article) return false;
    const editor = article.querySelector(".card-editor");
    if (!editor) return false;
    const linesByGroup = {
        stats: editor.querySelector('[data-edit-group="stats"]').value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
        special: ["special-one", "special-two"].map((group) => editor.querySelector(`[data-edit-group="${group}"]`).value.trim()).filter(Boolean)
    };
    const parsedStats = parseEffectLines(linesByGroup.stats);
    const parsedSpecial = parseEffectLines(linesByGroup.special);
    card.stats = parsedStats.values;
    card.special_stats = parsedSpecial.values;
    card.special_skills = parsedSpecial.custom;
    card._text_overrides = linesByGroup;
    return true;
}

function parseEffectLines(lines) {
    const values = {};
    const custom = [];
    for (const line of lines) {
        const match = line.match(/^(.*?)\s*([+-]?\d+(?:\.\d+)?)\s*%$/);
        const label = match?.[1].replace(/\s/g, "");
        const entry = Object.entries(effectLabels).flatMap(([key, labels]) => labels.map((text, index) => ({
            key,
            label: text.replace(/\s/g, ""),
            increase: index === 0
        }))).find((candidate) => candidate.label === label);
        if (!entry || !match) {
            custom.push(line);
            continue;
        }
        const rawValue = Number(match[2]);
        values[entry.key] = entry.increase ? Math.abs(rawValue) : -Math.abs(rawValue);
    }
    return { values, custom };
}

function saveCardEdits(cardId, article) {
    const card = cards.find((item) => Number(item.id) === Number(cardId));
    if (!card || !readCardEditor(card, article)) return;
    persistCardEdits();
    renderSpecialSkillFilters();
    renderCards();
    renderCompareSlots();
}

function saveAllCardEdits() {
    let changed = false;
    for (const article of cardGrid.querySelectorAll(".catalog-card")) {
        const card = cards.find((item) => Number(item.id) === Number(article.dataset.cardId));
        if (card && readCardEditor(card, article)) changed = true;
    }
    if (!changed) return;
    persistCardEdits();
    renderSpecialSkillFilters();
    renderCards();
    renderCompareSlots();
}

function persistCardEdits() {
    const saved = Object.fromEntries(cards.map((card) => [String(card.id), {
        stats: card.stats,
        special_stats: card.special_stats,
        special_skills: card.special_skills,
        _text_overrides: card._text_overrides || null
    }]));
    try {
        localStorage.setItem("sp-card-catalog-edits", JSON.stringify(saved));
        editorStatus.textContent = "已保存至此瀏覽器";
    } catch {
        window.alert("無法儲存變更，請檢查瀏覽器本機儲存空間設定。");
    }
}

function exportCardData() {
    const catalog = Object.fromEntries(cards.map((card) => [String(card.id), card]));
    const blob = new Blob([`${JSON.stringify(catalog, null, 4)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cards.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    editorStatus.textContent = "cards.json 已匯出";
}

async function importCardData(file) {
    try {
        const imported = JSON.parse(await file.text());
        const entries = Array.isArray(imported)
            ? imported.map((card) => [String(card?.id), card])
            : imported && typeof imported === "object" ? Object.entries(imported) : [];
        if (entries.length !== cards.length) throw new Error("卡片數量不符，請選擇完整的 cards.json。");

        const knownIds = new Set(cards.map((card) => String(card.id)));
        const importedById = new Map();
        for (const [key, card] of entries) {
            if (!card || typeof card !== "object" || Array.isArray(card)) throw new Error("JSON 含有無效的卡片資料。");
            const id = String(card.id ?? key);
            if (!knownIds.has(id) || importedById.has(id)) throw new Error("JSON 的卡片 ID 不符或重複。");
            if (card.stats !== undefined && card.stats !== "等待更新" && (!card.stats || typeof card.stats !== "object" || Array.isArray(card.stats))) {
                throw new Error(`卡片 ${id} 的一般能力格式錯誤。`);
            }
            if (card.special_stats !== undefined && (!card.special_stats || typeof card.special_stats !== "object" || Array.isArray(card.special_stats))) {
                throw new Error(`卡片 ${id} 的特殊能力格式錯誤。`);
            }
            if (card.special_skills !== undefined && (!Array.isArray(card.special_skills) || !card.special_skills.every((line) => typeof line === "string"))) {
                throw new Error(`卡片 ${id} 的特殊技能格式錯誤。`);
            }
            importedById.set(id, card);
        }
        if (cards.some((card) => !importedById.has(String(card.id)))) throw new Error("JSON 缺少圖鑑卡片 ID。");

        cards = cards.map((card) => {
            const source = importedById.get(String(card.id));
            return {
                ...card,
                ...source,
                id: card.id,
                stats: source.stats === "等待更新" ? {} : source.stats || {},
                special_stats: source.special_stats || {},
                special_skills: source.special_skills || [],
                _text_overrides: source._text_overrides && typeof source._text_overrides === "object" && !Array.isArray(source._text_overrides) ? source._text_overrides : null
            };
        });
        persistCardEdits();
        renderSpecialSkillFilters();
        renderCards();
        renderCompareSlots();
        editorStatus.textContent = "JSON 已匯入並保存至此瀏覽器";
    } catch (error) {
        window.alert(`JSON 匯入失敗：${error.message}`);
    }
}

function renderEffectFilters() {
    const fragment = document.createDocumentFragment();
    for (const [key, labels] of Object.entries(effectLabels)) {
        labels.forEach((label, index) => {
            const option = document.createElement("label");
            option.className = "effect-filter-option";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.dataset.statKey = key;
            input.dataset.statDirection = index === 0 ? "increase" : "decrease";
            input.addEventListener("change", renderCards);
            const text = document.createElement("span");
            text.textContent = label;
            option.append(input, text);
            fragment.append(option);
        });
    }
    effectFilterOptions.replaceChildren(fragment);
}

function updateEffectFilterState() {
    const levelNineSelected = equipmentLevel.value === "9";
    effectFilters.disabled = !levelNineSelected;
    effectFilterNote.hidden = levelNineSelected;
}

function renderSpecialSkillFilters() {
    const firstSkills = new Set();
    const secondSkills = new Set();
    for (const card of cards) {
        const [first, second] = getSpecialSkillLabels(card);
        if (first) firstSkills.add(first);
        if (second) secondSkills.add(second);
    }
    for (const [select, skills] of [[skillOneFilter, firstSkills], [skillTwoFilter, secondSkills]]) {
        const fragment = document.createDocumentFragment();
        const all = document.createElement("option");
        all.value = "";
        all.textContent = "全部";
        fragment.append(all);
        for (const skill of [...skills].sort((first, second) => first.localeCompare(second, "zh-Hant"))) {
            const option = document.createElement("option");
            option.value = skill;
            option.textContent = skill;
            fragment.append(option);
        }
        select.replaceChildren(fragment);
    }
}

function getSpecialSkillLabels(card) {
    return getCardTextLines(card, "special").slice(0, 2).map((line) => {
        const withoutRate = line.replace(/\s*[+-]?\d+(?:\.\d+)?\s*%\s*$/, "").trim();
        return withoutRate
            .replace(/\s*\d+(?:\.\d+)?\s*秒/g, " X秒")
            .replace(/^導致\s+對方/, "導致對方")
            .trim();
    });
}

function renderCharacterOptions() {
    const fragment = document.createDocumentFragment();
    for (const character of characters) {
        const option = document.createElement("button");
        option.className = "character-option";
        option.type = "button";
        option.setAttribute("role", "menuitem");
        option.dataset.characterId = character.id;
        option.setAttribute("aria-label", character.name);
        option.setAttribute("aria-pressed", String(character.id === selectedCharacterId));
        const portrait = document.createElement("img");
        portrait.src = new URL(`images_interface_room_char_select_ch_${character.id + 12}_btn_1_c.png`, CHARACTER_ART_URL).href;
        portrait.alt = "";
        portrait.width = 41;
        portrait.height = 104;
        option.append(portrait);
        option.addEventListener("click", () => selectCharacter(character.id));
        fragment.append(option);
    }

    characterOptions.replaceChildren(fragment);
}

function selectCharacter(characterId) {
    const character = characters.find((item) => item.id === characterId);
    if (!character) return;
    selectedCharacterId = character.id;
    document.querySelector("#selected-character-portrait").src = new URL(`images_interface_room_char_select_ch_${character.id + 12}_btn_1_c.png`, CHARACTER_ART_URL).href;
    const nameplate = document.querySelector("#selected-character-name");
    nameplate.textContent = character.name;
    characterSelectButton.setAttribute("aria-label", `目前角色：${character.name}。開啟角色選擇`);
    characterOptions.querySelectorAll(".character-option[data-character-id]").forEach((option) => {
        option.setAttribute("aria-pressed", String(Number(option.dataset.characterId) === character.id));
    });
    closeCharacterPicker();
    renderCompareActivation();
}

function toggleCharacterPicker() {
    const opening = characterPickerMenu.hidden;
    characterPickerMenu.hidden = !opening;
    characterSelectButton.setAttribute("aria-expanded", String(opening));
}

function closeCharacterPicker() {
    characterPickerMenu.hidden = true;
    characterSelectButton.setAttribute("aria-expanded", "false");
}

function getSavedTheme() {
    try {
        return localStorage.getItem("sp-card-catalog-theme") === "light" ? "light" : "dark";
    } catch {
        return "dark";
    }
}

function setTheme(theme, persist = false) {
    document.documentElement.dataset.theme = theme;
    const isLight = theme === "light";
    themeToggle.textContent = isLight ? "☀" : "☾";
    themeToggle.setAttribute("aria-label", `切換至${isLight ? "深" : "淺"}色主題`);
    themeToggle.setAttribute("aria-pressed", String(isLight));
    document.querySelector('meta[name="theme-color"]').content = isLight ? "#f2f5f1" : "#111713";
    if (persist) {
        try {
            localStorage.setItem("sp-card-catalog-theme", theme);
        } catch {
            return;
        }
    }
}

function toggleComparePanel() {
    const isExpanded = compareToggle.getAttribute("aria-expanded") === "true";
    compareToggle.setAttribute("aria-expanded", String(!isExpanded));
    comparePanel.hidden = isExpanded;
}

function wearCard(card) {
    const slot = equipmentSlotForCard(card);
    compareSlots[slot] = { card, level: equipmentLevel.value, isBlack: false };
    renderCompareSlots();
    renderCards();
    if (comparePanel.hidden) toggleComparePanel();
}

function renderCompareSlots() {
    for (const [slot, selection] of Object.entries(compareSlots)) {
        const content = comparePanel.querySelector(`[data-slot="${slot}"] .compare-slot-content`);
        if (!selection) {
            content.textContent = "尚未穿戴";
            content.className = "compare-slot-content is-empty";
            continue;
        }

        content.className = "compare-slot-content";
        const card = selection.card;
        const art = document.createElement("div");
        art.className = "compare-art card-art";
        addArtwork(art, card, selection.level, selection.isBlack);
        const details = document.createElement("div");
        details.className = "compare-card-details";
        const name = document.createElement("strong");
        name.textContent = card.name_zh || card.name_en;
        const identifier = document.createElement("span");
        identifier.textContent = `ID / ${card.id} · LV. ${selection.level}`;
        details.append(name, identifier);
        const removeButton = document.createElement("button");
        removeButton.className = "compare-remove";
        removeButton.type = "button";
        removeButton.textContent = "卸下";
        removeButton.addEventListener("click", () => {
            compareSlots[slot] = null;
            renderCompareSlots();
        });
        const heading = document.createElement("div");
        heading.className = "compare-card-heading";
        heading.append(details, removeButton);
        content.replaceChildren(art, heading);
        const effects = createEffectList(card, selection.level);
        if (effects) content.append(effects);
        else {
            const note = document.createElement("p");
            note.className = "compare-level-note";
            note.textContent = "能力資料僅適用第 9 級";
            content.append(note);
        }
    }
    renderCompareTotals();
    renderCompareActivation();
}

function renderCompareActivation() {
    for (const slot of ["magic", "weapon", "armor"]) {
        const cell = compareActivationList.querySelector(`[data-slot="${slot}"]`);
        const selection = compareSlots[slot];
        if (!selection) {
            cell.replaceChildren(document.createTextNode("--"));
            continue;
        }

        const toggleLabel = document.createElement("label");
        toggleLabel.className = "black-card-toggle";
        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.checked = Boolean(selection.isBlack);
        toggle.setAttribute("aria-label", `${slot} 黑卡`);
        toggle.addEventListener("change", () => {
            selection.isBlack = toggle.checked;
            renderCompareSlots();
        });
        const toggleText = document.createElement("span");
        toggleText.textContent = "黑卡";
        toggleLabel.append(toggle, toggleText);

        const rate = document.createElement("strong");
        rate.className = "activation-rate-value";
        rate.textContent = `${formatPercent(calculateActivationRate(slot, selection))}%`;
        cell.replaceChildren(toggleLabel, rate);
    }
}

function calculateActivationRate(slot, selection) {
    const baseRate = { magic: 30, weapon: 50, armor: 50 }[slot];
    const levelBonus = 30 * (Number(selection.level) - 1) / 8;
    const elementBonus = selectedCharacterElement() === selection.card.element ? 10 : 0;
    const goldBonus = selection.isBlack ? 0 : 10;
    const hasFullGoldSet = Object.values(compareSlots).every((item) => item && !item.isBlack);
    const fullGoldSetBonus = hasFullGoldSet ? 10 : 0;
    return Math.min(100, baseRate + levelBonus + elementBonus + goldBonus + fullGoldSetBonus);
}

function selectedCharacterElement() {
    return characters.find((character) => character.id === selectedCharacterId)?.element;
}

function formatPercent(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function renderCompareTotals() {
    for (const slot of ["magic", "weapon", "armor"]) {
        const cell = compareTotalList.querySelector(`[data-slot="${slot}"]`);
        const selection = compareSlots[slot];
        if (!selection) {
            cell.replaceChildren(document.createTextNode("--"));
            continue;
        }
        if (selection.level !== "9") {
            cell.textContent = "僅第 9 級提供素質資料";
            continue;
        }

        const totals = new Map();
        const baseStats = selection.card.stats && typeof selection.card.stats === "object" ? selection.card.stats : {};
        const specialStats = selection.card.special_stats && typeof selection.card.special_stats === "object" ? selection.card.special_stats : {};
        for (const source of [baseStats, specialStats]) {
            if (!source || typeof source !== "object") continue;
            for (const [key, value] of Object.entries(source)) totals.set(key, (totals.get(key) || 0) + value);
        }
        const fragment = document.createDocumentFragment();
        for (const [key, total] of totals) {
            const item = document.createElement("div");
            item.className = "compare-total-item";
            const label = document.createElement("span");
            label.className = "compare-total-label";
            label.textContent = effectLabels[key][total < 0 ? 1 : 0];
            const value = document.createElement("strong");
            value.className = "compare-total-value";
            value.textContent = `${formatPercent(Math.abs(total))}%`;
            item.append(label, value);
            const specialValue = Number(specialStats[key]) || 0;
            if (Object.prototype.hasOwnProperty.call(specialStats, key) && specialValue !== 0) {
                const baseValue = Number(baseStats[key]) || 0;
                const breakdown = document.createElement("span");
                breakdown.className = "compare-total-breakdown";
                const baseContribution = document.createElement("span");
                baseContribution.textContent = `${baseValue < 0 ? "-" : ""}${formatPercent(Math.abs(baseValue))}`;
                const specialContribution = document.createElement("span");
                specialContribution.className = "compare-total-special";
                specialContribution.textContent = `${specialValue < 0 ? "-" : "+"}${formatPercent(Math.abs(specialValue))}`;
                breakdown.append(baseContribution, specialContribution);
                item.append(breakdown);
            }
            fragment.append(item);
        }
        cell.replaceChildren(fragment.childElementCount ? fragment : document.createTextNode("--"));
    }
}

function isTextEntry(element) {
    return element instanceof HTMLInputElement
        || element instanceof HTMLTextAreaElement
        || element instanceof HTMLSelectElement
        || element.isContentEditable;
}