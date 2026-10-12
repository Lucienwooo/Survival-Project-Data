const DATA_URL = new URL("./data/cards.json?v=14", import.meta.url);
const ART_BASE_URL = new URL("./images/global_card_images/", import.meta.url);
const CHARACTER_ART_URL = new URL("./images/characters/", import.meta.url);
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
    attack_wait: ["攻擊等待增加", "攻擊等待減少"],
    attack_damage: ["攻擊傷害增加", "攻擊傷害減少"],
    attack_delay: ["增加攻擊延遲", "減少攻擊延遲"],
    defense_time: ["增加防禦時間", "減少防禦時間"],
    evasion_time: ["增加閃避時間", "減少閃避時間"],
    mp_consumption: ["增加MP消耗", "減少MP消耗"],
    bp_consumption: ["增加BP消耗", "減少BP消耗"],
    hp_recovery: ["增加HP恢復", "減少HP恢復"],
    bp_recovery: ["增加BP恢復", "減少BP恢復"],
    mp_recovery: ["增加MP恢復", "減少MP恢復"],
    weapon_speed: ["增加武器速度", "減少武器速度"],
    vibration_rate: ["震動率增加", "震動率減少"],
    acceleration: ["增加加速度", "減少加速度"]
};
const effectLabelAliases = {
    "攻擊延遲減少": { key: "attack_delay", increase: false },
    "攻擊延遲增加": { key: "attack_delay", increase: true }
};

const weaponSpecialSkillOptions = [
    "忽略對方防禦 36%",
    "不能近程攻擊3秒 36%",
    "不可遠程攻擊3秒 36%",
    "不可發動特殊技能12.5秒 36%",
    "不可使用鎧甲卡片12.5秒 36%",
    "反彈",
    "三連射 36%",
    "毒傷害 每秒-8 36%",
    "不可奔跑7秒 36%",
    "喪失防禦力 2.5秒 36%",
    "反轉 3 36%",
    "不可旋轉4秒 36%",
    "導致對方攻擊遲鈍7秒 36%"
];
const weaponSpecialSkillOneOptions = ["攻擊傷害增加 54%", "減少攻擊時間 27%"];
const bootsSpecialSkillOneOptions = ["增加加速度 45%", "增加最大速度 45%"];
const armorSpecialSkillOneOptions = [
    "攻擊延遲減少",
    "攻擊傷害減少",
    "震動率增加",
    "攻擊傷害減少 27%",
    "攻擊延遲減少 27%",
    "震動率減少 27%"
];
const armorSpecialSkillTwoOptions = ["導致對方攻擊遲鈍 6秒 36%"];
const pendantSpecialSkillOneOptions = ["增加HP恢復 27%", "增加MP恢復 27%", "增加BP恢復 27%"];
const armorSpecialSkillOptions = [
    "保護膜 1.5秒 36%",
    "隱身斗篷 3秒 36%",
    "指南針 10秒 36%",
    "惡魔之眼 8秒 36%"
];
const bootsSpecialSkillTwoOptions = ["加速魔鞋 6秒 36%", ...armorSpecialSkillOptions];
const unavailableArtwork = new Set(["2:fire:wand"]);
const cardSkillSelections = new Map();
const characters = [
    ["Xyrho", "火"], ["Shamoo", "火"], ["Sven", "水"], ["Cream", "水"],
    ["Roland", "土"], ["Aurelli", "風"], ["Hawk", "風"], ["Hazel", "土"],
    ["Cara", "火"], ["Warren", "土"], ["Lucy", "水"], ["Will", "風"]
].map(([name, element], index) => ({ id: index + 1, name, element }));
const comparisonStates = [createComparisonState()];
const searchInput = document.querySelector("#search-input");
const elementFilter = document.querySelector("#filter-element");
const categoryFilter = document.querySelector("#filter-category");
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
const comparePanelActions = document.querySelector("#compare-panel-actions");
const addComparePanelButton = document.querySelector("#add-compare-panel");
const clearComparePanelButton = document.querySelector("#clear-compare-panels");
const editorToolbar = document.querySelector("#editor-toolbar");
const adminDialog = document.querySelector("#admin-dialog");
const adminPasswordInput = document.querySelector("#admin-password");
const giscusComments = document.querySelector("#giscus-comments");
const themeToggle = document.querySelector("#theme-toggle");
const importCardFile = document.querySelector("#import-card-file");
const editorStatus = document.querySelector(".editor-status");
let giscusLoaded = false;
let nextResourceSelectId = 1;
let editMode = false;
let cards = [];
let abilitySort = { key: "", direction: "asc" };

document.querySelector("#reset-filters").addEventListener("click", resetFilters);
compareToggle.addEventListener("click", toggleComparePanel);
document.addEventListener("click", (event) => {
    document.querySelectorAll(".character-picker-menu:not([hidden])").forEach((menu) => {
        const picker = menu.closest(".character-picker");
        if (!picker.contains(event.target)) closeCharacterPicker(menu.closest(".compare-panel"));
    });
    document.querySelectorAll(".resource-select-control.is-open").forEach((control) => {
        if (!control.contains(event.target)) closeResourceSelect(control);
    });
});
addComparePanelButton.addEventListener("click", addComparisonPanel);
clearComparePanelButton.addEventListener("click", clearAdditionalComparisonPanel);
themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    setTheme(nextTheme, true);
});
const sponsorDialog = document.querySelector("#sponsor-dialog");
document.querySelector("#open-sponsor").addEventListener("click", () => sponsorDialog.showModal());
document.querySelector("#close-sponsor").addEventListener("click", () => sponsorDialog.close());
const visitCounter = document.querySelector("#visit-counter");
visitCounter.addEventListener("error", () => {
    visitCounter.hidden = true;
    const fallback = document.querySelector("#visit-counter-fallback");
    fallback.textContent = "今日計數暫不可用";
    fallback.hidden = false;
}, { once: true });
loadDailyVisitCounter();
searchInput.addEventListener("input", renderCards);
elementFilter.addEventListener("change", renderCards);
categoryFilter.addEventListener("change", renderCards);
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
document.querySelector("#admin-form").addEventListener("submit", loginAdmin);
document.querySelector("#save-all-edits").addEventListener("click", saveAllCardEdits);
document.querySelector("#export-card-data").addEventListener("click", exportCardData);
document.querySelector("#import-card-data").addEventListener("click", () => importCardFile.click());
importCardFile.addEventListener("change", () => {
    const [file] = importCardFile.files;
    if (file) importCardData(file);
    importCardFile.value = "";
});
document.querySelector("#exit-edit-mode").addEventListener("click", exitEditMode);
document.querySelector("#open-feedback").addEventListener("click", loadGiscus);

renderEffectFilters();
initializeComparisonPanel(comparePanel, 0);
setTheme(getSavedTheme());
selectCharacter(1, 0);
updateEffectFilterState();
initializeResourceTextColors();

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        document.querySelectorAll(".character-picker-menu:not([hidden])").forEach((menu) => closeCharacterPicker(menu.closest(".compare-panel")));
        document.querySelectorAll(".resource-select-control.is-open").forEach(closeResourceSelect);
    }
    if (event.key === "/" && !sponsorDialog.open && !isTextEntry(event.target)) {
        event.preventDefault();
        searchInput.focus();
    }
});

sponsorDialog.addEventListener("click", (event) => {
    if (event.target === sponsorDialog) sponsorDialog.close();
});

loadCatalog();
initializeGiscus();

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
    const selectedCategory = categoryFilter.value;
    const selectedSkillOne = skillOneFilter.value;
    const selectedSkillTwo = skillTwoFilter.value;
    const selectedEffects = [...effectFilterOptions.querySelectorAll("input:checked")]
        .map((input) => ({ key: input.dataset.statKey, direction: input.dataset.statDirection }));
    const filtered = cards.filter((card) => {
        const searchable = [card.name_zh, card.name_en, card.element]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("zh-TW");

        return (!query || searchable.includes(query))
            && (!selectedElement || card.element === selectedElement)
            && (!selectedCategory || card.art_subtype === selectedCategory)
            && (!selectedSkillOne || getSpecialSkillLabels(card)[0] === selectedSkillOne)
            && (!selectedSkillTwo || getSpecialSkillLabels(card)[1] === selectedSkillTwo)
            && selectedEffects.every(({ key, direction }) => {
                const value = card.stats?.[key];
                const scaledValue = typeof value === "number" ? scaleStatToLevel(value, equipmentLevel.value) : undefined;
                return typeof scaledValue === "number" && (direction === "increase" ? scaledValue > 0 : scaledValue < 0);
            });
    });

    filtered.sort((first, second) => {
        if (!abilitySort.key) return Number(first.id) - Number(second.id);
        const firstValue = first.stats?.[abilitySort.key];
        const secondValue = second.stats?.[abilitySort.key];
        if (typeof firstValue !== "number") return typeof secondValue === "number" ? 1 : Number(first.id) - Number(second.id);
        if (typeof secondValue !== "number") return -1;
        const difference = scaleStatToLevel(firstValue, equipmentLevel.value) - scaleStatToLevel(secondValue, equipmentLevel.value);
        return difference === 0 ? Number(first.id) - Number(second.id) : abilitySort.direction === "asc" ? difference : -difference;
    });

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
    const level = document.createElement("span");
    level.className = "card-level";
    level.textContent = `LV. ${equipmentLevel.value}`;
    head.append(level);

    const art = document.createElement("div");
    art.className = "card-art";
    addArtwork(art, card);
    makeArtworkInteractive(art, `穿戴${card.name_zh || card.name_en || "裝備"}`, () => wearCard(card));

    const nameZh = document.createElement("h3");
    nameZh.className = "card-name-zh";
    nameZh.textContent = card.name_zh || "未命名卡片";
    const nameLine = document.createElement("div");
    nameLine.className = "card-name-line";
    const wearButton = document.createElement("button");
    wearButton.className = "card-wear-button";
    wearButton.type = "button";
    const slot = equipmentSlotForCard(card);
    const isWorn = comparisonStates.some((state) => state.slots[slot]?.card.id === card.id);
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
    const levelNine = String(level) === "9";
    const levelStats = getStatsForLevel(card, level);
    const customStats = getCustomStatLines(card);
    const hasNoBaseStats = !Object.keys(levelStats).length && !customStats.length;
    if (!editable && !levelNine && hasNoBaseStats) return null;
    const section = document.createElement("section");
    section.className = "card-ability-block";
    const list = document.createElement("ul");
    list.className = "card-effects";
    for (const [key, value] of Object.entries(levelStats)) list.append(createStatItem(key, value, !editable));
    appendTextLines(list, customStats);
    if (!editable && levelNine && hasNoBaseStats) {
        const item = document.createElement("li");
        item.className = "waiting-state";
        item.textContent = "一般能力資料待更新";
        list.append(item);
    }
    section.append(list);

    if (levelNine) {
        const divider = document.createElement("hr");
        divider.className = "card-special-divider";
        section.append(divider);

        const specialEffects = document.createElement("ul");
        specialEffects.className = "card-special-effects";
        const parsedSpecial = parseEffectLines(getCardTextLines(card, "special"));
        for (const [key, value] of Object.entries(parsedSpecial.values)) {
            const item = createStatItem(key, value);
            item.classList.add("card-special-stat");
            specialEffects.append(item);
        }
        if (editable) appendTextLines(specialEffects, parsedSpecial.custom, true);
        else {
            const options = getCardSpecialSkillOptions(card, parsedSpecial.custom);
            appendSpecialSkillSelectors(specialEffects, card, options.one, options.two);
        }
        if (!specialEffects.childElementCount) {
            const item = document.createElement("li");
            item.className = "waiting-state";
            item.textContent = "特殊技能資料待更新";
            specialEffects.append(item);
        }
        section.append(specialEffects);
    }
    if (editable) section.append(createCardEditor(card));
    return section;
}

function scaleStatToLevel(value, level) {
    return Math.round(value * (Number(level) + 3) / 12 * 100) / 100;
}

function scaleStatToLevelNine(value, level) {
    return Math.round(value * 12 / (Number(level) + 3) * 100) / 100;
}

function getStatsForLevel(card, level) {
    return Object.fromEntries(Object.entries(card.stats || {}).map(([key, value]) => [key, scaleStatToLevel(value, level)]));
}

function getCustomStatLines(card) {
    if (!Array.isArray(card._text_overrides?.stats)) return [];
    return parseEffectLines(card._text_overrides.stats).custom;
}

function makeArtworkInteractive(art, label, action) {
    art.setAttribute("role", "button");
    art.setAttribute("aria-label", label);
    art.setAttribute("tabindex", "0");
    art.title = label;
    art.addEventListener("click", action);
    art.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        action();
    });
}

function createStatItem(key, value, sortable = false) {
    const item = document.createElement("li");
    const [increaseLabel, decreaseLabel] = effectLabels[key];
    const label = document.createElement("span");
    label.className = "card-effect-label";
    label.textContent = value < 0 ? decreaseLabel : increaseLabel;
    const valueText = document.createElement("span");
    valueText.className = "card-effect-value";
    valueText.textContent = `${formatPercent(Math.abs(value))}%`;
    item.append(label, valueText);
    if (sortable) {
        item.classList.add("stat-sortable");
        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
        item.setAttribute("aria-label", `依${label.textContent}排序`);
        item.title = `依${label.textContent}排序`;
        if (abilitySort.key === key) {
            const indicator = document.createElement("span");
            indicator.className = "stat-sort-indicator";
            indicator.textContent = abilitySort.direction === "asc" ? "↑" : "↓";
            item.classList.add("stat-sorted");
            label.classList.add("stat-sorted-label");
            valueText.classList.add("stat-sorted-value");
            item.append(indicator);
        }
        const sort = () => {
            if (editMode) return;
            abilitySort = {
                key,
                direction: abilitySort.key === key && abilitySort.direction === "asc" ? "desc" : "asc"
            };
            renderCards();
        };
        item.addEventListener("click", sort);
        item.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            sort();
        });
    }
    return item;
}

function appendSpecialSkillSelectors(list, card, firstSkills, secondSkills) {
    const options = { one: firstSkills, two: secondSkills };
    const selection = getCardSkillSelection(card, options);
    for (const [key, slot] of [["one", "S1"], ["two", "S2"]]) {
        const item = document.createElement("li");
        item.className = "card-special-skill-row";
        const select = document.createElement("select");
        select.className = "card-special-skill-selector";
        select.setAttribute("aria-label", `${card.name_zh || card.name_en} 特殊技能 ${slot}`);
        select.dataset.skillSlot = slot;
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "未設定";
        select.append(emptyOption);
        for (const skill of options[key]) {
            const option = document.createElement("option");
            option.value = skill;
            option.textContent = skill;
            select.append(option);
        }
        select.value = selection[key];
        select.disabled = options[key].length === 0;
        select.addEventListener("change", () => {
            selection[key] = select.value;
            cardSkillSelections.set(String(card.id), selection);
            const selectedFilters = [skillOneFilter.value, skillTwoFilter.value];
            renderSpecialSkillFilters();
            skillOneFilter.value = selectedFilters[0];
            skillTwoFilter.value = selectedFilters[1];
            renderCards();
            renderCompareSlots();
        });
        item.append(select);
        enhanceResourceSelect(select);
        list.append(item);
    }
}

function getCardSpecialSkillOptions(card, existingSkills) {
    const nonBootsSkills = existingSkills.filter((skill) => !skill.includes("加速魔鞋"));
    if (["axe", "bow", "sword", "wand"].includes(card.art_subtype)) {
        return {
            one: weaponSpecialSkillOneOptions,
            two: [...new Set([
                ...weaponSpecialSkillOptions.filter((skill) => skill !== "三連射 36%" || ["bow", "wand"].includes(card.art_subtype)),
                ...nonBootsSkills
            ])]
        };
    }
    if (card.art_subtype === "boots") {
        return {
            one: bootsSpecialSkillOneOptions,
            two: [...new Set([...bootsSpecialSkillTwoOptions, ...existingSkills])]
        };
    }
    if (card.art_subtype === "armor") {
        return {
            one: armorSpecialSkillOneOptions,
            two: [...new Set([...armorSpecialSkillOptions, ...armorSpecialSkillTwoOptions, ...nonBootsSkills])]
        };
    }
    if (card.art_subtype === "pendant") {
        return {
            one: pendantSpecialSkillOneOptions,
            two: [...new Set([...armorSpecialSkillOptions, ...nonBootsSkills])]
        };
    }
    if (card.art_subtype === "shield") return { one: existingSkills, two: armorSpecialSkillOptions };
    return { one: existingSkills, two: [] };
}

function getCardSkillSelection(card, options) {
    const key = String(card.id);
    const saved = cardSkillSelections.get(key);
    if (saved && (!saved.one || options.one.includes(saved.one)) && (!saved.two || options.two.includes(saved.two))) return saved;
    const knownSpecialStats = parseEffectLines(getCardTextLines(card, "special")).values;
    const matchingSkill = options.one.find((skill) => Object.entries(parseEffectLines([skill]).values)
        .some(([statKey, value]) => Number(knownSpecialStats[statKey]) === value));
    const selection = {
        one: saved && (!saved.one || options.one.includes(saved.one)) ? saved.one : matchingSkill || randomSkill(options.one),
        two: saved && (!saved.two || options.two.includes(saved.two)) ? saved.two : randomSkill(options.two)
    };
    cardSkillSelections.set(key, selection);
    return selection;
}

function randomSkill(skills) {
    return skills.length ? skills[Math.floor(Math.random() * skills.length)] : "";
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
    const normalField = createEditorField("能力值", getCardTextLines(card, "stats", equipmentLevel.value), "stats");
    const specialLines = getCardTextLines(card, "special");
    const firstSpecial = createEditorField("特殊技能 S1", [specialLines[0] || ""], "special-one");
    const secondSpecial = createEditorField("特殊技能 S2", [specialLines[1] || ""], "special-two");
    const saveButton = document.createElement("button");
    saveButton.className = "card-editor-save";
    saveButton.type = "button";
    saveButton.textContent = "儲存此卡";
    saveButton.addEventListener("click", () => saveCardEdits(card.id, editor.closest(".catalog-card")));
    const formula = document.createElement("p");
    formula.className = "card-editor-formula";
    formula.textContent = "能力值公式：LVn = LV9 × (n + 3) ÷ 12。輸入目前等級的數值並儲存後，會自動換算並套用至 LV.1–9。";
    editor.append(normalField, formula, firstSpecial, secondSpecial, saveButton);
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

function getCardTextLines(card, group, level = "9") {
    if (group === "stats") {
        return [
            ...Object.entries(getStatsForLevel(card, level)).map(([key, value]) => formatStatLine(key, value)),
            ...getCustomStatLines(card)
        ];
    }
    if (Array.isArray(card._text_overrides?.[group])) return [...card._text_overrides[group]];
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
    const blackBackgroundCards = new Set(["火:boots", "土:boots", "水:magic"]);
    container.classList.toggle("black-art-background", String(level) === "3" && blackBackgroundCards.has(`${card.element}:${card.art_subtype}`));
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
        }, { once: true });
        container.append(image);
    } else {
        const label = String(level) === "2" && card.element === "火" && card.art_subtype === "wand"
            ? "缺少 2 級大圖"
            : "裝備圖片未提供";
        container.append(createFallback(card, label));
    }
}

function createFallback(card, labelText = "裝備圖片未提供") {
    const fallback = document.createElement("div");
    fallback.className = "art-fallback";
    const symbol = document.createElement("span");
    symbol.className = "art-fallback-symbol";
    symbol.textContent = "✦";
    const label = document.createElement("span");
    label.className = "art-fallback-label";
    label.textContent = labelText;
    fallback.append(symbol, label);
    return fallback;
}

function artworkFor(card, size, level = equipmentLevel.value) {
    const element = elementArtwork.find(([label]) => (card.element || "").includes(label));
    if (!element || !card.art_subtype) return "";
    const key = `${level}:${element[1]}:${card.art_subtype}`;
    if (unavailableArtwork.has(key)) return "";
    return `images_global_card_card_image_gold_black_level${level}_${size}_${element[1]}_${card.art_subtype}.png`;
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
    categoryFilter.value = "";
    equipmentLevel.value = "9";
    skillOneFilter.value = "";
    skillTwoFilter.value = "";
    abilitySort = { key: "", direction: "asc" };
    effectFilterOptions.querySelectorAll("input").forEach((input) => { input.checked = false; });
    updateEffectFilterState();
    renderCards();
    searchInput.focus();
}

function loadDailyVisitCounter() {
    const fallback = document.querySelector("#visit-counter-fallback");
    const today = new Date();
    const dateKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    try {
        if (localStorage.getItem("sp-card-catalog-visit-date") === dateKey) {
            visitCounter.hidden = true;
            fallback.textContent = "今日已計入 1 次";
            fallback.hidden = false;
            return;
        }
    } catch {
        visitCounter.hidden = true;
        fallback.textContent = "--";
        fallback.hidden = false;
        return;
    }
    visitCounter.addEventListener("load", () => {
        try {
            localStorage.setItem("sp-card-catalog-visit-date", dateKey);
        } catch {
            return;
        }
    }, { once: true });
    const url = new URL(visitCounter.dataset.src);
    url.searchParams.set("view", "today-total");
    visitCounter.src = url.href;
}

function initializeGiscus() {
    if (!giscusComments) return;
    window.addEventListener("message", (event) => {
        if (event.origin !== "https://giscus.app" || !event.data?.giscus?.ready) return;
        syncGiscusTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    });
    if (!("IntersectionObserver" in window)) {
        loadGiscus();
        return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        loadGiscus();
        currentObserver.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(giscusComments);
}

function loadGiscus() {
    if (giscusLoaded) return;
    giscusLoaded = true;
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.repo = "lucienwooo/Survival-Project-Data";
    script.dataset.repoId = "R_kgDOVFsanQ";
    script.dataset.category = "玩家留言";
    script.dataset.categoryId = "DIC_kwDOVFsanc4DIG16";
    script.dataset.mapping = "pathname";
    script.dataset.strict = "0";
    script.dataset.reactionsEnabled = "1";
    script.dataset.emitMetadata = "0";
    script.dataset.inputPosition = "bottom";
    script.dataset.theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    script.dataset.lang = "zh-TW";
    script.dataset.loading = "lazy";
    giscusComments.append(script);
}

function syncGiscusTheme(theme) {
    const frame = giscusComments?.querySelector(".giscus-frame");
    frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, "https://giscus.app");
}

function loginAdmin(event) {
    event.preventDefault();
    const status = document.querySelector("#admin-login-status");
    if (adminPasswordInput.value !== "306478") {
        status.textContent = "管理密碼錯誤。";
        adminPasswordInput.select();
        return;
    }
    status.textContent = "";
    adminDialog.close();
    adminPasswordInput.value = "";
    enterEditMode();
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
    card.stats = Object.fromEntries(Object.entries(parsedStats.values)
        .map(([key, value]) => [key, scaleStatToLevelNine(value, equipmentLevel.value)]));
    card.special_stats = parsedSpecial.values;
    card.special_skills = parsedSpecial.custom;
    card._text_overrides = { stats: parsedStats.custom, special: linesByGroup.special };
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
        }))).find((candidate) => candidate.label === label) || effectLabelAliases[label];
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
    effectFilters.disabled = false;
    effectFilterNote.hidden = false;
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
        enhanceResourceSelect(select);
    }
}

function getSpecialSkillLabels(card) {
    const skills = parseEffectLines(getCardTextLines(card, "special")).custom;
    const options = getCardSpecialSkillOptions(card, skills);
    const selection = getCardSkillSelection(card, options);
    return [selection.one, selection.two].map((line) => {
        if (!line) return "";
        const withoutRate = line.replace(/\s*[+-]?\d+(?:\.\d+)?\s*%\s*$/, "").trim();
        return withoutRate
            .replace(/\s*\d+(?:\.\d+)?\s*秒/g, " X秒")
            .replace(/^導致\s+對方/, "導致對方")
            .trim();
    });
}

function createComparisonState() {
    return { characterId: 1, locked: false, slots: { magic: null, weapon: null, armor: null } };
}

function initializeComparisonPanel(panel, comparisonIndex) {
    panel.dataset.comparisonIndex = String(comparisonIndex);
    panel.querySelector(".character-select-button").addEventListener("click", () => toggleCharacterPicker(panel));
    panel.querySelector(".compare-lock-toggle").addEventListener("click", (event) => {
        const state = comparisonStates[comparisonIndex];
        state.locked = !state.locked;
        event.currentTarget.textContent = state.locked ? "解除鎖定" : "鎖定";
        event.currentTarget.setAttribute("aria-pressed", String(state.locked));
        panel.classList.toggle("is-locked", state.locked);
        renderCompareSet(comparisonIndex);
        renderCards();
    });
    renderCharacterOptions(comparisonIndex);
}

function addComparisonPanel() {
    if (comparisonStates.length >= 2) return;
    const comparisonIndex = comparisonStates.length;
    comparisonStates.push(createComparisonState());
    const panel = comparePanel.cloneNode(true);
    const elementsWithIds = [panel, ...panel.querySelectorAll("[id]")].filter((element) => element.id);
    const idMap = new Map(elementsWithIds.map((element) => [element.id, `${element.id}-2`]));
    for (const element of elementsWithIds) element.id = idMap.get(element.id);
    for (const element of [panel, ...panel.querySelectorAll("*")]) {
        for (const attribute of ["aria-labelledby", "aria-controls"]) {
            const value = element.getAttribute(attribute);
            if (value) element.setAttribute(attribute, value.split(/\s+/).map((id) => idMap.get(id) || id).join(" "));
        }
    }
    panel.dataset.comparisonIndex = String(comparisonIndex);
    panel.hidden = false;
    panel.classList.remove("is-locked");
    const lockToggle = panel.querySelector(".compare-lock-toggle");
    lockToggle.textContent = "鎖定";
    lockToggle.setAttribute("aria-pressed", "false");
    comparePanel.after(panel);
    initializeComparisonPanel(panel, comparisonIndex);
    selectCharacter(comparisonStates[comparisonIndex].characterId, comparisonIndex);
    renderCompareSet(comparisonIndex);
    renderCards();
    updateComparePanelActions();
}

function clearAdditionalComparisonPanel() {
    if (comparisonStates.length < 2) return;
    document.querySelector('.compare-panel[data-comparison-index="1"]')?.remove();
    comparisonStates.splice(1);
    renderCompareSlots();
    renderCards();
    updateComparePanelActions();
}

function updateComparePanelActions() {
    const isExpanded = compareToggle.getAttribute("aria-expanded") === "true";
    comparePanelActions.hidden = !isExpanded;
    addComparePanelButton.hidden = comparisonStates.length >= 2;
    clearComparePanelButton.hidden = comparisonStates.length < 2;
}

function renderCharacterOptions(comparisonIndex) {
    const panel = document.querySelector(`.compare-panel[data-comparison-index="${comparisonIndex}"]`);
    const state = comparisonStates[comparisonIndex];
    const characterOptions = panel.querySelector(".character-options");
    const fragment = document.createDocumentFragment();
    for (const character of characters) {
        const option = document.createElement("button");
        option.className = "character-option";
        option.type = "button";
        option.setAttribute("role", "menuitem");
        option.dataset.characterId = character.id;
        option.setAttribute("aria-label", character.name);
        option.setAttribute("aria-pressed", String(character.id === state.characterId));
        const portrait = document.createElement("img");
        portrait.src = new URL(`images_interface_room_char_select_ch_${character.id + 12}_btn_1_c.png`, CHARACTER_ART_URL).href;
        portrait.alt = "";
        portrait.width = 41;
        portrait.height = 104;
        option.append(portrait);
        option.addEventListener("click", () => selectCharacter(character.id, comparisonIndex));
        fragment.append(option);
    }

    characterOptions.replaceChildren(fragment);
}

function selectCharacter(characterId, comparisonIndex) {
    const character = characters.find((item) => item.id === characterId);
    if (!character) return;
    const state = comparisonStates[comparisonIndex];
    const panel = document.querySelector(`.compare-panel[data-comparison-index="${comparisonIndex}"]`);
    state.characterId = character.id;
    panel.querySelector(".selected-character-portrait").src = new URL(`images_interface_room_char_select_ch_${character.id + 12}_btn_1_c.png`, CHARACTER_ART_URL).href;
    const nameplate = panel.querySelector(".selected-character-name");
    nameplate.textContent = character.name;
    const characterSelectButton = panel.querySelector(".character-select-button");
    characterSelectButton.setAttribute("aria-label", `目前角色：${character.name}。開啟角色選擇`);
    panel.querySelectorAll(".character-option[data-character-id]").forEach((option) => {
        option.setAttribute("aria-pressed", String(Number(option.dataset.characterId) === character.id));
    });
    closeCharacterPicker(panel);
    renderCompareActivation(comparisonIndex);
}

function toggleCharacterPicker(panel) {
    const characterPickerMenu = panel.querySelector(".character-picker-menu");
    const opening = characterPickerMenu.hidden;
    characterPickerMenu.hidden = !opening;
    panel.querySelector(".character-select-button").setAttribute("aria-expanded", String(opening));
}

function closeCharacterPicker(panel) {
    if (!panel) return;
    const characterPickerMenu = panel.querySelector(".character-picker-menu");
    characterPickerMenu.hidden = true;
    panel.querySelector(".character-select-button").setAttribute("aria-expanded", "false");
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
    syncGiscusTheme(isLight ? "light" : "dark");
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
    document.querySelectorAll(".compare-panel").forEach((panel) => { panel.hidden = isExpanded; });
    updateComparePanelActions();
}

function wearCard(card) {
    const comparisonIndex = comparisonStates.findIndex((state) => !state.locked);
    if (comparisonIndex < 0) return;
    const slot = equipmentSlotForCard(card);
    comparisonStates[comparisonIndex].slots[slot] = { card, level: equipmentLevel.value, isBlack: false };
    renderCompareSlots();
    renderCards();
    if (comparePanel.hidden) toggleComparePanel();
}

function renderCompareSlots() {
    comparisonStates.forEach((_, comparisonIndex) => renderCompareSet(comparisonIndex));
}

function renderCompareSet(comparisonIndex) {
    const panel = document.querySelector(`.compare-panel[data-comparison-index="${comparisonIndex}"]`);
    const state = comparisonStates[comparisonIndex];
    if (!panel || !state) return;
    for (const [slot, selection] of Object.entries(state.slots)) {
        const content = panel.querySelector(`[data-slot="${slot}"] .compare-slot-content`);
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
        if (!state.locked) {
            makeArtworkInteractive(art, `卸下${card.name_zh || card.name_en || "裝備"}`, () => {
                state.slots[slot] = null;
                renderCompareSlots();
                renderCards();
            });
        }
        const details = document.createElement("div");
        details.className = "compare-card-details";
        const name = document.createElement("strong");
        name.textContent = card.name_zh || card.name_en;
        const level = document.createElement("span");
        level.textContent = `LV. ${selection.level}`;
        details.append(name, level);
        const removeButton = document.createElement("button");
        removeButton.className = "compare-remove";
        removeButton.type = "button";
        removeButton.textContent = "卸下";
        removeButton.disabled = state.locked;
        removeButton.addEventListener("click", () => {
            if (state.locked) return;
            state.slots[slot] = null;
            renderCompareSlots();
            renderCards();
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
            const hasNoBaseStats = !Object.keys(getStatsForLevel(card, selection.level)).length && !getCustomStatLines(card).length;
            note.textContent = hasNoBaseStats ? "一般能力資料待更新" : "能力資料僅適用第 9 級";
            content.append(note);
        }
    }
    renderCompareTotals(comparisonIndex);
    renderCompareActivation(comparisonIndex);
}

function renderCompareActivation(comparisonIndex) {
    const panel = document.querySelector(`.compare-panel[data-comparison-index="${comparisonIndex}"]`);
    const state = comparisonStates[comparisonIndex];
    if (!panel || !state) return;
    for (const slot of ["magic", "weapon", "armor"]) {
        const cell = panel.querySelector(`#compare-activation-list${comparisonIndex ? "-2" : ""} [data-slot="${slot}"]`);
        const selection = state.slots[slot];
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
        rate.textContent = `${formatPercent(calculateActivationRate(slot, selection, comparisonIndex))}%`;
        cell.replaceChildren(toggleLabel, rate);
    }
}

function calculateActivationRate(slot, selection, comparisonIndex) {
    const baseRate = { magic: 30, weapon: 50, armor: 50 }[slot];
    const levelBonus = 30 * (Number(selection.level) - 1) / 8;
    const elementBonus = selectedCharacterElement(comparisonIndex) === selection.card.element ? 10 : 0;
    const goldBonus = selection.isBlack ? 0 : 10;
    const hasFullGoldSet = Object.values(comparisonStates[comparisonIndex].slots).every((item) => item && !item.isBlack);
    const fullGoldSetBonus = hasFullGoldSet ? 10 : 0;
    return Math.min(100, baseRate + levelBonus + elementBonus + goldBonus + fullGoldSetBonus);
}

function selectedCharacterElement(comparisonIndex) {
    return characters.find((character) => character.id === comparisonStates[comparisonIndex].characterId)?.element;
}

function formatPercent(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function renderCompareTotals(comparisonIndex) {
    const panel = document.querySelector(`.compare-panel[data-comparison-index="${comparisonIndex}"]`);
    const state = comparisonStates[comparisonIndex];
    if (!panel || !state) return;
    for (const slot of ["magic", "weapon", "armor"]) {
        const cell = panel.querySelector(`#compare-total-list${comparisonIndex ? "-2" : ""} [data-slot="${slot}"]`);
        const selection = state.slots[slot];
        if (!selection) {
            cell.replaceChildren(document.createTextNode("--"));
            continue;
        }
        const totals = new Map();
        const baseStats = getStatsForLevel(selection.card, selection.level);
        const specialStats = getSelectedSpecialStats(selection.card, selection.level);
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

function getSelectedSpecialStats(card, level) {
    const parsedSpecial = parseEffectLines(getCardTextLines(card, "special"));
    const options = getCardSpecialSkillOptions(card, parsedSpecial.custom);
    const selectedSkill = getCardSkillSelection(card, options).one;
    const specialStats = { ...parsedSpecial.values };
    const s1StatKeys = new Set(options.one.flatMap((skill) => Object.keys(parseEffectLines([skill]).values)));
    for (const key of s1StatKeys) specialStats[key] = undefined;
    Object.assign(specialStats, parseEffectLines([selectedSkill]).values);
    return Object.fromEntries(Object.entries(specialStats)
        .filter(([, value]) => typeof value === "number")
        .map(([key, value]) => [key, scaleStatToLevel(value, level)]));
}

function isTextEntry(element) {
    return element instanceof HTMLInputElement
        || element instanceof HTMLTextAreaElement
        || element instanceof HTMLSelectElement
        || element.isContentEditable;
}

function initializeResourceTextColors() {
    colorizeResourceText(document.body);
    const observer = new MutationObserver((records) => {
        for (const record of records) {
            if (record.type === "characterData") {
                colorizeResourceText(record.target.parentElement);
                continue;
            }
            record.addedNodes.forEach(colorizeResourceText);
        }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
}

function colorizeResourceText(root) {
    if (!root) return;
    const textNodes = [];
    if (root.nodeType === Node.TEXT_NODE) {
        textNodes.push(root);
    } else {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) textNodes.push(walker.currentNode);
    }

    for (const textNode of textNodes) {
        const parent = textNode.parentElement;
        const text = textNode.nodeValue || "";
        if (!parent || parent.closest(".resource-token, script, style, textarea, option") || parent.isContentEditable || !/(HP|MP|BP)/.test(text)) continue;
        const matches = [...text.matchAll(/HP|MP|BP/g)];
        const fragment = document.createDocumentFragment();
        let cursor = 0;
        for (const match of matches) {
            fragment.append(document.createTextNode(text.slice(cursor, match.index)));
            const token = document.createElement("span");
            token.className = `resource-token resource-token-${match[0].toLowerCase()}`;
            token.textContent = match[0];
            fragment.append(token);
            cursor = match.index + match[0].length;
        }
        fragment.append(document.createTextNode(text.slice(cursor)));
        textNode.replaceWith(fragment);
    }
}

function appendColorizedText(container, text) {
    const matches = [...String(text).matchAll(/HP|MP|BP/g)];
    let cursor = 0;
    for (const match of matches) {
        container.append(document.createTextNode(String(text).slice(cursor, match.index)));
        const token = document.createElement("span");
        token.className = `resource-token resource-token-${match[0].toLowerCase()}`;
        token.textContent = match[0];
        container.append(token);
        cursor = match.index + match[0].length;
    }
    container.append(document.createTextNode(String(text).slice(cursor)));
}

function enhanceResourceSelect(select) {
    let control = select.closest(".resource-select-control");
    const hasResourceTerms = [...select.options].some((option) => /(HP|MP|BP)/.test(option.textContent || ""));
    if (!control && !hasResourceTerms) return;
    if (!control) {
        control = document.createElement("div");
        control.className = "resource-select-control";
        select.before(control);
        select.hidden = true;
        select.classList.add("resource-select-native");
        control.append(select);
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "resource-select-trigger";
        trigger.setAttribute("role", "combobox");
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");
        const display = document.createElement("span");
        display.className = "resource-select-value";
        const arrow = document.createElement("span");
        arrow.className = "resource-select-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "▾";
        trigger.append(display, arrow);
        const menu = document.createElement("div");
        menu.className = "resource-select-menu";
        menu.id = `resource-select-menu-${nextResourceSelectId++}`;
        menu.setAttribute("role", "listbox");
        menu.hidden = true;
        trigger.setAttribute("aria-controls", menu.id);
        control.append(trigger, menu);
        trigger.addEventListener("click", () => {
            if (control.classList.contains("is-open")) closeResourceSelect(control);
            else openResourceSelect(control);
        });
        trigger.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeResourceSelect(control);
                return;
            }
            if (!["ArrowDown", "Enter", " "].includes(event.key)) return;
            event.preventDefault();
            openResourceSelect(control);
            menu.querySelector("[role='option']")?.focus();
        });
        select.addEventListener("change", () => updateResourceSelect(control, select));
    }

    control.dataset.selectId = select.id || select.getAttribute("aria-label") || "skill-filter";
    const trigger = control.querySelector(".resource-select-trigger");
    const menu = control.querySelector(".resource-select-menu");
    trigger.disabled = select.disabled;
    trigger.setAttribute("aria-label", select.getAttribute("aria-label") || select.labels?.[0]?.textContent.trim() || "選擇能力");
    menu.replaceChildren();
    for (const option of select.options) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "resource-select-option";
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(option.value === select.value));
        appendColorizedText(item, option.textContent);
        item.addEventListener("click", () => {
            select.value = option.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            updateResourceSelect(control, select);
            closeResourceSelect(control);
            trigger.focus();
        });
        menu.append(item);
    }
    updateResourceSelect(control, select);
}

function updateResourceSelect(control, select) {
    const selectedOption = select.options[select.selectedIndex];
    const display = control.querySelector(".resource-select-value");
    if (!display || !selectedOption) return;
    display.replaceChildren();
    appendColorizedText(display, selectedOption.textContent);
    control.querySelectorAll(".resource-select-option").forEach((option, index) => {
        option.setAttribute("aria-selected", String(select.options[index]?.value === select.value));
    });
}

function openResourceSelect(control) {
    document.querySelectorAll(".resource-select-control.is-open").forEach(closeResourceSelect);
    control.classList.add("is-open");
    control.querySelector(".resource-select-trigger").setAttribute("aria-expanded", "true");
    control.querySelector(".resource-select-menu").hidden = false;
}

function closeResourceSelect(control) {
    control.classList.remove("is-open");
    control.querySelector(".resource-select-trigger").setAttribute("aria-expanded", "false");
    control.querySelector(".resource-select-menu").hidden = true;
}