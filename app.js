// 1989/06/04
import { createKB2Input, KB2_BUTTON } from "./character-preview-controls.js?v=1";

const DATA_URL = new URL("https://lucienwooo.github.io/Survival-Project-Data/data/cards.json", import.meta.url);
const LOCAL_BACKUP_DATA_URL = new URL("./data/cards.local-backup.json", import.meta.url);
const ART_BASE_URL = new URL("./images/global_card_images/", import.meta.url);
const CHARACTER_ART_URL = new URL("./images/characters/", import.meta.url);
const CARD_HKD_PRICE_PER_10K = { water: 35, fire: 35, earth: 20, wind: 15 };
const DINGDANG_PRICE = 25;
const DINGDANG_UNIT = 10000000;
const MAGIC_DAMAGE_BASE = 92;
const SUPPORT_CONFIG = {
    paypalCheckoutUrl: "https://www.paypal.com/ncp/payment/EZ3B823665D82",
    currency: "TWD",
    currencySymbol: "NT$",
    minAmount: 50,
    presetAmounts: [50, 100],
    defaultAmount: 50
};
const EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/TWD";
const EXCHANGE_RATE_CACHE_KEY = "sp-card-exchange-rates-twd";
const FALLBACK_EXCHANGE_RATES = { TWD: 1, HKD: 0.244163, CNY: 0.2094 };
const CURRENCIES = {
    TWD: { label: "台幣", symbol: "NT$" },
    HKD: { label: "港幣", symbol: "HK$" },
    CNY: { label: "人民幣", symbol: "¥" }
};
let exchangeRates = { ...FALLBACK_EXCHANGE_RATES };
let exchangeRateUpdatedAt = "";
let characterStatMaximumsCache = null;
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
const cardSkillSelections = new Map();
const characters = [
    { name: "Xyrho", element: "火", hp: 480, mp: 441, bp: 583, melee: [25, 28], ranged: [11, 12], meleeSpeed: 1.37, rangedSpeed: 2.47, turnSpeed: 4, maxSpeed: 3, acceleration: 2 },
    { name: "Shamoo", element: "火", hp: 432, mp: 717, bp: 518, melee: [25, 28], ranged: [27, 29], meleeSpeed: 1.5, rangedSpeed: 1.34, turnSpeed: 3, maxSpeed: 5, acceleration: 3 },
    { name: "Sven", element: "水", hp: 552, mp: 414, bp: 574, melee: [36, 40], ranged: [12, 13], meleeSpeed: 1.25, rangedSpeed: 1.49, turnSpeed: 2, maxSpeed: 1, acceleration: 1 },
    { name: "Cream", element: "水", hp: 456, mp: 552, bp: 453, melee: [24, 26], ranged: [24, 27], meleeSpeed: 1.25, rangedSpeed: 1.56, turnSpeed: 3, maxSpeed: 4, acceleration: 3 },
    { name: "Roland", element: "土", hp: 480, mp: 524, bp: 540, melee: [22, 24], ranged: [12, 12], meleeSpeed: 1.28, rangedSpeed: 1.46, turnSpeed: 1, maxSpeed: 2, acceleration: 2 },
    { name: "Aurelli", element: "風", hp: 456, mp: 414, bp: 496, melee: [22, 24], ranged: [17, 19], meleeSpeed: 2, rangedSpeed: 1.9, turnSpeed: 4, maxSpeed: 3, acceleration: 4 },
    { name: "Hawk", element: "風", hp: 504, mp: 414, bp: 540, melee: [20, 22], meleeHits: 2, ranged: [20, 22], meleeSpeed: 1.39, rangedSpeed: 2.02, turnSpeed: 3, maxSpeed: 3, acceleration: 2 },
    { name: "Hazel", element: "土", hp: 432, mp: 524, bp: 626, melee: [20, 22], ranged: [14, 16], meleeSpeed: 1.23, rangedSpeed: 2.67, turnSpeed: 3, maxSpeed: 4, acceleration: 4.5 },
    { name: "Cara", element: "火", hp: 408, mp: 386, bp: 432, melee: [30, 32], meleeRange: true, ranged: [6, 7], rangedRange: true, meleeSpeed: 1.37, rangedSpeed: 1.57, turnSpeed: 5, maxSpeed: 1, acceleration: 5 },
    { name: "Warren", element: "土", hp: 564, mp: 483, bp: 432, melee: [40, 43], ranged: [8, 9], meleeSpeed: 1.32, rangedSpeed: 2.48, turnSpeed: 1, maxSpeed: 2, acceleration: 1 },
    { name: "Lucy", element: "水", hp: 456, mp: 496, bp: 432, melee: [26, 28], ranged: [23, 25], meleeSpeed: 1.47, rangedSpeed: 1.57, turnSpeed: 3, maxSpeed: 2, acceleration: 4 },
    { name: "Will", element: "風", hp: 396, mp: 601, bp: 561, melee: [32, 35], ranged: [12, 15], meleeSpeed: 1.31, rangedSpeed: 2.43, turnSpeed: 2, maxSpeed: 3, acceleration: 3 }
].map((character, index) => ({ ...character, id: index + 1 }));
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
const simulatorToggle = document.querySelector("#toggle-enhancement-simulator");
const simulatorPanel = document.querySelector("#enhancement-simulator-panel");
const currencyToggle = document.querySelector("#toggle-currency");
const currencyPanel = document.querySelector("#currency-panel");
const catalogView = document.querySelector("#catalog-view");
const exchangeRateStatus = document.querySelector("#exchange-rate-status");
const equipmentPickerDialog = document.querySelector("#equipment-picker-dialog");
const equipmentPickerGrid = equipmentPickerDialog.querySelector(".equipment-picker-grid");
const equipmentPickerTitle = document.querySelector("#equipment-picker-dialog-title");
let equipmentPickerAnchor = null;
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
compareToggle.addEventListener("click", handleCompareToggle);
simulatorToggle.addEventListener("click", () => {
    const showSimulator = simulatorPanel.hidden;
    simulatorPanel.hidden = !showSimulator;
    simulatorToggle.setAttribute("aria-expanded", String(showSimulator));
});
currencyToggle.addEventListener("click", toggleCurrencyView);
document.querySelectorAll("[data-currency-input]").forEach((input) => input.addEventListener("input", updateCurrencyCalculator));
// 1989/06/04
document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("click", (event) => {
    document.querySelectorAll(".character-picker-menu:not([hidden])").forEach((menu) => {
        const picker = menu.closest(".character-picker");
        if (!picker.contains(event.target)) closeCharacterPicker(menu.closest(".compare-panel"));
    });
    document.querySelectorAll(".resource-select-control.is-open").forEach((control) => {
        if (!control.contains(event.target)) closeResourceSelect(control);
    });
    if (equipmentPickerDialog.open
        && !equipmentPickerDialog.contains(event.target)
        && !equipmentPickerAnchor?.contains(event.target)) closeEquipmentPicker();
});
document.querySelector("#close-equipment-picker").addEventListener("click", closeEquipmentPicker);
window.addEventListener("resize", repositionOpenEquipmentPicker);
window.addEventListener("scroll", repositionOpenEquipmentPicker, true);
addComparePanelButton.addEventListener("click", addComparisonPanel);
clearComparePanelButton.addEventListener("click", clearAdditionalComparisonPanel);
themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    setTheme(nextTheme, true);
});
const sponsorDialog = document.querySelector("#sponsor-dialog");
const supportAmountOptions = document.querySelector("#support-amount-options");
const supportCustomButton = document.querySelector("#support-custom-button");
const supportCustomField = document.querySelector("#support-custom-field");
const supportCustomInput = document.querySelector("#support-custom-amount");
const supportSelectedAmount = document.querySelector("#support-selected-amount");
const supportStatus = document.querySelector("#support-status");
const supportPaypalLink = document.querySelector("#support-paypal-link");
document.querySelector("#open-sponsor").addEventListener("click", () => sponsorDialog.showModal());
document.querySelector("#close-sponsor").addEventListener("click", () => sponsorDialog.close());
initializeSupportPayment();
const visitCounter = document.querySelector("#visit-counter");
const visitCounterFallback = document.querySelector("#visit-counter-fallback");
visitCounter.addEventListener("error", () => {
    visitCounter.hidden = true;
    visitCounterFallback.textContent = "造訪統計暫不可用";
    visitCounterFallback.hidden = false;
}, { once: true });
visitCounter.addEventListener("load", () => { visitCounterFallback.hidden = true; }, { once: true });
loadVisitCounter();
searchInput.addEventListener("input", renderCards);
elementFilter.addEventListener("change", renderCards);
categoryFilter.addEventListener("change", renderCards);
skillOneFilter.addEventListener("change", renderCards);
skillTwoFilter.addEventListener("change", renderCards);
equipmentLevel.addEventListener("change", () => {
    updateEffectFilterState();
    renderCards();
    renderCompareSlots();
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
renderCompareSlots();
setTheme(getSavedTheme());
selectCharacter(1, 0);
initializeEnhancementCharacterPreview();
updateComparePanelActions();
updateEffectFilterState();
initializeResourceTextColors();
updateCurrencyCalculator();
loadExchangeRates();

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (equipmentPickerDialog.open) closeEquipmentPicker();
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

function initializeSupportPayment() {
    const presetButtons = SUPPORT_CONFIG.presetAmounts.map((amount) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "support-amount-btn";
        button.textContent = `${SUPPORT_CONFIG.currencySymbol}${amount}`;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => selectSupportAmount(button));
        supportAmountOptions.insertBefore(button, supportCustomButton);
        return button;
    });
    let selectedPreset = null;
    let useCustomAmount = false;

    function selectSupportAmount(button, custom = false) {
        selectedPreset = custom ? null : button;
        useCustomAmount = custom;
        [...presetButtons, supportCustomButton].forEach((option) => {
            option.setAttribute("aria-pressed", String(option === button));
        });
        supportCustomField.hidden = !custom;
        supportCustomInput.setAttribute("aria-required", String(custom));
        if (custom) supportCustomInput.focus();
        updateSupportPaymentState();
    }

    function updateSupportPaymentState(showInputError = false) {
        let amount = selectedPreset
            ? SUPPORT_CONFIG.presetAmounts[presetButtons.indexOf(selectedPreset)]
            : null;
        let amountError = "";

        if (useCustomAmount) {
            const rawAmount = supportCustomInput.value.trim();
            if (!rawAmount) {
                amountError = showInputError ? "請輸入贊助金額" : "";
            } else if (!/^-?\d+$/.test(rawAmount)) {
                amountError = `請輸入整數金額（最低 ${SUPPORT_CONFIG.currencySymbol}${SUPPORT_CONFIG.minAmount}）`;
            } else {
                amount = Number(rawAmount);
                if (!Number.isSafeInteger(amount) || amount < SUPPORT_CONFIG.minAmount) {
                    amountError = `最低贊助金額為 ${SUPPORT_CONFIG.currencySymbol}${SUPPORT_CONFIG.minAmount}`;
                }
            }
            supportSelectedAmount.textContent = Number.isSafeInteger(amount)
                ? `贊助金額：${SUPPORT_CONFIG.currencySymbol}${amount.toLocaleString("zh-TW")}`
                : "贊助金額：尚未輸入";
        } else {
            supportSelectedAmount.textContent = `贊助金額：${SUPPORT_CONFIG.currencySymbol}${amount.toLocaleString("zh-TW")}`;
        }

        let paypalCheckoutUrl = "";
        try {
            const parsedCheckoutUrl = new URL(SUPPORT_CONFIG.paypalCheckoutUrl);
            if (parsedCheckoutUrl.origin === "https://www.paypal.com"
                && /^\/ncp\/payment\/[a-zA-Z0-9]+$/.test(parsedCheckoutUrl.pathname)
                && !parsedCheckoutUrl.search
                && !parsedCheckoutUrl.hash) {
                paypalCheckoutUrl = parsedCheckoutUrl.href;
            }
        } catch {
            paypalCheckoutUrl = "";
        }
        const configurationError = paypalCheckoutUrl
            ? ""
            : "請在 app.js 的 SUPPORT_CONFIG 設定有效的 PayPal 官方付款連結。";
        const canDonate = Number.isSafeInteger(amount)
            && amount >= SUPPORT_CONFIG.minAmount
            && Boolean(paypalCheckoutUrl);

        supportStatus.textContent = amountError || configurationError;
        supportPaypalLink.setAttribute("aria-disabled", String(!canDonate));
        supportPaypalLink.classList.toggle("is-disabled", !canDonate);
        supportPaypalLink.href = canDonate
            ? paypalCheckoutUrl
            : "#";
    }

    const defaultButton = presetButtons[SUPPORT_CONFIG.presetAmounts.indexOf(SUPPORT_CONFIG.defaultAmount)];
    if (defaultButton) selectSupportAmount(defaultButton);
    supportCustomButton.addEventListener("click", () => selectSupportAmount(supportCustomButton, true));
    supportCustomInput.addEventListener("beforeinput", (event) => {
        if (event.inputType.startsWith("insert") && event.data && /\D/.test(event.data)) {
            event.preventDefault();
        }
    });
    supportCustomInput.addEventListener("paste", (event) => {
        const pastedText = event.clipboardData.getData("text");
        if (!/^\d+$/.test(pastedText)) event.preventDefault();
    });
    supportCustomInput.addEventListener("input", () => updateSupportPaymentState(true));
    supportPaypalLink.addEventListener("click", (event) => {
        if (supportPaypalLink.getAttribute("aria-disabled") === "true") {
            event.preventDefault();
            updateSupportPaymentState(true);
        }
    });
}

async function loadCatalog() {
    try {
        let catalog;
        let usingLocalBackup = false;
        try {
            const response = await fetch(DATA_URL, { cache: "no-cache" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            catalog = await response.json();
        } catch (error) {
            console.warn("Unable to load the published catalog; trying the local backup.", error);
            const backupResponse = await fetch(LOCAL_BACKUP_DATA_URL, { cache: "no-cache" });
            if (!backupResponse.ok) throw new Error(`Local backup returned HTTP ${backupResponse.status}`);
            catalog = await backupResponse.json();
            usingLocalBackup = true;
        }
        cards = Object.values(catalog).filter((card) => card && card.id !== undefined && card.art_subtype);
        applySavedCardEdits();
        cards.sort((first, second) => Number(first.id) - Number(second.id));
        characterStatMaximumsCache = null;
        elementFilter.value = "";

        document.querySelector("#stat-total").textContent = cards.length;
        renderSpecialSkillFilters();
        if (usingLocalBackup) {
            loadStatus.textContent = "正式資料暫時無法取得，顯示本機備份資料。";
            loadStatus.hidden = false;
        } else {
            loadStatus.hidden = true;
        }
        renderCards();
        renderCompareSlots();
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

function characterPortraitArtwork(character) {
    const portraitId = character.id + 12;
    return `images_interface_room_char_select_ch_${portraitId}_btn_1_c.png`;
}

function characterStatsPortraitArtwork(character) {
    return `images_interface_channel_mychar_wnd_cim_${character.id}.png`;
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

function loadVisitCounter() {
    visitCounter.src = visitCounter.dataset.src;
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
    characterStatMaximumsCache = null;
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
        characterStatMaximumsCache = null;
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
    return {
        characterId: 1,
        normalCharacter: false,
        goblinDamageType: "melee",
        beginnerGoblinHp: 120,
        heroGoblinHp: 155,
        locked: false,
        equipmentApplied: { magic: false, weapon: false, armor: false },
        slots: { magic: null, weapon: null, armor: null }
    };
}

function initializeComparisonPanel(panel, comparisonIndex) {
    panel.dataset.comparisonIndex = String(comparisonIndex);
    panel.querySelector(".character-select-button").addEventListener("click", () => toggleCharacterPicker(panel));
    panel.querySelector(".character-normal-toggle").addEventListener("change", (event) => {
        comparisonStates[comparisonIndex].normalCharacter = event.currentTarget.checked;
        renderCharacterOptions(comparisonIndex);
        renderCharacterPanel(comparisonIndex);
    });
    panel.querySelectorAll(".character-equipment-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const state = comparisonStates[comparisonIndex];
            const slot = button.dataset.slot;
            if (!state.slots[slot]) return;
            state.equipmentApplied[slot] = !state.equipmentApplied[slot];
            renderCharacterPanel(comparisonIndex);
        });
    });
    panel.querySelectorAll(".goblin-hp-input").forEach((input) => {
        input.addEventListener("input", (event) => {
            const value = Number(event.currentTarget.value);
            const goblinType = event.currentTarget.dataset.goblinType;
            comparisonStates[comparisonIndex][`${goblinType}GoblinHp`] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
            renderGoblinSummary(comparisonIndex);
        });
    });
    panel.querySelector(".goblin-damage-mode-toggle").addEventListener("click", () => {
        const state = comparisonStates[comparisonIndex];
        state.goblinDamageType = state.goblinDamageType === "ranged" ? "melee" : "ranged";
        renderGoblinSummary(comparisonIndex);
    });
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
        portrait.src = new URL(characterPortraitArtwork(character, state.normalCharacter), CHARACTER_ART_URL).href;
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
    panel.querySelector(".selected-character-portrait").src = new URL(characterPortraitArtwork(character, state.normalCharacter), CHARACTER_ART_URL).href;
    const nameplate = panel.querySelector(".selected-character-name");
    nameplate.textContent = character.name;
    const characterSelectButton = panel.querySelector(".character-select-button");
    characterSelectButton.setAttribute("aria-label", `目前角色：${character.name}。開啟角色選擇`);
    panel.querySelectorAll(".character-option[data-character-id]").forEach((option) => {
        option.setAttribute("aria-pressed", String(Number(option.dataset.characterId) === character.id));
    });
    closeCharacterPicker(panel);
    renderCompareActivation(comparisonIndex);
    renderCharacterPanel(comparisonIndex);
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

async function initializeEnhancementCharacterPreview() {
    const panel = document.querySelector("#enhancement-simulator-panel");
    const canvas = document.querySelector("#enhancement-character-preview");
    const status = document.querySelector("#enhancement-character-preview-status");
    const roster = document.querySelector("#character-preview-roster");
    const rosterCount = document.querySelector("#character-preview-roster-count");
    const alternateColorToggle = document.querySelector("#character-preview-alternate-toggle");
    if (!panel || !canvas || !status || !roster || !rosterCount || !alternateColorToggle) {
        console.error("Unable to initialize the character preview: required elements are missing.");
        return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
        status.textContent = "無法建立角色預覽畫布";
        console.error("Unable to create the character preview canvas context.");
        return;
    }

    const directionLabels = {
        right: "右",
        upRight: "右上",
        up: "上",
        upLeft: "左上",
        left: "左",
        downLeft: "左下",
        down: "下",
        downRight: "右下"
    };
    const directionOrder = ["right", "upRight", "up", "upLeft", "left", "downLeft", "down", "downRight"];
    const facingStep = 2 * Math.PI / directionOrder.length;
    // Rates are local preview tuning until there is an original movement trace.
    const accelerationRate = 12;
    const dragRate = 6;
    const kb2Input = createKB2Input();
    const thumbnailButtons = new Map();
    const assetVersion = "70";
    // The atlas has poses only, so the preview shows them before the full attack interval ends.
    const attackAnimationRatio = 0.30;
    let sprites = [];
    let baseSprites = [];
    let spritesById = new Map();
    let activeSprite = null;
    let activeSheet = null;
    let selectedBaseSprite = null;
    let alternateColorEnabled = false;
    let activeScale = 1;
    let movementBounds;
    let previewAction = "idle";
    let heading = Math.PI / 2;
    let previewActionStartedAt = 0;
    let previewActionDuration = 0;
    let attackReadyAt = 0;
    let currentPosition = { x: canvas.width / 2, y: canvas.height * 0.72 };
    const velocity = { x: 0, y: 0 };
    let animationFrameId = null;
    let previousTimestamp = 0;
    let selectionRequest = 0;

    const toggleButton = document.querySelector("#toggle-enhancement-simulator");
    if (!toggleButton) {
        console.error("Unable to focus the character preview: toggle button is missing.");
        return;
    }
    toggleButton.addEventListener("click", () => {
        if (!panel.hidden) canvas.focus();
    });

    const previewCharacter = () => {
        const match = /^character(\d+)(?:_1)?$/.exec(activeSprite?.id ?? "");
        const atlasNumber = Number(match?.[1]);
        // The catalog pairs characters 1–12 with their premium forms 13–24.
        if (atlasNumber >= 1 && atlasNumber <= characters.length * 2) {
            return characters[(atlasNumber - 1) % characters.length];
        }
        return characters.find((item) => item.id === comparisonStates[0].characterId) || characters[0];
    };

    const updateStatus = (action, direction) => {
        if (!activeSprite) return;
        const labels = { idle: "待機中", walk: "移動中", run: "奔跑中", backoff: "後退中",
                         attackMelee: "近戰", attackRanged: "遠程", defense: "防禦" };
        const note = activeSprite.actions ? "" : "｜動作順序待核對";
        const nextStatus = `${activeSprite.label}｜${labels[action]}｜朝${directionLabels[direction]}${note}`;
        if (status.textContent !== nextStatus) status.textContent = nextStatus;
    };

    const clearPressedInputs = () => {
        kb2Input.clear();
        velocity.x = 0;
        velocity.y = 0;
    };

    const loadImage = (source) => new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image), { once: true });
        image.addEventListener("error", () => reject(new Error(`Unable to load image ${source}.`)), { once: true });
        const url = new URL(source, import.meta.url);
        url.searchParams.set("v", assetVersion);
        image.src = url.href;
    });

    const loadSpriteSheet = async (sprite) => {
        const image = await loadImage(sprite.src);
        if (image.naturalWidth !== sprite.width || image.naturalHeight !== sprite.height) {
            throw new Error(`Unexpected sprite sheet dimensions for ${sprite.id}.`);
        }

        return image;
    };

    const drawThumbnail = (button, sprite, sheet) => {
        const thumbnail = button.querySelector("canvas");
        const thumbnailContext = thumbnail.getContext("2d");
        if (!thumbnailContext) throw new Error(`Unable to create a thumbnail for ${sprite.id}.`);
        const [sourceX, sourceY, sourceWidth, sourceHeight] = sprite.thumbnail;
        thumbnailContext.imageSmoothingEnabled = false;
        thumbnailContext.drawImage(
            sheet,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            thumbnail.width,
            thumbnail.height
        );
    };

    const renderFrame = (timestamp) => {
        animationFrameId = null;
        if (panel.hidden || !activeSprite || !activeSheet) return;

        const delta = previousTimestamp ? Math.min((timestamp - previousTimestamp) / 1000, 0.05) : 0;
        previousTimestamp = timestamp;
        const input = kb2Input.takeFrame();
        const turnBonus = getAppliedCharacterStatBonus("turn_speed", 0, (slot) => slot === "armor");
        const turnInterval = Math.max(35, 210 / Math.max(0.2, previewCharacter().turnSpeed * (1 + turnBonus / 100)));
        heading = (heading + input.x * facingStep * delta * 1000 / turnInterval) % (2 * Math.PI);
        const facingIndex = (Math.round(-heading / facingStep) + directionOrder.length) % directionOrder.length;
        const direction = directionOrder[facingIndex];
        if (previewAction !== "idle" && timestamp >= previewActionStartedAt + previewActionDuration) {
            previewAction = "idle";
        }
        if (input.buttons & KB2_BUTTON.block) startAction("defense", timestamp);
        if (input.buttons & KB2_BUTTON.melee) startAction("attackMelee", timestamp);
        if (input.buttons & KB2_BUTTON.ranged) startAction("attackRanged", timestamp);

        const guarding = previewAction === "defense";
        const forward = !guarding && (input.y < 0 || input.run);
        const reverse = !guarding && !forward && input.blockHeld;
        const running = forward && input.run;
        const moving = forward || reverse;
        const movementBonus = moving ? getAppliedCharacterStatBonus("max_speed", 0, (slot) => slot === "armor") : 0;
        const speed = 150 * Math.max(0.2, 1 + movementBonus / 100);
        const targetSpeed = running ? speed * 1.5 : forward ? speed : reverse ? -speed : 0;
        const response = 1 - Math.exp(-(moving ? accelerationRate : dragRate) * delta);
        velocity.x += (Math.cos(heading) * targetSpeed - velocity.x) * response;
        velocity.y += (Math.sin(heading) * targetSpeed - velocity.y) * response;
        currentPosition.x += velocity.x * delta;
        currentPosition.y += velocity.y * delta;

        const movementAction = reverse ? "backoff" : running ? "run" : "walk";
        const actionName = moving && previewAction === "idle" ? movementAction : previewAction;
        // Keep the neutral pose for guard until its original frames are verified.
        const visualAction = guarding ? "idle" : actionName === "backoff" ? "walk" : actionName;
        const actionFrames = activeSprite.actions?.[visualAction]?.[direction]
            || spritesManifest.actions[visualAction]?.[direction]
            || activeSprite.actions?.idle?.[direction]
            || spritesManifest.actions.idle[direction];
        const oneShotAction = actionName === "attackMelee" || actionName === "attackRanged";
        const animationClock = oneShotAction ? Math.max(0, timestamp - previewActionStartedAt) : timestamp;
        const frameRate = actionName === "idle" ? spritesManifest.idleFps : spritesManifest.walkFps;
        const rawFrameIndex = Math.floor(oneShotAction
            ? animationClock * actionFrames.length / previewActionDuration
            : animationClock * frameRate / 1000);
        const animationIndex = oneShotAction
            ? Math.min(actionFrames.length - 1, rawFrameIndex)
            : guarding ? 0 : rawFrameIndex % actionFrames.length;
        const frame = activeSprite.frames[actionFrames[animationIndex]];
        const [sourceX, sourceY, sourceWidth, sourceHeight, anchorX, anchorY] = frame;
        const scale = activeScale;
        const x = Math.min(movementBounds.maxX, Math.max(movementBounds.minX, currentPosition.x));
        const y = Math.min(movementBounds.maxY, Math.max(movementBounds.minY, currentPosition.y));
        if (x !== currentPosition.x) velocity.x = 0;
        if (y !== currentPosition.y) velocity.y = 0;
        currentPosition = { x, y };

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = false;
        context.drawImage(
            activeSheet,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            Math.round(currentPosition.x - anchorX * scale),
            Math.round(currentPosition.y - anchorY * scale),
            Math.round(sourceWidth * scale),
            Math.round(sourceHeight * scale)
        );
        updateStatus(actionName, direction);
        animationFrameId = requestAnimationFrame(renderFrame);
    };

    const syncAnimation = () => {
        if (panel.hidden) {
            if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            previousTimestamp = 0;
            clearPressedInputs();
            return;
        }
        if (!activeSheet || animationFrameId !== null) return;
        previousTimestamp = 0;
        animationFrameId = requestAnimationFrame(renderFrame);
    };

    const selectSprite = async (sprite, button) => {
        const requestId = ++selectionRequest;
        clearPressedInputs();
        roster.querySelectorAll(".character-preview-option").forEach((option) => {
            option.setAttribute("aria-pressed", String(option === button));
        });
        activeSprite = null;
        activeSheet = null;
        context.clearRect(0, 0, canvas.width, canvas.height);
        status.textContent = `讀取${sprite.label}圖集中...`;
        try {
            const sheet = await loadSpriteSheet(sprite);
            if (requestId !== selectionRequest) return;
            activeSprite = sprite;
            activeSheet = sheet;
            attackReadyAt = 0;
            const left = Math.max(...sprite.frames.map((frame) => frame[4]));
            const right = Math.max(...sprite.frames.map((frame) => frame[2] - frame[4]));
            const top = Math.max(...sprite.frames.map((frame) => frame[5]));
            const bottom = Math.max(...sprite.frames.map((frame) => frame[3] - frame[5]));
            activeScale = Math.min(1.7, canvas.height * 0.62 / (top + bottom), canvas.width * 0.5 / (left + right));
            movementBounds = {
                minX: left * activeScale + 8, maxX: canvas.width - right * activeScale - 8,
                minY: top * activeScale + 8, maxY: canvas.height - bottom * activeScale - 8
            };
            previewAction = "idle";
            heading = Math.PI / 2;
            currentPosition = {
                x: (movementBounds.minX + movementBounds.maxX) / 2,
                y: (movementBounds.minY + movementBounds.maxY) / 2
            };
            canvas.focus({ preventScroll: true });
            syncAnimation();
        } catch (error) {
            if (requestId !== selectionRequest) return;
            status.textContent = `${sprite.label}圖集載入失敗`;
            console.error("Unable to load a character for the preview.", error);
        }
    };

    const selectBaseSprite = (sprite) => {
        selectedBaseSprite = sprite;
        const alternateSprite = spritesById.get(`${sprite.id}_1`);
        if (!alternateSprite) alternateColorEnabled = false;
        alternateColorToggle.disabled = !alternateSprite;
        alternateColorToggle.setAttribute("aria-pressed", String(Boolean(alternateSprite && alternateColorEnabled)));
        void selectSprite(
            alternateSprite && alternateColorEnabled ? alternateSprite : sprite,
            thumbnailButtons.get(sprite.id)
        );
    };

    alternateColorToggle.addEventListener("click", () => {
        if (!selectedBaseSprite) return;
        const alternateSprite = spritesById.get(`${selectedBaseSprite.id}_1`);
        if (!alternateSprite) return;
        alternateColorEnabled = !alternateColorEnabled;
        alternateColorToggle.setAttribute("aria-pressed", String(alternateColorEnabled));
        void selectSprite(
            alternateColorEnabled ? alternateSprite : selectedBaseSprite,
            thumbnailButtons.get(selectedBaseSprite.id)
        );
    });

    const startAction = (action, timestamp) => {
        if (action !== "defense" && !activeSprite.actions?.[action]) return;
        if (previewAction !== "idle" && timestamp < previewActionStartedAt + previewActionDuration) return;
        if (action !== "defense" && timestamp < attackReadyAt) return;
        previewAction = action;
        previewActionStartedAt = timestamp;
        if (action === "defense") {
            previewActionDuration = 700 * Math.max(0.2, 1 + getAppliedCharacterStatBonus("defense_time", 0) / 100);
        } else {
            const type = action === "attackRanged" ? "ranged" : "melee";
            const interval = calculateCharacterAttackInterval(previewCharacter(), type, 0) * 1000;
            previewActionDuration = interval * attackAnimationRatio;
            attackReadyAt = timestamp + interval;
        }
    };

    document.addEventListener("keydown", (event) => {
        if (!panel.hidden && document.activeElement === canvas && kb2Input.keyDown(event.code)) {
            event.preventDefault();
        }
    });
    document.addEventListener("keyup", (event) => {
        if (kb2Input.keyUp(event.code)) event.preventDefault();
    });
    canvas.addEventListener("blur", clearPressedInputs);
    window.addEventListener("blur", clearPressedInputs);

    canvas.addEventListener("pointerdown", () => canvas.focus({ preventScroll: true }));
    const panelObserver = new MutationObserver(syncAnimation);
    panelObserver.observe(panel, { attributes: true, attributeFilter: ["hidden"] });

    let spritesManifest;
    const isValidActionMap = (actionMap, frameCount, exactLength) => (
        actionMap
        && spritesManifest.directions.every((direction) => {
            const frames = actionMap[direction];
            return Array.isArray(frames)
                && (exactLength === null
                    ? frames.length > 0 && frames.length <= 32
                    : frames.length === exactLength)
                && frames.every((frameIndex) => (
                    Number.isInteger(frameIndex)
                    && frameIndex >= 0
                    && frameIndex < frameCount
                ));
        })
    );
    try {
        const response = await fetch(new URL(`./data/character-preview-sprites.json?v=${assetVersion}`, import.meta.url));
        if (!response.ok) throw new Error(`Character sprite manifest request failed: ${response.status}`);
        spritesManifest = await response.json();
        if (
            !Array.isArray(spritesManifest.sprites)
            || !Array.isArray(spritesManifest.directions)
            || spritesManifest.directions.length !== 8
            || spritesManifest.framesPerDirection !== 4
            || !spritesManifest.actions
            || !spritesManifest.thumbnailSheet
            || !Number.isInteger(spritesManifest.thumbnailWidth)
            || !Number.isInteger(spritesManifest.thumbnailHeight)
            || ["idle", "walk", "run"].some((action) => (
                !isValidActionMap(spritesManifest.actions[action], action === "run" ? 80 : 56, spritesManifest.framesPerDirection)
            ))
            || spritesManifest.sprites.some((sprite) => (
                !Array.isArray(sprite.frames)
                || sprite.frames.length < 56
                || sprite.frames.some((frame) => (
                    !Array.isArray(frame)
                    || frame.length !== 6
                    || frame.some((value) => !Number.isFinite(value))
                    || !Number.isInteger(frame[0])
                    || !Number.isInteger(frame[1])
                    || !Number.isInteger(frame[2])
                    || !Number.isInteger(frame[3])
                    || frame[0] < 0
                    || frame[1] < 0
                    || frame[2] <= 0
                    || frame[3] <= 0
                    || frame[0] + frame[2] > sprite.width
                    || frame[1] + frame[3] > sprite.height
                    || frame[4] < 0
                    || frame[4] > frame[2]
                    || frame[5] < 0
                    || frame[5] > frame[3]
                ))
                || (sprite.actions && (
                    Object.keys(sprite.actions).some((action) => !["idle", "walk", "attackMelee", "attackRanged", "defense"].includes(action))
                    || Object.entries(sprite.actions).some(([action, actionMap]) => (
                        !isValidActionMap(actionMap, sprite.frames.length, null)
                    ))
                ))
                || !Array.isArray(sprite.thumbnail)
                || sprite.thumbnail.length !== 4
            ))
        ) {
            throw new Error("Character sprite manifest has an invalid frame layout.");
        }
        sprites = spritesManifest.sprites;
        spritesById = new Map(sprites.map((sprite) => [sprite.id, sprite]));
        baseSprites = sprites.filter((sprite) => !sprite.shadowOnly && !sprite.id.endsWith("_1"));
    } catch (error) {
        status.textContent = "角色圖集名單載入失敗";
        console.error("Unable to load the character sprite manifest.", error);
        return;
    }

    let thumbnailSheet = null;
    try {
        thumbnailSheet = await loadImage(spritesManifest.thumbnailSheet);
        if (
            thumbnailSheet.naturalWidth !== spritesManifest.thumbnailWidth
            || thumbnailSheet.naturalHeight !== spritesManifest.thumbnailHeight
        ) {
            throw new Error("Character thumbnail sheet dimensions do not match the manifest.");
        }
    } catch (error) {
        console.error("Unable to load the character thumbnail sheet.", error);
    }

    const fragment = document.createDocumentFragment();
    baseSprites.forEach((sprite) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "character-preview-option";
        button.setAttribute("aria-pressed", "false");
        button.dataset.spriteId = sprite.id;
        button.setAttribute("aria-label", sprite.label);
        const thumbnail = document.createElement("canvas");
        thumbnail.width = 64;
        thumbnail.height = 80;
        thumbnail.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.textContent = sprite.label;
        button.append(thumbnail, label);
        button.addEventListener("click", () => selectBaseSprite(sprite));
        thumbnailButtons.set(sprite.id, button);
        fragment.append(button);
    });
    roster.append(fragment);
    rosterCount.textContent = thumbnailSheet
        ? `${baseSprites.length} 個角色`
        : `${baseSprites.length} 個角色；縮圖載入失敗`;
    if (thumbnailSheet) {
        baseSprites.forEach((sprite) => drawThumbnail(thumbnailButtons.get(sprite.id), sprite, thumbnailSheet));
    }

    const defaultSprite = baseSprites.find((sprite) => sprite.id === "character18") || baseSprites[0];
    if (!defaultSprite) {
        status.textContent = "沒有可顯示的角色圖集";
        console.error("The character sprite manifest contains no sprite sheets.");
        return;
    }
    selectBaseSprite(defaultSprite);
}

function handleCompareToggle() {
    if (!currencyPanel.hidden) {
        currencyPanel.hidden = true;
        catalogView.hidden = false;
        currencyToggle.setAttribute("aria-pressed", "false");
        return;
    }
    toggleComparePanel();
}

function toggleCurrencyView() {
    const showCurrency = currencyPanel.hidden;
    currencyPanel.hidden = !showCurrency;
    catalogView.hidden = showCurrency;
    currencyToggle.setAttribute("aria-pressed", String(showCurrency));
}

function calculateCardValue(quantity, card, targetCurrency) {
    const valueInHkd = quantity * CARD_HKD_PRICE_PER_10K[card] / 10000;
    return valueInHkd * exchangeRates[targetCurrency] / exchangeRates.HKD;
}

function renderCurrencyValues(cardElement, valuesByCurrency, baseCurrency) {
    const orderedCurrencies = [baseCurrency, ...Object.keys(CURRENCIES).filter((currency) => currency !== baseCurrency)];
    cardElement.querySelector("[data-currency-primary]").textContent = formatCurrency(valuesByCurrency[baseCurrency], baseCurrency);
    const secondaryRows = cardElement.querySelectorAll("[data-currency-secondary]");
    orderedCurrencies.slice(1).forEach((currency, index) => {
        const row = secondaryRows[index];
        row.querySelector("span").textContent = CURRENCIES[currency].label;
        row.querySelector("output").textContent = formatCurrency(valuesByCurrency[currency], currency);
    });
}

function calculateDingDangValue(quantity, targetCurrency) {
    return quantity * DINGDANG_PRICE / DINGDANG_UNIT
        * exchangeRates[targetCurrency] / exchangeRates.HKD;
}

function calculateTotalValue(cardValues) {
    return Object.values(cardValues).reduce((total, value) => total + value, 0);
}

function formatCurrency(value, currency, maximumFractionDigits = 3) {
    const amount = new Intl.NumberFormat("zh-TW", {
        minimumFractionDigits: 2,
        maximumFractionDigits
    }).format(value);
    return `${CURRENCIES[currency].symbol}${amount}`;
}

function isValidExchangeRateData(data) {
    return data?.result === "success"
        && data.base_code === "TWD"
        && Number.isFinite(Number(data.rates?.HKD))
        && Number(data.rates.HKD) > 0
        && Number.isFinite(Number(data.rates?.CNY))
        && Number(data.rates.CNY) > 0;
}

function applyExchangeRateData(data) {
    exchangeRates = {
        TWD: 1,
        HKD: Number(data.rates.HKD),
        CNY: Number(data.rates.CNY)
    };
    exchangeRateUpdatedAt = data.time_last_update_utc || "";
}

function formatExchangeRateDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "日期未知" : date.toLocaleDateString("zh-TW");
}

function loadCachedExchangeRateData() {
    try {
        const cached = JSON.parse(localStorage.getItem(EXCHANGE_RATE_CACHE_KEY));
        return isValidExchangeRateData(cached) ? cached : null;
    } catch {
        return null;
    }
}

async function loadExchangeRates() {
    const cached = loadCachedExchangeRateData();
    if (cached) {
        applyExchangeRateData(cached);
        const nextUpdate = Number(cached.time_next_update_unix) * 1000;
        if (nextUpdate > Date.now()) {
            exchangeRateStatus.textContent = `匯率更新：${formatExchangeRateDate(exchangeRateUpdatedAt)}（每日更新）`;
            updateCurrencyCalculator();
            return;
        }
    }

    try {
        const response = await fetch(EXCHANGE_RATE_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!isValidExchangeRateData(data)) throw new Error("Invalid exchange rate data");
        applyExchangeRateData(data);
        localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(data));
        exchangeRateStatus.textContent = `匯率更新：${formatExchangeRateDate(exchangeRateUpdatedAt)}（每日更新）`;
    } catch (error) {
        if (cached) {
            exchangeRateStatus.textContent = `連線失敗，使用快取匯率（${formatExchangeRateDate(exchangeRateUpdatedAt)}）`;
        } else {
            exchangeRateStatus.textContent = "匯率服務暫不可用，使用內建參考匯率";
        }
        console.warn("Unable to refresh currency exchange rates:", error);
    }
    updateCurrencyCalculator();
}

function updateCurrencyCalculator() {
    const cardValues = Object.fromEntries(Object.keys(CURRENCIES).map((currency) => [currency, {}]));

    for (const card of Object.keys(CARD_HKD_PRICE_PER_10K)) {
        const input = document.querySelector(`[data-currency-input="${card}"]`);
        const rawQuantity = input.value === "" ? 0 : Number(input.value);
        const quantity = Number.isFinite(rawQuantity) ? Math.max(0, Math.trunc(rawQuantity)) : 0;
        if (input.value !== "" && input.value !== String(quantity)) input.value = String(quantity);
        const valuesByCurrency = {};
        for (const currency of Object.keys(CURRENCIES)) {
            const value = calculateCardValue(quantity, card, currency);
            cardValues[currency][card] = value;
            valuesByCurrency[currency] = value;
        }
        renderCurrencyValues(input.closest(".currency-card"), valuesByCurrency, "HKD");
    }

    const dingdangInput = document.querySelector("#currency-dingdang");
    const rawDingDangQuantity = dingdangInput.value === "" ? 0 : Number(dingdangInput.value);
    const dingdangQuantity = Number.isFinite(rawDingDangQuantity) ? Math.max(0, Math.trunc(rawDingDangQuantity)) : 0;
    if (dingdangInput.value !== "" && dingdangInput.value !== String(dingdangQuantity)) {
        dingdangInput.value = String(dingdangQuantity);
    }
    const dingdangValuesByCurrency = {};
    for (const currency of Object.keys(CURRENCIES)) {
        const value = calculateDingDangValue(dingdangQuantity, currency);
        cardValues[currency].dingdang = value;
        dingdangValuesByCurrency[currency] = value;
    }
    renderCurrencyValues(dingdangInput.closest(".currency-card"), dingdangValuesByCurrency, "HKD");
    const dingdangUnitValues = Object.keys(CURRENCIES).map((currency) => formatCurrency(
        calculateDingDangValue(DINGDANG_UNIT, currency),
        currency
    ));
    document.querySelector('[data-currency-rate="dingdang"]').textContent = `每 1,000 萬約 ${dingdangUnitValues.join(" · ")}`;

    for (const currency of Object.keys(CURRENCIES)) {
        const value = calculateTotalValue(Object.values(cardValues[currency]));
        document.querySelector(`#currency-total-${currency.toLowerCase()}`).textContent = formatCurrency(value, currency, 2);
    }
}

function wearCard(card) {
    const comparisonIndex = comparisonStates.findIndex((state) => !state.locked);
    if (comparisonIndex < 0) return;
    const slot = equipmentSlotForCard(card);
    comparisonStates[comparisonIndex].slots[slot] = { card, level: equipmentLevel.value, isBlack: false };
    comparisonStates[comparisonIndex].equipmentApplied[slot] = true;
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
            const openPicker = document.createElement("button");
            openPicker.className = "compare-empty-open";
            openPicker.type = "button";
            openPicker.disabled = state.locked;
            openPicker.setAttribute("aria-label", `選擇${slot === "magic" ? "魔法" : slot === "weapon" ? "武器" : "防具"}裝備`);
            const placeholder = document.createElement("img");
            placeholder.className = "compare-empty-art";
            placeholder.src = new URL("./images/card_effects/未啟用卡牌位置.png", import.meta.url).href;
            placeholder.alt = "未穿戴裝備卡";
            openPicker.append(placeholder);
            openPicker.addEventListener("click", () => renderEquipmentPicker(comparisonIndex, slot, openPicker));
            content.replaceChildren(openPicker);
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
            state.equipmentApplied[slot] = false;
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
    renderCharacterPanel(comparisonIndex);
}

function closeEquipmentPicker() {
    if (equipmentPickerDialog.open) equipmentPickerDialog.close();
    equipmentPickerAnchor = null;
    equipmentPickerGrid.replaceChildren();
}

function positionEquipmentPicker(anchor) {
    const anchorRect = anchor.getBoundingClientRect();
    const pickerRect = equipmentPickerDialog.getBoundingClientRect();
    const edge = 8;
    const left = Math.min(
        Math.max(edge, anchorRect.left + (anchorRect.width - pickerRect.width) / 2),
        Math.max(edge, window.innerWidth - pickerRect.width - edge)
    );
    const top = Math.min(
        Math.max(edge, anchorRect.top + (anchorRect.height - pickerRect.height) / 2),
        Math.max(edge, window.innerHeight - pickerRect.height - edge)
    );
    equipmentPickerDialog.style.left = `${left}px`;
    equipmentPickerDialog.style.top = `${top}px`;
}

function repositionOpenEquipmentPicker() {
    if (equipmentPickerDialog.open && equipmentPickerAnchor) positionEquipmentPicker(equipmentPickerAnchor);
}

function renderEquipmentPicker(comparisonIndex, slot, anchor) {
    const panel = document.querySelector(`.compare-panel[data-comparison-index="${comparisonIndex}"]`);
    const state = comparisonStates[comparisonIndex];
    if (!panel || !state || state.locked) return;

    equipmentPickerAnchor = anchor;
    const slotName = slot === "magic" ? "魔法" : slot === "weapon" ? "武器" : "防具";
    equipmentPickerTitle.textContent = `選擇${slotName}裝備`;

    const subtypeOrder = slot === "magic"
        ? ["magic"]
        : slot === "weapon" ? ["axe", "bow", "sword", "wand"] : ["boots", "pendant", "armor", "shield"];
    const elementOrder = ["水", "火", "土", "風"];
    const pickerGrid = document.createElement("div");
    pickerGrid.className = "equipment-picker-grid";
    const availableCards = cards.filter((card) => equipmentSlotForCard(card) === slot).sort((first, second) => {
        const elementDifference = elementOrder.indexOf(first.element) - elementOrder.indexOf(second.element);
        return elementDifference || subtypeOrder.indexOf(first.art_subtype) - subtypeOrder.indexOf(second.art_subtype);
    });
    for (const card of availableCards) {
        const option = document.createElement("button");
        option.className = "equipment-picker-option";
        option.type = "button";
        option.setAttribute("aria-label", `穿戴${card.name_zh || card.name_en || "裝備"}`);
        option.title = card.name_zh || card.name_en || "裝備";
        const cardArtwork = document.createElement("div");
        cardArtwork.className = "card-art equipment-picker-card-art";
        addArtwork(cardArtwork, card, equipmentLevel.value);
        option.append(cardArtwork);
        const thumbnailFilename = artworkFor(card, "s", equipmentLevel.value);
        if (thumbnailFilename) {
            const image = document.createElement("img");
            image.className = "equipment-picker-thumbnail";
            image.src = new URL(thumbnailFilename, ART_BASE_URL).href;
            image.alt = "";
            image.loading = "lazy";
            image.decoding = "async";
            option.append(image);
        }
        option.addEventListener("click", () => {
            closeEquipmentPicker();
            state.slots[slot] = { card, level: equipmentLevel.value, isBlack: false };
            state.equipmentApplied[slot] = true;
            renderCompareSlots();
            renderCards();
        });
        pickerGrid.append(option);
    }
    equipmentPickerGrid.replaceChildren(...pickerGrid.children);
    if (!equipmentPickerDialog.open) equipmentPickerDialog.show();
    positionEquipmentPicker(anchor);
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

function getCardTotalStats(selection) {
    const baseStats = getStatsForLevel(selection.card, selection.level);
    const specialStats = getSelectedSpecialStats(selection.card, selection.level);
    const totals = new Map();
    for (const source of [baseStats, specialStats]) {
        if (!source || typeof source !== "object") continue;
        for (const [key, value] of Object.entries(source)) totals.set(key, (totals.get(key) || 0) + value);
    }
    return { baseStats, specialStats, totals };
}

function formatCharacterNumber(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function formatAttackInterval(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function applyAttackDamageModifier(baseDamage, bonusPercent) {
    if (bonusPercent < 0) return Math.max(0, Math.round(baseDamage * Math.abs(bonusPercent) / 100));
    return Math.max(0, baseDamage + Math.round(baseDamage * bonusPercent / 100));
}

function calculateCharacterDamage(character, damageType, comparisonIndex) {
    const state = comparisonStates[comparisonIndex];
    const isRange = Boolean(character[`${damageType}Range`]);
    const baseDamages = isRange
        ? character[damageType]
        : [character[damageType][state.normalCharacter ? 0 : 1]];
    const hits = damageType === "melee" ? character.meleeHits || 1 : 1;
    const bonusPercent = getAppliedDamageBonusPercent(damageType, comparisonIndex);
    const bonuses = baseDamages.map((baseDamage) => Math.round(baseDamage * bonusPercent / 100));
    const values = baseDamages.map((baseDamage) => applyAttackDamageModifier(baseDamage, bonusPercent));
    return { baseDamages, bonuses, hits, values, bonusPercent };
}

function getAppliedDamageBonusPercent(damageType, comparisonIndex) {
    const state = comparisonStates[comparisonIndex];
    let bonusPercent = 0;
    for (const slot of ["weapon", "armor"]) {
        const selection = state.slots[slot];
        if (!state.equipmentApplied[slot] || !selection) continue;
        if (slot === "weapon") {
            const subtype = selection.card.art_subtype;
            if (["axe", "sword"].includes(subtype) && damageType !== "melee") continue;
            if (["bow", "wand"].includes(subtype) && damageType !== "ranged") continue;
        }
        const damageModifier = getCardTotalStats(selection).totals.get("attack_damage");
        if (typeof damageModifier !== "number") continue;
        if (slot === "armor" && damageModifier < 0) continue;
        bonusPercent += damageModifier;
    }
    return bonusPercent;
}

function getAppliedCharacterStatBonus(statKey, comparisonIndex, matchesSelection = (slot) => slot !== "magic") {
    const state = comparisonStates[comparisonIndex];
    let bonusPercent = 0;
    for (const slot of ["magic", "weapon", "armor"]) {
        const selection = state.slots[slot];
        if (!selection || !state.equipmentApplied[slot] || !matchesSelection(slot, selection)) continue;
        const bonus = getCardTotalStats(selection).totals.get(statKey);
        if (typeof bonus === "number") bonusPercent += bonus;
    }
    return bonusPercent;
}

function calculateCharacterAttackInterval(character, damageType, comparisonIndex) {
    const weaponTypes = damageType === "melee" ? ["axe", "sword"] : ["bow", "wand"];
    const matchesWeapon = (slot, selection) => slot === "weapon" && weaponTypes.includes(selection.card.art_subtype);
    const attackSpeedBonus = getAppliedCharacterStatBonus("attack_speed", comparisonIndex, matchesWeapon);
    const attackTimeBonus = getAppliedCharacterStatBonus("attack_time", comparisonIndex, matchesWeapon);
    const speedMultiplier = Math.max(0.01, 1 + attackSpeedBonus / 100);
    const timeMultiplier = Math.max(0.01, 1 + attackTimeBonus / 100);
    return character[`${damageType}Speed`] * timeMultiplier / speedMultiplier;
}

function getPotentialEquipmentStatProfiles() {
    const profiles = { magic: [], weapon: [], armor: [] };
    const levels = Array.from({ length: 9 }, (_, index) => String(index + 1));

    for (const card of cards) {
        const slot = equipmentSlotForCard(card);
        const parsedSpecial = parseEffectLines(getCardTextLines(card, "special"));
        const skillOptions = getCardSpecialSkillOptions(card, parsedSpecial.custom).one;
        const skillStatKeys = new Set(skillOptions.flatMap((skill) => (
            Object.keys(parseEffectLines([skill]).values)
        )));
        const skillChoices = [...new Set(["", ...skillOptions])];

        for (const level of levels) {
            const baseStats = getStatsForLevel(card, level);
            for (const skill of skillChoices) {
                const specialStats = { ...parsedSpecial.values };
                skillStatKeys.forEach((key) => { specialStats[key] = undefined; });
                Object.assign(specialStats, parseEffectLines([skill]).values);

                const stats = { ...baseStats };
                for (const [key, value] of Object.entries(specialStats)) {
                    if (typeof value !== "number") continue;
                    stats[key] = (stats[key] || 0) + scaleStatToLevel(value, level);
                }
                profiles[slot].push({ subtype: card.art_subtype, stats });
            }
        }
    }

    return profiles;
}

function getCharacterStatMaximums() {
    if (characterStatMaximumsCache) return characterStatMaximumsCache;

    const profiles = getPotentialEquipmentStatProfiles();
    const normalizeMaximum = (value) => Number(value.toFixed(6));
    const readStat = (profile, key) => Number.isFinite(profile.stats[key]) ? profile.stats[key] : 0;
    const maximumContribution = (items, key) => Math.max(0, ...items.map((profile) => readStat(profile, key)));
    const weaponDamageBonus = (subtypes) => maximumContribution(
        profiles.weapon.filter((profile) => subtypes.includes(profile.subtype)),
        "attack_damage"
    );
    const armorDamageBonus = maximumContribution(profiles.armor, "attack_damage");
    const allDamage = (damageType, bonusPercent) => Math.max(...characters.map((character) => {
        const baseDamages = Array.isArray(character[damageType]) ? character[damageType] : [character[damageType]];
        const hits = damageType === "melee" ? character.meleeHits || 1 : 1;
        return Math.max(...baseDamages.map((damage) => applyAttackDamageModifier(damage, bonusPercent))) * hits;
    }));
    const maximumAttackInterval = (damageType) => {
        const weaponTypes = damageType === "melee" ? ["axe", "sword"] : ["bow", "wand"];
        // Armor attack speed only affects the denominator, so its minimum gives the longest interval.
        const minimumArmorAttackSpeed = Math.min(
            0,
            ...profiles.armor.map((profile) => readStat(profile, "attack_speed"))
        );
        const weaponChoices = [{ subtype: "", stats: {} }, ...profiles.weapon];
        let maximum = 0;

        for (const character of characters) {
            for (const weapon of weaponChoices) {
                const attackSpeedBonus = readStat(weapon, "attack_speed") + minimumArmorAttackSpeed;
                const attackTimeBonus = weaponTypes.includes(weapon.subtype) ? readStat(weapon, "attack_time") : 0;
                const speedMultiplier = Math.max(0.01, 1 + attackSpeedBonus / 100);
                const timeMultiplier = Math.max(
                    0.01,
                    attackTimeBonus < 0 ? Math.abs(attackTimeBonus) / 100 : 1 + attackTimeBonus / 100
                );
                maximum = Math.max(
                    maximum,
                    character[`${damageType}Speed`] * timeMultiplier / speedMultiplier
                );
            }
        }
        return maximum;
    };

    // Stat bonuses combine independently across equipment slots, so their maxima can be summed directly.
    const maximumSpeedBonus = maximumContribution(profiles.weapon, "max_speed")
        + maximumContribution(profiles.armor, "max_speed");
    const maximumAccelerationBonus = maximumContribution(profiles.weapon, "acceleration")
        + maximumContribution(profiles.armor, "acceleration");
    const maximumMagicDamageBonus = maximumContribution(profiles.magic, "attack_damage");
    const magicDamageBonus = Math.trunc(MAGIC_DAMAGE_BASE * maximumMagicDamageBonus / 100);

    characterStatMaximumsCache = {
        meleeDamage: normalizeMaximum(allDamage("melee", weaponDamageBonus(["axe", "sword"]) + armorDamageBonus)),
        rangedDamage: normalizeMaximum(allDamage("ranged", weaponDamageBonus(["bow", "wand"]) + armorDamageBonus)),
        meleeAttackInterval: normalizeMaximum(maximumAttackInterval("melee")),
        rangedAttackInterval: normalizeMaximum(maximumAttackInterval("ranged")),
        magicDamage: normalizeMaximum(Math.max(0, MAGIC_DAMAGE_BASE + magicDamageBonus)),
        maxSpeed: normalizeMaximum(Math.max(...characters.map((character) => (
            Math.max(0, character.maxSpeed * (1 + maximumSpeedBonus / 100) * 10)
        )))),
        turnSpeed: normalizeMaximum(Math.max(...characters.map((character) => Math.max(0, character.turnSpeed * 10)))),
        acceleration: normalizeMaximum(Math.max(...characters.map((character) => (
            Math.max(0, character.acceleration * (1 + maximumAccelerationBonus / 100) * 10)
        )))),
        hp: normalizeMaximum(Math.max(...characters.map((character) => character.hp))),
        mp: normalizeMaximum(Math.max(...characters.map((character) => character.mp))),
        bp: normalizeMaximum(Math.max(...characters.map((character) => character.bp)))
    };
    return characterStatMaximumsCache;
}

function calculateGoblinHitDamage(character, comparisonIndex, damageType = "melee") {
    const state = comparisonStates[comparisonIndex];
    const characterDamage = character[damageType];
    const baseDamage = damageType === "ranged" && character.rangedRange
        ? Math.min(...characterDamage)
        : characterDamage[state.normalCharacter ? 0 : 1];
    const measuredDamage = damageType === "melee" && !state.normalCharacter
        ? ({ 1: 23, 3: 34 }[character.id] ?? null)
        : null;
    const baseGoblinDamage = measuredDamage ?? Math.round(baseDamage * (character.id === 1 ? 0.82 : 0.85));
    const bonusPercent = getAppliedDamageBonusPercent(damageType, comparisonIndex);
    if (bonusPercent < 0) return Math.max(1, applyAttackDamageModifier(baseGoblinDamage, bonusPercent));
    const equipmentDamage = Math.round(baseDamage * bonusPercent / 100 * 0.835);
    return Math.max(1, baseGoblinDamage + equipmentDamage);
}

function renderCharacterPanel(comparisonIndex) {
    const panel = document.querySelector(`.compare-panel[data-comparison-index="${comparisonIndex}"]`);
    const state = comparisonStates[comparisonIndex];
    if (!panel || !state) return;
    const character = characters.find((item) => item.id === state.characterId);
    if (!character) return;
    const statMaximums = getCharacterStatMaximums();

    panel.querySelector(".character-stats-portrait").src = new URL(
        characterStatsPortraitArtwork(character), CHARACTER_ART_URL
    ).href;
    panel.querySelector(".character-stats-name").textContent = character.name;
    panel.querySelector(".character-stats-element").textContent = `${character.element}元素`;
    panel.querySelector(".character-tier-current").textContent = state.normalCharacter ? "普角" : "高角";
    panel.querySelector(".character-normal-toggle").checked = state.normalCharacter;

    for (const slot of ["magic", "weapon", "armor"]) {
        const button = panel.querySelector(`.character-equipment-toggle[data-slot="${slot}"]`);
        const selection = state.slots[slot];
        button.disabled = !selection;
        button.classList.toggle("has-card", Boolean(selection));
        button.setAttribute("aria-pressed", String(Boolean(selection && state.equipmentApplied[slot])));
        button.setAttribute("aria-label", selection
            ? `${slot === "magic" ? "魔法" : slot === "weapon" ? "武器" : "防具"}：${selection.card.name_zh || selection.card.name_en}，能力${state.equipmentApplied[slot] ? "已套用" : "未套用"}`
            : `${slot === "magic" ? "魔法" : slot === "weapon" ? "武器" : "防具"}裝備欄空白`);
        button.classList.toggle("is-applied", Boolean(selection && state.equipmentApplied[slot]));
        button.replaceChildren();
        if (selection) {
            const filename = artworkFor(selection.card, "s", selection.level);
            if (filename) {
                const image = document.createElement("img");
                image.className = "character-equipment-icon";
                image.src = new URL(filename, ART_BASE_URL).href;
                image.alt = "";
                image.addEventListener("error", () => image.remove(), { once: true });
                button.append(image);
            }
        }
    }

    const meleeInterval = calculateCharacterAttackInterval(character, "melee", comparisonIndex);
    const rangedInterval = calculateCharacterAttackInterval(character, "ranged", comparisonIndex);
    const meleeBaseInterval = character.meleeSpeed;
    const rangedBaseInterval = character.rangedSpeed;
    const maxSpeedBase = Math.max(0, character.maxSpeed * 10);
    const maxSpeed = Math.max(0, character.maxSpeed * (1 + getAppliedCharacterStatBonus("max_speed", comparisonIndex) / 100) * 10);
    const accelerationBase = Math.max(0, character.acceleration * 10);
    const acceleration = Math.max(0, character.acceleration * (1 + getAppliedCharacterStatBonus("acceleration", comparisonIndex) / 100) * 10);
    const magicDamagePercent = getAppliedCharacterStatBonus("attack_damage", comparisonIndex, (slot) => slot === "magic");
    const magicDamageBonus = Math.trunc(MAGIC_DAMAGE_BASE * magicDamagePercent / 100);
    const magicDamage = Math.max(0, MAGIC_DAMAGE_BASE + magicDamageBonus);
    const rows = [
        { key: "meleeDamage", label: "近戰傷害", damageType: "melee", maximum: statMaximums.meleeDamage },
        { key: "rangedDamage", label: "遠程傷害", damageType: "ranged", maximum: statMaximums.rangedDamage },
        { key: "meleeAttackInterval", label: "近戰攻擊間隔", value: meleeInterval, baseValue: meleeBaseInterval, maximum: statMaximums.meleeAttackInterval, suffix: "秒/次", format: formatAttackInterval },
        { key: "rangedAttackInterval", label: "遠程攻擊間隔", value: rangedInterval, baseValue: rangedBaseInterval, maximum: statMaximums.rangedAttackInterval, suffix: "秒/次", format: formatAttackInterval },
        {
            key: "magicDamage",
            label: "魔法傷害",
            value: magicDamage,
            baseValue: MAGIC_DAMAGE_BASE,
            maximum: statMaximums.magicDamage,
            format: (value) => magicDamageBonus === 0
                ? formatCharacterNumber(value)
                : `${formatCharacterNumber(value)} (${MAGIC_DAMAGE_BASE}${magicDamageBonus > 0 ? "+" : ""}${magicDamageBonus})`
        },
        { key: "turnSpeed", label: "轉向速度", value: Math.max(0, character.turnSpeed * 10), maximum: statMaximums.turnSpeed, suffix: `/ ${formatCharacterNumber(statMaximums.turnSpeed)}` },
        { key: "maxSpeed", label: "最大速度", value: maxSpeed, maximum: statMaximums.maxSpeed, suffix: `/ ${formatCharacterNumber(statMaximums.maxSpeed)}` },
        { key: "acceleration", label: "加速度", value: acceleration, baseValue: accelerationBase, maximum: statMaximums.acceleration, suffix: `/ ${formatCharacterNumber(statMaximums.acceleration)}` },
        { key: "hp", label: "HP", value: character.hp, maximum: statMaximums.hp, fullWidth: true, meterTone: "hp" },
        { key: "mp", label: "MP", value: character.mp, maximum: statMaximums.mp, fullWidth: true, meterTone: "mp" },
        { key: "bp", label: "BP", value: character.bp, maximum: statMaximums.bp, fullWidth: true, meterTone: "bp" }
    ];
    const fragment = document.createDocumentFragment();
    for (const rowData of rows) {
        const row = document.createElement("div");
        row.className = "character-stat-row";
        row.dataset.statKey = rowData.key;
        if (rowData.fullWidth) row.classList.add("is-full-width");
        if (rowData.meterTone) row.dataset.meterTone = rowData.meterTone;
        const label = document.createElement("span");
        label.className = "character-stat-label";
        label.textContent = rowData.label;
        const value = document.createElement("strong");
        let meterValue = rowData.value;
        let meterBaseValue = rowData.baseValue ?? rowData.value;
        if (rowData.damageType) {
            const damage = calculateCharacterDamage(character, rowData.damageType, comparisonIndex);
            const hitLabel = damage.hits > 1 ? ` ×${damage.hits}` : "";
            const formatDamageRange = (values) => values.length > 1 && values[0] !== values[1]
                ? `${formatCharacterNumber(values[0])}–${formatCharacterNumber(values[1])}`
                : formatCharacterNumber(values[0]);
            const baseLabel = `${formatDamageRange(damage.baseDamages)}${hitLabel}`;
            const resultLabel = `${formatDamageRange(damage.values)}${hitLabel}`;
            const bonusLabel = formatDamageRange(damage.bonuses.map((bonus) => Math.abs(bonus)));
            if (damage.bonusPercent !== 0) {
                const exactValues = damage.baseDamages.map((baseDamage) => damage.bonusPercent < 0
                    ? baseDamage * Math.abs(damage.bonusPercent) / 100
                    : Math.abs(baseDamage * damage.bonusPercent / 100));
                value.title = `${baseLabel} × ${formatPercent(Math.abs(damage.bonusPercent))}% = ${formatDamageRange(exactValues)}; 最終傷害採整數`;
            }
            value.textContent = damage.bonusPercent === 0
                ? baseLabel
                : damage.bonusPercent < 0
                    ? `${resultLabel} (${baseLabel} × ${formatPercent(Math.abs(damage.bonusPercent))}%)`
                    : `${resultLabel} (${baseLabel} + ${bonusLabel})`;
            meterValue = Math.max(...damage.values) * damage.hits;
            meterBaseValue = Math.max(...damage.baseDamages) * damage.hits;
        } else {
            value.textContent = `${(rowData.format || formatCharacterNumber)(rowData.value)}${rowData.suffix || ""}`;
        }
        const displayedValue = Math.max(0, Math.min(rowData.maximum, meterValue));
        const displayedBaseValue = Math.max(0, Math.min(rowData.maximum, meterBaseValue));
        const meter = document.createElement("div");
        meter.className = "character-stat-meter";
        meter.setAttribute("role", "meter");
        meter.setAttribute("aria-label", rowData.label);
        meter.setAttribute("aria-valuemin", "0");
        meter.setAttribute("aria-valuemax", String(rowData.maximum));
        meter.setAttribute("aria-valuenow", String(displayedValue));
        const baseFill = document.createElement("span");
        baseFill.className = "character-stat-meter-base";
        const changeFill = document.createElement("span");
        changeFill.className = "character-stat-meter-change";
        const stableValue = Math.min(displayedBaseValue, displayedValue);
        baseFill.style.width = `${stableValue / rowData.maximum * 100}%`;
        if (displayedValue !== displayedBaseValue) {
            changeFill.classList.add(displayedValue > displayedBaseValue ? "is-increase" : "is-decrease");
            changeFill.style.width = `${Math.abs(displayedValue - displayedBaseValue) / rowData.maximum * 100}%`;
        }
        meter.append(baseFill, changeFill);
        row.append(label, value, meter);
        fragment.append(row);
    }
    panel.querySelector(".character-stat-grid").replaceChildren(fragment);
    renderGoblinSummary(comparisonIndex);
}

function renderGoblinSummary(comparisonIndex) {
    const panel = document.querySelector(`.compare-panel[data-comparison-index="${comparisonIndex}"]`);
    const state = comparisonStates[comparisonIndex];
    if (!panel || !state) return;
    const character = characters.find((item) => item.id === state.characterId);
    if (!character) return;
    const damageType = state.goblinDamageType === "ranged" ? "ranged" : "melee";
    const modeToggle = panel.querySelector(".goblin-damage-mode-toggle");
    const nextDamageType = damageType === "ranged" ? "melee" : "ranged";
    modeToggle.textContent = nextDamageType === "ranged" ? "遠程" : "近戰";
    modeToggle.setAttribute("aria-pressed", String(damageType === "ranged"));
    modeToggle.setAttribute("aria-label", `切換為${nextDamageType === "ranged" ? "遠程" : "近戰"}傷害`);
    const damage = calculateGoblinHitDamage(character, comparisonIndex, damageType);
    for (const goblinType of ["beginner", "hero"]) {
        const hp = Number(state[`${goblinType}GoblinHp`]) || 0;
        const row = panel.querySelector(`.goblin-hit-row[data-goblin-type="${goblinType}"]`);
        row.querySelector(".goblin-hp-input").value = hp || "";
        row.querySelector(".goblin-hit-damage").textContent = String(damage);
        row.querySelector(".goblin-hit-count-number").textContent = hp > 0 ? `${Math.ceil(hp / damage)}次` : "--次";
        const meter = row.querySelector(".goblin-damage-meter");
        meter.setAttribute("aria-valuemax", String(hp));
        meter.setAttribute("aria-valuenow", String(Math.min(damage, hp)));
        row.querySelector(".goblin-damage-fill").style.width = `${hp > 0 ? Math.min(100, damage / hp * 100) : 0}%`;
    }
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
        const { totals, baseStats, specialStats } = getCardTotalStats(selection);
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
