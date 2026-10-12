# Survival Project 裝備卡圖鑑

純 HTML、CSS 與 JavaScript 的靜態卡片圖鑑，可直接部署至 GitHub Pages。網站不需要 Node.js、PHP、資料庫、登入服務或後端 API。

## 本機預覽

在此資料夾開啟終端機並執行：

```powershell
python -m http.server 8000
```

瀏覽 `http://localhost:8000`。不要直接以 `file://` 開啟，瀏覽器會阻擋卡片 JSON 的讀取。

## 發布到 GitHub Pages

1. 將本資料夾內的檔案與子資料夾放在 repository 根目錄。
2. 推送至 `main` 分支。
3. 到 repository 的 **Settings → Pages**，將 **Build and deployment → Source** 設為 **GitHub Actions**。
4. `.github/workflows/pages.yml` 會自動建置並部署靜態網站；等待 Actions 完成後即可使用 Pages 網址瀏覽。

本站使用相對路徑，支援 GitHub Pages 專案型網址。圖鑑只收錄裝備卡，已合併金卡、銀卡與黑卡的重複項目；可依火、水、土、風屬性搜尋與篩選特殊技能 S1、S2，並切換第 1 至第 9 級卡圖。卡片固定依 ID 排列。屬性選單順序維持火、水、土、風、全部，預設選擇「全部」與第 9 級。

## 目錄內容

- `index.html`、`styles.css`、`app.js`：網站介面與互動。
- `data/cards.json`：36 種元素裝備索引資料，不再區分金卡、銀卡與黑卡。
- `images/global_card_images/`：從工作區既有素材整理的 877 張 PNG 卡圖。
- `images/characters/`：12 位角色選擇圖與去背立繪。
- `SPECIAL_SKILL_RULES.md`：使用者提供的武器、防具特殊技能清單、頂值係數與待確認事項，供後續編輯參照。

網站使用 `images/global_card_images/` 中既有的裝備卡原圖；直式卡圖依原始畫素尺寸完整呈現，空間不足時只會縮小，不會放大或裁切。原始素材缺少火屬性魔杖第 2 級的大尺寸卡圖時，會改用同級小圖，不會以其他等級代替。

## 裝備能力與本機資料來源

目前 20 張裝備已有能力數值，其他 16 張的一般能力欄位為空，方便逐卡補值，不顯示待更新佔位字樣。`stats` 使用正負數表示增加或減少，涵蓋速度、攻擊、HP/BP/MP 恢復、消耗及震動率等能力；也可在管理編輯器輸入一般能力與特殊技能 S1/S2。能力只在第 9 級顯示，並直接列於卡片下方。左側能力條件可多選，需全部符合；S1/S2 篩選會依卡片特殊效果行文字建立，秒數以 `X秒` 正規化。

所有裝備預設以金卡樣式顯示。卡片左上角的「365」由 `images/card_effects/images_global_card_out_line_l_gold_number.png` 原始數字精靈圖裁出 3、6、5 三個字形組成；金框與九格閃爍影格也使用遊戲素材。試穿欄勾選「黑卡」會移除金框、365 與金卡閃爍效果，只顯示卡片原圖。網站預設深色主題，可用頁首太陽／月亮按鈕切換並記住選擇；卡圖透明處會在原尺寸卡框內顯示白底。

頁首的「裝備試穿」可展開／收合魔法、武器、防具欄。角色選擇器與目前角色欄都使用 `ch_13` 至 `ch_24` 共 12 張直式選擇圖，沒有隨機角色入口；角色屬性分組為 Xyrho、Shamoo、Cara（火），Sven、Cream、Lucy（水），Roland、Hazel、Warren（土），Aurelli、Hawk、Will（風），對照參考 [SPGENS 角色清單](https://www.spgenerations.com/wiki/index.php/Character_List)。卡片旁的「穿戴」會加入或替換相應裝備欄，同一類型僅保留一件；目前穿戴卡片的按鈕會反白並顯示「已穿戴」。發動率與素質總和分別列出魔法、武器、防具三欄，對齊裝備槽；有特殊素質加成時，總值後會列出一般值與加成值，加成部分以紅字標示。

發動率依使用者提供的 LV.9 情境反推：魔法基準 30%，武器／防具基準 50%；等級加成假設為 `30 × (等級 - 1) ÷ 8`，同屬性角色加 10 個百分點，金卡裝備自身加 10 個百分點，三欄全滿且全為金卡時再各加 10 個百分點，最高 100%。試穿欄的「黑卡」勾選會移除該欄金卡加成；若破壞全金卡組合，也會一併取消套裝加成。這套規則能重現提供的四組數字，但混搭情境與非 LV.9 的逐級加成是依有限樣本作的線性推算，不代表已從遊戲程式碼證實。

第 9 級卡片會在一般能力下方顯示分隔線，特殊效果不再顯示多餘標題；分隔線以下使用極光綠，技能秒數數字以亮橘色標示，技能尾端百分比靠右對齊。`special_stats` 用於特殊效果的數值加成（會計入該裝備欄素質總和），`special_skills` 用於技能文字。火斧特殊技能文字格式為「導致 對方攻擊遲鈍5秒 2%」；其中 2% 是技能描述的一部分，不是裝備發動率。試穿總和會在總值後拆列一般值與特殊加成，例如 `171% 117+54`，特殊加成以紅字表示。

水杖的 LV.1、7、9 素質可由同一逐級比例還原：`LV.9 素質 × (等級 + 3) ÷ 12`；這與土魔樣本的倍率一致。細節及使用者提供的特殊技能頂值規則記錄於 [SPECIAL_SKILL_RULES.md](SPECIAL_SKILL_RULES.md)。

頁尾「無需登入」可開啟管理編輯。輸入密碼後，卡片的一般能力、特殊技能 S1、S2 可分開編輯；逐卡儲存或儲存所有變更會保存至目前瀏覽器的 `localStorage`，重開同一瀏覽器仍會保留。工具列可匯出完整 `cards.json`，也可匯入完整 JSON；匯入檔必須包含圖鑑所有卡片且 ID 不重複。要發布到 GitHub Pages，匯出後將檔案放回 `data/cards.json` 覆蓋舊檔，再提交並推送 repository；GitHub Actions 會重新部署。換瀏覽器或清除網站資料前，先匯出 JSON 備份。密碼檢查由前端 JavaScript 執行，只能作為介面入口，不是安全驗證；使用者可查看網站原始碼或繞過檢查，不可用來保護機密資料。

工作區的 `sabapuro/Client/images/string.xml` 含有 `IDS_CARDSHOP_ATTACK_TIME_UP`、`IDS_CARDSHOP_ATTACK_DAMAGE_UP`、`IDS_CARDSHOP_ATTACK_THRUST_UP` 與 `IDS_CARDSHOP_MP_WASTE_UP` 等通用文字模板，數值使用執行時格式參數。地斧卡的 `IDS_CARDSHOP_EARTH_AXE_BLACK_CARD_*` 描述只說明其提升近戰攻擊力，沒有列出這四項百分比。繁體中文對照位於 `sabapuro/Client/images/translation_glossary.json`。目前未找到按裝備列出的實際數值表。

## 素材與權利

卡片資料與圖片取自本機 Survival Project 遊戲素材。遊戲名稱、美術與原始素材的權利屬於各自權利人。將 repository 設為公開或發布網站前，請確認有權公開散佈這些素材；本專案的網站程式碼不代表素材取得額外授權。