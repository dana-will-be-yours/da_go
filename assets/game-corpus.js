const STORAGE_KEY = "daGoCorpusRpgStateV1";
const SAVE_KEY = "daGoCorpusRpgManualSaveV1";
const ENGINE_VERSION = "0.8.0-corpus-driven-dol-style";

const corpusConfig = {
  database_name: "TRPG_Corpus_DB",
  session_code: "DA20-CORPUS-RPG-001",
  import_batch_code: "DAGUO_CORPUS_RPG_UTT_001"
};

const labels = {
  stats: { spirit: "精神", composure: "鎮定", suspicion: "疑心", fatigue: "疲勞", hunger: "飢餓", coin: "錢" },
  skills: { inquiry: "探問", archive: "案卷", influence: "交涉", travel: "行路" },
  styles: { standard: "標準", scroll: "書卷", night: "夜讀", large: "大字" }
};

const randomEvents = [
  { key: "rain", text: "細雨重新落下，街上腳印變得難以辨認。", effects: { fatigue: 2 }, dev: { traceability: 1 } },
  { key: "rumour", text: "有人在巷口提到銀川關卡，隨即閉口。", effects: { suspicion: 1 }, dev: { smm: 1 } },
  { key: "scribe", text: "一名書吏認出你手上的札記格式，提醒你把來源寫清楚。", effects: { composure: 1 }, dev: { traceability: 2 } },
  { key: "quiet", text: "短暫安靜讓你重新整理人物關係。", effects: { composure: 2, fatigue: -1 }, dev: { tms: 1 } }
];

const routeCycle = [
  { title: "南京潮聲", location: "南京", item: "南京札記", note: "南京線索連到北路與南市。" },
  { title: "崑崙山腳", location: "崑崙", item: "崑崙殘信", note: "楚服與楚璃詩為同一 PC。" },
  { title: "銀川孤城", location: "銀川", item: "銀川關卡令", note: "銀川線可追魏無紛與北方軍務。" },
  { title: "南陽暗線", location: "南陽", item: "南陽路引", note: "南陽線可接祈禍與陽月路線。" },
  { title: "五毒山門", location: "五毒山腳", item: "五毒藥箋", note: "花瓊瑤對應 Player 佐拉。" },
  { title: "魏無忌案卷", location: "案卷房", item: "魏無忌案卷摘記", note: "案卷可接洛道與後續審訊。" }
];

function ch(text, to, kind, effects, dev, extra) {
  return Object.assign({ text, to, kind, effects: effects || {}, dev: dev || {} }, extra || {});
}

const passages = {
  Gate: {
    code: "SCN-GAME-001", title: "南京城門", time: "卯時", location: "南京", tags: ["hub", "town"],
    text: [
      "雨才停。南京城門外的石道帶著水光，驛卒牽馬穿過人群，文書被油紙裹得嚴實。",
      "{{name}}站在門洞陰影下。北境兵事、崑崙舊路、南陽商旅與案卷房傳言同時湧入。",
      "這裡是主樞紐。你可以像 DoL 的城鎮頁一樣反覆調查、工作、購物、休息與回到資料庫札記。"
    ],
    choices: [
      ch("往驛站查看北方文書", "Relay", "action", { spirit: -2, fatigue: 2 }, { smm: 1, tms: 2, traceability: 4 }, { skill: "archive", dc: 7, item: "驛站木牌" }),
      ch("到茶棚打聽南京流言", "Tea", "question", { coin: -1, suspicion: 1, hunger: 2 }, { smm: 2, tms: 1, traceability: 2 }, { skill: "inquiry", dc: 6, note: "茶棚有人提到銀川。" }),
      ch("沿秦淮河找南方商旅", "River", "action", { spirit: -1, fatigue: 3 }, { smm: 1, tms: 3, traceability: 2 }, { skill: "travel", dc: 6 }),
      ch("去南市買補給", "Market", "action", { fatigue: 1 }, { tms: 1 }),
      ch("找短工換錢", "Work", "action", { spirit: -3, fatigue: 8, hunger: 6, coin: 4 }, { tms: 1 }, { note: "短工讓角色獲得行動資源。" }),
      ch("打開資料庫札記", "Codex", "retrieval", { composure: 1 }, { smm: 2, tms: 2, traceability: 4 })
    ]
  },
  Relay: {
    code: "SCN-GAME-002", title: "驛站文書", time: "辰時", location: "南京驛站", tags: ["archive", "north"],
    text: ["驛站裡混著墨、馬汗與濕木的氣味。牆上掛著北路牌子，銀川與崑崙被朱筆圈出。", "一名驛卒把文袋壓到櫃下。你聽見他說：北方消息不能亂傳。", "文袋角落露出半行字：突厥，關卡，魏無紛。"],
    choices: [
      ch("記下魏無紛與關卡線索", "NorthRoad", "summary", { composure: 2, suspicion: 1 }, { smm: 2, tms: 2, traceability: 5 }, { skill: "archive", dc: 8, item: "魏無紛關卡線索", flag: "weifen_lead" }),
      ch("向驛卒表明你要尋人", "Yamen", "negotiation", { spirit: -2, suspicion: 2 }, { smm: 2, tms: 1, traceability: 3 }, { skill: "influence", dc: 9 }),
      ch("偷抄文袋封口編號", "Archive", "action", { suspicion: 3, fatigue: 2 }, { traceability: 6 }, { skill: "archive", dc: 11, item: "文袋封口編號", flag: "sealed_id" }),
      ch("退回南京城門", "Gate", "action", { composure: 1 }, { traceability: 1 })
    ]
  },
  Tea: {
    code: "SCN-GAME-003", title: "城門茶棚", time: "辰時", location: "南京城門外", tags: ["rumour", "pc"],
    text: ["茶棚搭在城牆陰影邊。茶博士把粗碗推到你面前。", "北方有兩種消息：官道談突厥才退；江湖人談崑崙山腳有人帶傷回銀川。", "旁桌旅人提到楚服、花瓊瑤與陽月。"],
    choices: [
      ch("追問楚服與花瓊瑤", "Kunlun", "question", { coin: -1, composure: -1 }, { smm: 3, tms: 2, traceability: 4 }, { skill: "inquiry", dc: 7, note: "楚服與楚璃詩需合併成同一 PC。", flag: "pc_alias" }),
      ch("記下陽月線的南陽傳聞", "South", "summary", { spirit: 1, suspicion: 1 }, { smm: 2, tms: 2, traceability: 4 }, { item: "南陽傳聞", flag: "yangyue_south" }),
      ch("請茶博士畫出消息來源", "Codex", "retrieval", { coin: -2, composure: 1 }, { smm: 4, tms: 3, traceability: 5 }, { skill: "inquiry", dc: 10, item: "消息來源圖" }),
      ch("回城門", "Gate", "action", { fatigue: 1 }, { traceability: 1 })
    ]
  },
  River: {
    code: "SCN-GAME-004", title: "秦淮河埠", time: "巳時", location: "秦淮河埠", tags: ["south", "trade"],
    text: ["河埠邊堆著南來貨箱。商旅躲在蓬下曬帳冊，船夫在水邊罵天色。", "有人提到南陽奴隸、商會與一位不該被牽出的舊人。", "一艘小船正要北上。船主問你是否上船。"],
    choices: [
      ch("向船主問南陽路線", "South", "question", { coin: -2, spirit: -1 }, { smm: 2, tms: 3, traceability: 4 }, { skill: "inquiry", dc: 8, item: "南陽路引" }),
      ch("幫船夫搬貨換錢", "Work", "action", { coin: 3, fatigue: 7, hunger: 5 }, { tms: 1 }, { note: "搬貨取得旅費。" }),
      ch("在河埠等官署差人", "Yamen", "action", { composure: 1, suspicion: 1 }, { smm: 1, tms: 1, traceability: 3 }),
      ch("回城門", "Gate", "action", { spirit: -1 }, { traceability: 1 })
    ]
  },
  Kunlun: {
    code: "SCN-GAME-005", title: "崑崙舊聲", time: "午時", location: "南京茶棚", tags: ["pc", "kunlun"],
    text: ["從崑崙山腳傳回的話很亂。有人重傷，有人沉默，有人把一封信藏進袖中。", "楚服與楚璃詩是同一人的兩個名字；花瓊瑤的名字總和傷勢、救治與五毒舊事放在一起。", "你把這些名字寫在紙背。墨跡很快被潮氣暈開。"],
    choices: [
      ch("把名字對照寫進行囊札記", "Night", "summary", { composure: 2 }, { smm: 5, tms: 4, traceability: 6 }, { item: "PC 名字對照", flag: "pc_crosswalk" }),
      ch("追銀川路線", "NorthRoad", "decision", { spirit: -2, suspicion: 1 }, { smm: 2, tms: 2, traceability: 4 }),
      ch("改查南陽與五毒", "South", "decision", { composure: -1 }, { smm: 2, tms: 3, traceability: 4 })
    ]
  },
  South: {
    code: "SCN-GAME-006", title: "南陽線索", time: "未時", location: "南京南市", tags: ["south", "poison"],
    text: ["南市布棚底下，一名商旅說南陽近來不平。奴隸、商會、江夏與南部叛亂的傳聞像被人故意拆散。", "他提到五毒山腳，又提到葛氏與葛初秋。", "若現在把這條線收下，之後能通往陽月路線。"],
    choices: [
      ch("收下南陽路引", "Night", "decision", { coin: -2, spirit: 1 }, { smm: 3, tms: 4, traceability: 5 }, { item: "南陽路引", flag: "south_pass" }),
      ch("追問葛氏與五毒", "Yamen", "question", { suspicion: 2, composure: -1 }, { smm: 2, tms: 3, traceability: 4 }, { skill: "inquiry", dc: 9, note: "五毒與葛氏可接祈禍篇。" }),
      ch("回茶棚整理人物名", "Kunlun", "summary", { composure: 1 }, { smm: 2, tms: 2, traceability: 3 }),
      ch("去南市採買", "Market", "action", { fatigue: 1 }, { tms: 1 })
    ]
  },
  NorthRoad: {
    code: "SCN-GAME-007", title: "北路牌", time: "申時", location: "南京北街", tags: ["north", "silver"],
    text: ["北街立著往銀川方向的路牌。雨水從木牌裂縫滴下。", "你已知道幾個詞：突厥、關卡、魏無紛、崑崙、銀川。", "差人從街口走過，似乎正在尋找打聽北方消息的人。"],
    choices: [
      ch("避開差人，入夜再寫札記", "Night", "action", { spirit: -1, suspicion: -1 }, { smm: 2, tms: 2, traceability: 5 }, { item: "北路牌拓記" }),
      ch("跟差人去官署說明", "Yamen", "negotiation", { suspicion: 3, composure: 2 }, { smm: 2, tms: 2, traceability: 4 }, { skill: "influence", dc: 8 }),
      ch("轉去南市查另一條線", "South", "decision", { spirit: -1 }, { smm: 1, tms: 3, traceability: 3 }),
      ch("回南京城門", "Gate", "action", { fatigue: 1 }, { traceability: 1 })
    ]
  },
  Yamen: {
    code: "SCN-GAME-008", title: "舊案卷房", time: "酉時", location: "南京官署", tags: ["office", "archive"],
    text: ["官署後院的案卷房沒有點太多燈。書吏問你從哪裡聽到這些名字。", "封條上寫著魏無忌、公孫、李暮辰。", "書吏沒有趕你走，只說天黑前只能查一份。"],
    choices: [
      ch("查魏無忌案卷", "Dossier", "decision", { composure: 1, suspicion: 2 }, { smm: 2, tms: 2, traceability: 6 }, { skill: "archive", dc: 10, item: "魏無忌案卷摘記" }),
      ch("查崑崙與銀川往來", "NorthRoad", "question", { spirit: -1 }, { smm: 2, tms: 2, traceability: 5 }, { req: { item: "魏無紛關卡線索" } }),
      ch("查南陽商會舊案", "South", "question", { suspicion: 1 }, { smm: 2, tms: 3, traceability: 5 }),
      ch("回南京城門", "Gate", "action", { fatigue: 1 }, { traceability: 1 })
    ]
  },
  Dossier: {
    code: "SCN-GAME-009", title: "魏無忌案卷", time: "酉時末", location: "南京官署", tags: ["dossier", "politics"],
    text: ["案卷紙面很乾，像被反覆翻過。魏無忌、公孫南平、公孫蒿、李暮辰與北垣被寫在不同頁上。", "你看不完全部，只能把可連回正史足跡的名字抄下。", "這份摘記會在後續劇情裡打開更多路線。"],
    choices: [
      ch("把案卷藏入行囊", "Night", "action", { suspicion: 2, composure: 1 }, { smm: 3, tms: 3, traceability: 6 }, { item: "魏無忌案卷摘記", flag: "wuji_dossier" }),
      ch("交還案卷，保留名字", "Night", "summary", { suspicion: -1, composure: 2 }, { smm: 2, tms: 2, traceability: 5 }, { note: "你記住公孫蒿與北垣。" }),
      ch("回北街確認銀川線", "NorthRoad", "decision", { spirit: -1 }, { smm: 2, tms: 2, traceability: 4 })
    ]
  },
  Market: {
    code: "SCN-GAME-010", title: "南市攤棚", time: "午後", location: "南京南市", tags: ["shop", "loop"],
    text: ["南市攤棚挨著攤棚。紙、糧、地圖與消息都能買到，只是價格不同。", "這裡是可重複商店迴圈。物品會進入側欄，也會保留在 JSON 匯出。", "你要買什麼？"],
    choices: [
      ch("買油紙與炭筆", "Market", "purchase", { coin: -2, composure: 1 }, { traceability: 3 }, { item: "油紙炭筆", req: { coin: 2 }, note: "記錄工具提升決策追溯。" }),
      ch("買乾糧", "Market", "purchase", { coin: -1, hunger: -12, spirit: 1 }, { tms: 1 }, { item: "乾糧", req: { coin: 1 }, note: "補給能延長調查。" }),
      ch("買南京小圖", "Market", "purchase", { coin: -3 }, { smm: 3, traceability: 2 }, { item: "南京小圖", req: { coin: 3 }, note: "地點共識被更新。" }),
      ch("離開南市", "Gate", "action", { fatigue: 1 }, { traceability: 1 })
    ]
  },
  Work: {
    code: "SCN-GAME-011", title: "短工與耳語", time: "午後", location: "南京街市", tags: ["work", "resource"],
    text: ["你接下一段短工，把貨箱搬過半條街。手臂發酸，但你得到幾枚錢，也聽見一段新耳語。", "短工迴圈讓角色在調查與生存資源之間取捨。疲勞與飢餓過高會壓低檢定。", "街尾仍有人在談北方關卡。"],
    choices: [
      ch("繼續做短工", "Work", "action", { coin: 4, fatigue: 10, hunger: 8, spirit: -2 }, { tms: 1 }, { note: "資源增加，但身體負荷上升。" }),
      ch("用耳語換一條線索", "Tea", "negotiation", { coin: -1, suspicion: 1 }, { smm: 2, traceability: 2 }, { skill: "influence", dc: 7 }),
      ch("回城門", "Gate", "action", { fatigue: 1 }, { traceability: 1 })
    ]
  },
  Archive: {
    code: "SCN-GAME-012", title: "封口編號", time: "午後", location: "南京驛站", tags: ["trace", "data"],
    text: ["封口編號可以把消息接回文袋來源。這種小資料能讓後續訪談、逐字稿與決策記錄有共同索引。", "你把編號抄下，又補上時間、地點、來源與疑點。", "這是資料庫介入的核心：讓敘事不只被記得，也能被查回。"],
    choices: [
      ch("整理成資料庫札記", "Codex", "summary", { composure: 2 }, { smm: 3, tms: 4, traceability: 8 }, { item: "來源索引卡", flag: "source_index" }),
      ch("回驛站", "Relay", "action", { suspicion: 1 }, { traceability: 1 })
    ]
  },
  Codex: {
    code: "SCN-GAME-013", title: "資料庫札記", time: "整理時", location: "客舍桌前", tags: ["database", "SMM", "TMS"],
    text: ["桌上有三疊紙：人物對照、地點索引、決策理由。每一疊都對應 SQL Server 匯入欄位。", "目前取得的物品與紀錄會在左欄顯示。開發者面板可匯出 utterance、scene、decision 與事件。", "這一頁模擬 DoL 式資訊面板，但資料結構保留研究用途。"],
    choices: [
      ch("回夜宿札記", "Night", "retrieval", { composure: 2 }, { smm: 3, tms: 3, traceability: 5 }),
      ch("回南京城門", "Gate", "action", {}, { traceability: 1 }),
      ch("依人物對照追崑崙線", "Kunlun", "retrieval", { spirit: -1 }, { smm: 4, tms: 2, traceability: 5 }, { req: { item: "PC 名字對照" } })
    ]
  },
  Night: {
    code: "SCN-GAME-014", title: "夜宿札記", time: "亥時", location: "南京客舍", tags: ["rest", "route"],
    text: ["夜裡，客舍窗紙被風吹得發響。{{name}}把白日收來的名字、路線與案卷放在桌上。", "南京只是開局。崑崙、銀川、五毒、南陽與雙孤單人線，都會從這些札記裡展開。", "你可以休息、保存，或讓札記生成較長的可匯出劇情軌跡。"],
    choices: [
      ch("休息到天明", "Gate", "rest", { spirit: 18, composure: 8, fatigue: -35, hunger: 12, suspicion: -1 }, { smm: 1, tms: 1, traceability: 2 }, { note: "休息降低疲勞，但飢餓上升。" }),
      ch("下一日往北路追銀川", "NorthRoad", "decision", { spirit: -2, composure: 2 }, { smm: 3, tms: 3, traceability: 5 }),
      ch("下一日查南陽與五毒", "South", "decision", { spirit: -1, composure: 1 }, { smm: 3, tms: 4, traceability: 5 }),
      ch("生成二十四輪札記", "AutoEnd", "summary", { composure: 2 }, { smm: 6, tms: 6, traceability: 8 }, { autoRun: true }),
      ch("手動進入下一輪札記", "Auto-1", "decision", { spirit: -1, composure: 2 }, { smm: 3, tms: 3, traceability: 5 })
    ]
  }
};

const defaultState = {
  started: false, passage: "Gate", turnNo: 1, day: 1, hour: 6,
  player: { name: "旅人", player_code: "PLAYER-LOCAL", member_code: "TM-LOCAL", character_code: "PC-LOCAL", textStyle: "standard" },
  stats: { spirit: 50, composure: 50, coin: 12, suspicion: 0, fatigue: 0, hunger: 0 },
  skills: { inquiry: 1, archive: 1, influence: 1, travel: 1 },
  dev: { smm: 50, tms: 50, traceability: 50 },
  items: ["素布行囊"], notes: ["大興二十年八月，南京。"], flags: {}, utterances: [], events: [],
  auto: { generated: 0, limit: 24, completed: false }, lastEvent: "",
  options: { numberedLinks: true, randomEvents: true }
};

let state = loadState();
const $ = (id) => document.getElementById(id);

$("startForm").addEventListener("submit", startGame);
$("closeOverlay").addEventListener("click", closeOverlay);
document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleAction(button.dataset.action)));
document.addEventListener("keyup", handleHotkey);
render();

function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? mergeState(clone(defaultState), JSON.parse(raw)) : clone(defaultState); } catch { return clone(defaultState); } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function mergeState(base, incoming) { const n = Object.assign({}, base, incoming || {}); ["player", "stats", "skills", "dev", "auto", "options", "flags"].forEach((k) => { n[k] = Object.assign({}, base[k], incoming && incoming[k] ? incoming[k] : {}); }); ["items", "notes", "utterances", "events"].forEach((k) => { n[k] = Array.isArray(n[k]) ? n[k] : base[k].slice(); }); return n; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function esc(value) { return String(value == null ? "" : value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); }
function addUnique(list, value) { if (value && !list.includes(value)) list.unshift(value); }
function addNote(note) { if (note) { state.notes.unshift(note); state.notes = state.notes.slice(0, 30); } }
function applyVars(line) { return String(line).replaceAll("{{name}}", state.player.name); }
function formatClock() { return `${String(state.hour).padStart(2, "0")}:00`; }

function startGame(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state = mergeState(clone(defaultState), { started: true, player: { name: String(form.get("playerName") || "旅人").trim().slice(0, 16) || "旅人", textStyle: String(form.get("textStyle") || "standard") } });
  recordUtterance("system", "開始遊戲", getPassage(), "setup", "none");
  saveState();
  render();
}

function render() {
  document.body.dataset.textStyle = state.player.textStyle || "standard";
  $("startPanel").hidden = !!state.started;
  $("playPanel").hidden = !state.started;
  if (state.started) renderPassage();
  renderSidebar();
}

function renderPassage() {
  const p = getPassage();
  $("passageTitle").textContent = p.title;
  $("passageMeta").textContent = `${p.time} / ${p.location} / 第 ${state.turnNo} 回合 / ${formatClock()}`;
  $("passageText").innerHTML = p.text.map((line) => `<p>${esc(applyVars(line))}</p>`).join("") + (state.lastEvent ? `<p class="system-line">${esc(state.lastEvent)}</p>` : "");
  $("choiceList").innerHTML = p.choices.map((choice, index) => renderChoice(choice, index)).join("");
  $("choiceList").querySelectorAll("button[data-choice]").forEach((button) => button.addEventListener("click", () => choose(Number(button.dataset.choice))));
  $("passageFooter").innerHTML = `<span>Engine ${esc(ENGINE_VERSION)}</span><span class="footer-tags">${(p.tags || []).map((tag) => `<b>${esc(tag)}</b>`).join(" ")}</span>`;
}

function renderChoice(choice, index) { const locked = !canChoose(choice); const prefix = state.options.numberedLinks ? `${index + 1}. ` : ""; const meta = choice.skill ? ` <span class="choice-meta">[${esc(labels.skills[choice.skill])} ${choice.dc || 6}]</span>` : ""; const reason = locked ? `<span class="choice-lock">${esc(lockReason(choice))}</span>` : ""; return `<button type="button" class="link-internal${locked ? " link-disabled" : ""}" data-choice="${index}" ${locked ? "disabled" : ""}>${esc(prefix + choice.text)}${meta}${reason}</button>`; }
function renderSidebar() { const p = getPassage(); $("characterBox").innerHTML = `<p><strong>${esc(state.player.name)}</strong></p><p>地點：${esc(p.location)}</p><p>第 ${state.day} 日，${formatClock()}</p><p>風格：${esc(labels.styles[state.player.textStyle] || "標準")}</p>`; $("statusBox").innerHTML = ["spirit", "composure", "suspicion", "fatigue", "hunger"].map((key) => statMeter(labels.stats[key], state.stats[key], key)).join("") + `<div class="wallet">錢：${esc(state.stats.coin)}</div><div class="skill-grid">${Object.keys(labels.skills).map((key) => `<span>${esc(labels.skills[key])} ${esc(state.skills[key])}</span>`).join("")}</div>`; $("itemBox").innerHTML = state.items.slice(0, 9).map((item) => `<p><strong>${esc(item)}</strong></p>`).join("") || "<p>無</p>"; $("noteBox").innerHTML = state.notes.slice(0, 9).map((note) => `<p>${esc(note)}</p>`).join("") || "<p>無</p>"; }
function statMeter(label, value, key) { const number = clamp(Number(value || 0), 0, 100); const color = key === "suspicion" ? "red" : key === "fatigue" || key === "hunger" ? "gold" : key === "spirit" ? "blue" : "green"; return `<div class="stat-name"><span>${esc(label)}</span><span>${number}</span></div><div class="meter ${color}"><span style="width:${number}%"></span></div>`; }

function canChoose(choice) { if (!choice.req) return true; if (choice.req.item && !state.items.includes(choice.req.item)) return false; if (choice.req.flag && !state.flags[choice.req.flag]) return false; if (choice.req.coin && state.stats.coin < choice.req.coin) return false; return true; }
function lockReason(choice) { if (!choice.req) return ""; if (choice.req.item) return ` 需物品：${choice.req.item}`; if (choice.req.flag) return ` 需旗標：${choice.req.flag}`; if (choice.req.coin) return ` 需錢：${choice.req.coin}`; return " 條件不足"; }
function choose(index) { const p = getPassage(); const choice = p.choices[index]; if (!choice || !canChoose(choice)) return; const outcome = resolveChoice(choice); state.events.push({ turn_no: state.turnNo, scene_code: p.code, scene_title: p.title, choice_text: choice.text, to_scene: choice.to, outcome, created_at: new Date().toISOString() }); recordUtterance(choice.kind || "decision", choice.text, p, "choice", outcome); applyChoice(choice, outcome); if (choice.autoRun) runAutoLoops(); state.passage = choice.to; state.turnNo += 1; advanceTime(choice.kind); maybeRandomEvent(); saveState(); render(); }
function resolveChoice(choice) { if (!choice.skill) return "none"; const burden = Math.floor((state.stats.fatigue + state.stats.hunger + state.stats.suspicion) / 35); const score = 5 + (state.skills[choice.skill] || 0) * 2 + Math.floor(state.dev.traceability / 25) - burden; const success = score >= (choice.dc || 6); if (success) { state.skills[choice.skill] = clamp((state.skills[choice.skill] || 0) + 1, 0, 9); applyDev({ smm: 1, tms: 1, traceability: 1 }); return "success"; } applyEffects({ composure: -2, suspicion: 1 }); return "partial"; }
function applyChoice(choice, outcome) { applyEffects(choice.effects); applyDev(choice.dev); if (choice.item) addUnique(state.items, choice.item); if (choice.note) addNote(choice.note); if (choice.flag) state.flags[choice.flag] = true; if (outcome === "success") addNote(`檢定成功：${choice.text}`); if (outcome === "partial") addNote(`檢定僅部分成功：${choice.text}`); }
function applyEffects(effects) { Object.keys(effects || {}).forEach((key) => { state.stats[key] = clamp(Number(state.stats[key] || 0) + Number(effects[key] || 0), key === "coin" ? -99 : 0, key === "coin" ? 999 : 100); }); }
function applyDev(dev) { Object.keys(dev || {}).forEach((key) => { state.dev[key] = clamp(Number(state.dev[key] || 0) + Number(dev[key] || 0), 0, 100); }); }
function advanceTime(kind) { const delta = kind === "rest" ? 8 : kind === "purchase" ? 1 : 2; state.hour += delta; if (state.hour >= 24) { state.hour -= 24; state.day += 1; } if (kind !== "rest") applyEffects({ hunger: 1, fatigue: 1 }); }
function maybeRandomEvent() { state.lastEvent = ""; if (!state.options.randomEvents || state.turnNo % 3 !== 0) return; const event = randomEvents[state.turnNo % randomEvents.length]; state.lastEvent = event.text; applyEffects(event.effects); applyDev(event.dev); state.events.push({ turn_no: state.turnNo, scene_code: "RANDOM", scene_title: event.key, choice_text: event.text, to_scene: state.passage, created_at: new Date().toISOString() }); }
function runAutoLoops() { for (let i = state.auto.generated + 1; i <= state.auto.limit; i += 1) { const seed = routeCycle[(i - 1) % routeCycle.length]; addUnique(state.items, seed.item); addNote(`第${i}輪：${seed.note}`); applyDev({ smm: 2, tms: 2, traceability: 4 }); applyEffects({ fatigue: 1, hunger: 1, composure: 1 }); state.events.push({ turn_no: state.turnNo + i, scene_code: `SCN-AUTO-${String(i).padStart(3, "0")}`, scene_title: `第${i}輪：${seed.title}`, choice_text: `整理${seed.location}線索`, to_scene: "AutoEnd", auto_loop_no: i, created_at: new Date().toISOString() }); recordUtterance("summary", `整理${seed.location}線索：${seed.note}`, { code: `SCN-AUTO-${String(i).padStart(3, "0")}`, title: `第${i}輪：${seed.title}`, location: seed.location }, "auto_loop", "success"); state.auto.generated = i; } state.auto.completed = true; }
function makeAutoPassage(loopNo) { const seed = routeCycle[(loopNo - 1) % routeCycle.length]; const next = loopNo >= state.auto.limit ? "AutoEnd" : `Auto-${loopNo + 1}`; return { code: `SCN-AUTO-${String(loopNo).padStart(3, "0")}`, title: `第${loopNo}輪：${seed.title}`, time: `第${loopNo}輪`, location: seed.location, tags: ["auto", "route"], text: [`${seed.location}的線索被重新抄入札記。`, `${state.player.name}把人物、地點、時間與來源排成同一列。`, `這是第 ${loopNo} 輪長線延伸，會留下 scene、event 與 utterance。`], choices: [ch(`整理${seed.title}`, next, "summary", { composure: 1, fatigue: 1 }, { smm: 2, tms: 2, traceability: 4 }, { item: seed.item, note: seed.note }), ch("暫停輪迴，回夜宿札記", "Night", "decision", { composure: 1 }, { traceability: 2 })] }; }
function makeAutoEnd() { return { code: "SCN-AUTO-END", title: "長線札記收束", time: "長線收束", location: "南京客舍", tags: ["export", "end"], text: [`${state.player.name}把長線札記疊在桌上。`, `目前已生成 ${state.auto.generated}/${state.auto.limit} 輪自動劇情。`, "可繼續遊玩，也可打開開發者面板匯出 JSON。"], choices: [ch("回南京城門重新入局", "Gate", "decision", { spirit: 2, composure: 2 }, { smm: 1, tms: 1, traceability: 2 }), ch("回夜宿札記", "Night", "summary", { composure: 2 }, { traceability: 2 }), ch("從第一輪手動重走", "Auto-1", "decision", { spirit: -1 }, { traceability: 2 })] }; }
function getPassage() { if (state.passage === "AutoEnd") return makeAutoEnd(); const match = /^Auto-(\d+)$/.exec(state.passage || ""); if (match) return makeAutoPassage(clamp(Number(match[1]), 1, state.auto.limit)); return passages[state.passage] || passages.Gate; }
function recordUtterance(kind, text, scene, source, outcome) { state.utterances.push({ session_code: corpusConfig.session_code, turn_no: state.turnNo, speaker_type: source === "system" ? "SYSTEM" : "PC", speaker_label_raw: source === "system" ? "system" : state.player.name, utterance_text: text, utterance_function: kind, scene_code: scene.code, scene_title: scene.title, location: scene.location, source, outcome: outcome || "none", smm_score: state.dev.smm, tms_score: state.dev.tms, traceability_score: state.dev.traceability, created_at: new Date().toISOString() }); }

function handleAction(action) { if (action === "save") { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); openOverlay("保存", "<p>已保存到瀏覽器 localStorage。</p>"); } if (action === "load") loadManualSave(); if (action === "settings") openSettings(); if (action === "restart") restartGame(); if (action === "developer") openDeveloper(); }
function loadManualSave() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) { openOverlay("載入", "<p>尚無手動保存。</p>"); return; } state = mergeState(clone(defaultState), JSON.parse(raw)); saveState(); render(); openOverlay("載入", "<p>已載入手動保存。</p>"); } catch (error) { openOverlay("載入失敗", `<pre>${esc(error.message)}</pre>`); } }
function restartGame() { localStorage.removeItem(STORAGE_KEY); state = clone(defaultState); render(); }
function openSettings() { openOverlay("設定", `<div class="settings-grid"><label>文字外觀<select id="settingTextStyle">${Object.keys(labels.styles).map((key) => `<option value="${key}" ${state.player.textStyle === key ? "selected" : ""}>${labels.styles[key]}</option>`).join("")}</select></label><label class="checkline"><input type="checkbox" id="settingNumbered" ${state.options.numberedLinks ? "checked" : ""}> 選項編號</label><label class="checkline"><input type="checkbox" id="settingRandom" ${state.options.randomEvents ? "checked" : ""}> 隨機街頭事件</label></div><p><button type="button" id="applySettings">套用</button></p>`); $("applySettings").addEventListener("click", () => { state.player.textStyle = $("settingTextStyle").value; state.options.numberedLinks = $("settingNumbered").checked; state.options.randomEvents = $("settingRandom").checked; saveState(); closeOverlay(); render(); }); }
function openDeveloper() { const data = buildCorpus(); openOverlay("開發者 / TRPG Corpus", `<div class="dev-grid"><p><strong>Engine</strong><span>${ENGINE_VERSION}</span></p><p><strong>Utterance</strong><span>${state.utterances.length}</span></p><p><strong>Events</strong><span>${state.events.length}</span></p><p><strong>SMM</strong><span>${state.dev.smm}</span></p><p><strong>TMS</strong><span>${state.dev.tms}</span></p><p><strong>追溯</strong><span>${state.dev.traceability}</span></p></div><div class="developer-actions"><button id="copyJson" type="button">複製 JSON</button><button id="downloadJson" type="button">下載 JSON</button></div><details open><summary>輸出預覽</summary><pre>${esc(JSON.stringify(data, null, 2))}</pre></details>`); $("copyJson").addEventListener("click", () => navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(data, null, 2))); $("downloadJson").addEventListener("click", () => downloadJson(data)); }
function buildCorpus() { const scenes = Object.keys(passages).map((key, index) => sceneRow(passages[key], index + 1)).concat(Array.from({ length: state.auto.limit }, (_, i) => sceneRow(makeAutoPassage(i + 1), Object.keys(passages).length + i + 1))).concat([sceneRow(makeAutoEnd(), 999)]); return { metadata: { export_format: "da_go_corpus_rpg_json_v1", engine_version: ENGINE_VERSION, database_name: corpusConfig.database_name, session_code: corpusConfig.session_code, exported_at: new Date().toISOString() }, dbo_Scene: scenes, stg_Utterance_Import: state.utterances.map((u, i) => ({ import_batch_code: corpusConfig.import_batch_code, row_no: i + 1, session_code: corpusConfig.session_code, turn_no: u.turn_no, speaker_label_raw: u.speaker_label_raw, speaker_type: u.speaker_type, utterance_text: u.utterance_text, utterance_function: u.utterance_function, scene_code: u.scene_code })), dbo_Decision_Log: state.events.map((e, i) => ({ decision_code: `DEC-${String(i + 1).padStart(4, "0")}`, session_code: corpusConfig.session_code, turn_no: e.turn_no, scene_code: e.scene_code, decision_text: e.choice_text, decision_outcome: e.outcome || "none", next_scene_code: e.to_scene })), raw_game_events: state.events, game_state: state }; }
function sceneRow(scene, sceneNo) { return { session_code: corpusConfig.session_code, scene_code: scene.code, scene_no: sceneNo, scene_title: scene.title, scene_type: scene.code.indexOf("SCN-AUTO") === 0 ? "auto_loop" : "play", scene_summary_raw: (scene.text || []).join("\n"), scene_status: "draft" }; }
function downloadJson(data) { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `da_go_${corpusConfig.session_code}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function openOverlay(title, html) { $("overlayTitle").textContent = title; $("overlayContent").innerHTML = html; $("overlayBackdrop").classList.remove("hidden"); }
function closeOverlay() { $("overlayBackdrop").classList.add("hidden"); }
function handleHotkey(event) { if (!state.started) return; if (event.key === "Escape") { closeOverlay(); return; } const number = Number(event.key); if (Number.isInteger(number) && number >= 1 && number <= 9 && getPassage().choices[number - 1]) choose(number - 1); }
