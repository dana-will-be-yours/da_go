const STORAGE_KEY = "daGoCorpusRpgStateV2";
const SAVE_KEY = "daGoCorpusRpgManualSaveV2";
const MANIFEST_KEY = "daGoCorpusWorldManifestV1";
const ENGINE_VERSION = "0.9.0-corpus-roundtrip";

const VALID_UTTERANCE_FUNCTIONS = new Set([
  "narration",
  "dialogue",
  "action",
  "rule_check",
  "decision",
  "negotiation",
  "question",
  "clarification",
  "conflict",
  "summary"
]);

const kindMap = { setup: "summary", purchase: "action", retrieval: "summary", rest: "action", auto_loop: "summary" };

let corpusConfig = {
  database_name: "TRPG_Corpus_DB",
  project_code: "DAGUO",
  team_code: "DAGUO-T01",
  session_code: "DA20-CORPUS-RPG-001",
  import_batch_code: "DAGUO_DAGO_PLAYLOG_001",
  gm_code: "TM-GM",
  researcher_code: "TM-RESEARCHER"
};

const labels = {
  stats: { spirit: "精神", composure: "鎮定", suspicion: "疑心", fatigue: "疲勞", hunger: "飢餓", coin: "錢" },
  skills: { inquiry: "探問", archive: "案卷", influence: "交涉", travel: "行路" },
  styles: { standard: "標準", scroll: "書卷", night: "夜讀", large: "大字" }
};

const fallbackRandomEvents = [
  { key: "rain", text: "細雨重新落下，街上腳印變得難以辨認。", effects: { fatigue: 2 }, dev: { traceability: 1 } },
  { key: "rumour", text: "有人在巷口提到銀川關卡，隨即閉口。", effects: { suspicion: 1 }, dev: { smm: 1 } },
  { key: "scribe", text: "一名書吏認出你手上的札記格式，請你補上來源。", effects: { composure: 1 }, dev: { traceability: 2 } },
  { key: "quiet", text: "短暫安靜讓你重新整理人物關係。", effects: { composure: 2, fatigue: -1 }, dev: { tms: 1 } }
];

const fallbackRouteCycle = [
  { title: "南京潮聲", location: "南京", item: "南京札記", note: "南京線索連到北路與南市。" },
  { title: "崑崙山腳", location: "崑崙", item: "崑崙殘信", note: "楚服與楚璃詩為同一 PC 的待審候選。" },
  { title: "銀川孤城", location: "銀川", item: "銀川關卡令", note: "銀川線可追魏無紛與北方軍務。" },
  { title: "南陽暗線", location: "南陽", item: "南陽路引", note: "南陽線可接祈禍與陽月路線。" },
  { title: "五毒山門", location: "五毒山腳", item: "五毒藥箋", note: "花瓊瑤與佐拉的對應需要人工核對。" },
  { title: "魏無忌案卷", location: "案卷房", item: "魏無忌案卷摘記", note: "案卷可接洛道與後續審訊。" }
];

function ch(text, to, kind, effects, dev, extra) {
  return Object.assign({ text, to, kind, effects: effects || {}, dev: dev || {} }, extra || {});
}

const fallbackPassages = {
  Gate: {
    code: "SCN-GAME-001", title: "南京城門", time: "卯時", location: "南京", tags: ["hub", "town"],
    text: [
      "雨才停。南京城門外的石道帶著水光，驛卒牽馬穿過人群，文書被油紙裹得嚴實。",
      "{{name}}站在門洞陰影下。北境兵事、崑崙舊路、南陽商旅與案卷房傳言同時湧入。",
      "這裡是主樞紐。你可以反覆調查、工作、購物、休息與回到資料庫札記。"
    ],
    choices: [
      ch("往驛站查看北方文書", "Relay", "action", { spirit: -2, fatigue: 2 }, { smm: 1, tms: 2, traceability: 4 }, { skill: "archive", dc: 7, item: "驛站木牌" }),
      ch("到茶棚打聽南京流言", "Tea", "question", { coin: -1, suspicion: 1, hunger: 2 }, { smm: 2, tms: 1, traceability: 2 }, { skill: "inquiry", dc: 6, note: "茶棚有人提到銀川。" }),
      ch("沿秦淮河找南方商旅", "River", "action", { spirit: -1, fatigue: 3 }, { smm: 1, tms: 3, traceability: 2 }, { skill: "travel", dc: 6 }),
      ch("去南市買補給", "Market", "action", { fatigue: 1 }, { tms: 1 }),
      ch("找短工換錢", "Work", "action", { spirit: -3, fatigue: 8, hunger: 6, coin: 4 }, { tms: 1 }, { note: "短工讓角色獲得行動資源。" }),
      ch("打開資料庫札記", "Codex", "summary", { composure: 1 }, { smm: 2, tms: 2, traceability: 4 })
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
      ch("追問楚服與花瓊瑤", "Kunlun", "question", { coin: -1, composure: -1 }, { smm: 3, tms: 2, traceability: 4 }, { skill: "inquiry", dc: 7, note: "楚服與楚璃詩需合併成同一 PC 的候選。", flag: "pc_alias" }),
      ch("記下陽月線的南陽傳聞", "South", "summary", { spirit: 1, suspicion: 1 }, { smm: 2, tms: 2, traceability: 4 }, { item: "南陽傳聞", flag: "yangyue_south" }),
      ch("請茶博士畫出消息來源", "Codex", "summary", { coin: -2, composure: 1 }, { smm: 4, tms: 3, traceability: 5 }, { skill: "inquiry", dc: 10, item: "消息來源圖" }),
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
      ch("買油紙與炭筆", "Market", "action", { coin: -2, composure: 1 }, { traceability: 3 }, { item: "油紙炭筆", req: { coin: 2 }, note: "記錄工具提升決策追溯。" }),
      ch("買乾糧", "Market", "action", { coin: -1, hunger: -12, spirit: 1 }, { tms: 1 }, { item: "乾糧", req: { coin: 1 }, note: "補給能延長調查。" }),
      ch("買南京小圖", "Market", "action", { coin: -3 }, { smm: 3, traceability: 2 }, { item: "南京小圖", req: { coin: 3 }, note: "地點共識被更新。" }),
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
    text: ["封口編號可以把消息接回文袋來源。這種小資料能讓後續訪談、逐字稿與決策記錄有共同索引。", "你把編號抄下，又補上時間、地點、來源與疑點。", "這是資料庫介入的核心：讓敘事能被查回。"],
    choices: [
      ch("整理成資料庫札記", "Codex", "summary", { composure: 2 }, { smm: 3, tms: 4, traceability: 8 }, { item: "來源索引卡", flag: "source_index" }),
      ch("回驛站", "Relay", "action", { suspicion: 1 }, { traceability: 1 })
    ]
  },
  Codex: {
    code: "SCN-GAME-013", title: "資料庫札記", time: "整理時", location: "客舍桌前", tags: ["database", "SMM", "TMS"],
    text: ["桌上有三疊紙：人物對照、地點索引、決策理由。每一疊都對應 SQL Server 匯入欄位。", "目前取得的物品與紀錄會在左欄顯示。開發者面板可匯出 utterance、scene、decision 與事件。", "這一頁模擬資料面板，資料結構保留研究用途。"],
    choices: [
      ch("回夜宿札記", "Night", "summary", { composure: 2 }, { smm: 3, tms: 3, traceability: 5 }),
      ch("回南京城門", "Gate", "action", {}, { traceability: 1 }),
      ch("依人物對照追崑崙線", "Kunlun", "summary", { spirit: -1 }, { smm: 4, tms: 2, traceability: 5 }, { req: { item: "PC 名字對照" } })
    ]
  },
  Night: {
    code: "SCN-GAME-014", title: "夜宿札記", time: "亥時", location: "南京客舍", tags: ["rest", "route"],
    text: ["夜裡，客舍窗紙被風吹得發響。{{name}}把白日收來的名字、路線與案卷放在桌上。", "南京只是開局。崑崙、銀川、五毒、南陽與雙孤單人線，都會從這些札記裡展開。", "你可以休息、保存，或讓札記生成較長的可匯出劇情軌跡。"],
    choices: [
      ch("休息到天明", "Gate", "action", { spirit: 18, composure: 8, fatigue: -35, hunger: 12, suspicion: -1 }, { smm: 1, tms: 1, traceability: 2 }, { note: "休息降低疲勞，但飢餓上升。" }),
      ch("下一日往北路追銀川", "NorthRoad", "decision", { spirit: -2, composure: 2 }, { smm: 3, tms: 3, traceability: 5 }),
      ch("下一日查南陽與五毒", "South", "decision", { spirit: -1, composure: 1 }, { smm: 3, tms: 4, traceability: 5 }),
      ch("生成二十四輪札記", "AutoEnd", "summary", { composure: 2 }, { smm: 6, tms: 6, traceability: 8 }, { autoRun: true }),
      ch("手動進入下一輪札記", "Auto-1", "decision", { spirit: -1, composure: 2 }, { smm: 3, tms: 3, traceability: 5 })
    ]
  }
};

const defaultManifest = {
  manifest_format: "da_go_world_manifest_v1",
  metadata: {
    source: "fallback",
    source_note: "本機預設資料，等待 trpg-corpus manifest 取代。"
  },
  config: corpusConfig,
  passages: fallbackPassages,
  random_events: fallbackRandomEvents,
  route_cycle: fallbackRouteCycle,
  characters: [],
  world_settings: [],
  items: [],
  rules: []
};

let activeManifest = loadManifest();
corpusConfig = Object.assign({}, defaultManifest.config, activeManifest.config || {});
let passages = normalizePassages(activeManifest);
let randomEvents = normalizeArray(activeManifest.random_events, fallbackRandomEvents);
let routeCycle = normalizeArray(activeManifest.route_cycle, fallbackRouteCycle);

const defaultState = {
  started: false, passage: "Gate", turnNo: 0, day: 1, hour: 6,
  player: { name: "旅人", player_code: "PLAYER-LOCAL", member_code: "TM-LOCAL", character_code: "PC-LOCAL", textStyle: "standard" },
  stats: { spirit: 50, composure: 50, coin: 12, suspicion: 0, fatigue: 0, hunger: 0 },
  skills: { inquiry: 1, archive: 1, influence: 1, travel: 1 },
  dev: { smm: 50, tms: 50, traceability: 50 },
  items: ["素布行囊"], notes: ["大興二十年八月，南京。"], flags: {}, utterances: [], events: [], narrated: {},
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeState(clone(defaultState), JSON.parse(raw)) : clone(defaultState);
  } catch (error) {
    return clone(defaultState);
  }
}

function loadManifest() {
  try {
    const raw = localStorage.getItem(MANIFEST_KEY);
    const loaded = raw ? JSON.parse(raw) : defaultManifest;
    return mergeManifest(defaultManifest, loaded);
  } catch (error) {
    return clone(defaultManifest);
  }
}

function persistManifest(manifest) {
  activeManifest = mergeManifest(defaultManifest, manifest || {});
  corpusConfig = Object.assign({}, defaultManifest.config, activeManifest.config || {});
  passages = normalizePassages(activeManifest);
  randomEvents = normalizeArray(activeManifest.random_events, fallbackRandomEvents);
  routeCycle = normalizeArray(activeManifest.route_cycle, fallbackRouteCycle);
  localStorage.setItem(MANIFEST_KEY, JSON.stringify(activeManifest));
}

function mergeManifest(base, incoming) {
  const merged = Object.assign({}, base, incoming || {});
  merged.metadata = Object.assign({}, base.metadata || {}, incoming && incoming.metadata ? incoming.metadata : {});
  merged.config = Object.assign({}, base.config || {}, incoming && incoming.config ? incoming.config : {});
  return merged;
}

function normalizePassages(manifest) {
  if (manifest && manifest.passages && !Array.isArray(manifest.passages)) return manifest.passages;
  if (manifest && Array.isArray(manifest.scenes) && manifest.scenes.length > 0) {
    const output = {};
    manifest.scenes.forEach((scene, index) => {
      const key = scene.key || scene.scene_key || scene.scene_code || `Scene${index + 1}`;
      output[key] = {
        code: scene.scene_code || key,
        title: scene.scene_title || scene.title || key,
        time: scene.time || `第 ${index + 1} 場`,
        location: scene.location_name || scene.location || "",
        tags: scene.tags || ["corpus"],
        text: normalizeTextLines(scene.text || scene.scene_summary_clean || scene.scene_summary_raw || scene.scene_summary || ""),
        choices: normalizeChoices(scene.choices, key)
      };
    });
    const keys = Object.keys(output);
    keys.forEach((key, index) => {
      if (!output[key].choices.length) {
        output[key].choices.push(ch("前往下一段資料", keys[index + 1] || keys[0], "decision", {}, { traceability: 1 }));
      }
    });
    return output;
  }
  return clone(fallbackPassages);
}

function normalizeChoices(choices, currentKey) {
  if (!Array.isArray(choices)) return [];
  return choices.map((choice, index) => ch(
    choice.text || choice.choice_text || `選項 ${index + 1}`,
    choice.to || choice.next_scene_key || choice.next_scene_code || currentKey,
    normalizeFunction(choice.kind || choice.utterance_function || "decision"),
    choice.effects || {},
    choice.dev || { traceability: 1 },
    choice.extra || {}
  ));
}

function normalizeArray(value, fallback) {
  return Array.isArray(value) && value.length ? value : fallback.slice();
}

function normalizeTextLines(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function mergeState(base, incoming) {
  const n = Object.assign({}, base, incoming || {});
  ["player", "stats", "skills", "dev", "auto", "options", "flags", "narrated"].forEach((k) => { n[k] = Object.assign({}, base[k], incoming && incoming[k] ? incoming[k] : {}); });
  ["items", "notes", "utterances", "events"].forEach((k) => { n[k] = Array.isArray(n[k]) ? n[k] : base[k].slice(); });
  return n;
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function esc(value) { return String(value == null ? "" : value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); }
function addUnique(list, value) { if (value && !list.includes(value)) list.unshift(value); }
function addNote(note) { if (note) { state.notes.unshift(note); state.notes = state.notes.slice(0, 30); } }
function applyVars(line) { return String(line).replaceAll("{{name}}", state.player.name); }
function formatClock() { return `${String(state.hour).padStart(2, "0")}:00`; }
function nextTurnNo() { state.turnNo = Number(state.turnNo || 0) + 1; return state.turnNo; }
function utteranceCode(turnNo) { return `UTT-${corpusConfig.session_code}-${String(turnNo).padStart(5, "0")}`.slice(0, 80); }
function normalizeFunction(kind) { return VALID_UTTERANCE_FUNCTIONS.has(kind) ? kind : kindMap[kind] || "summary"; }

function startGame(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state = mergeState(clone(defaultState), {
    started: true,
    player: {
      name: String(form.get("playerName") || "旅人").trim().slice(0, 16) || "旅人",
      textStyle: String(form.get("textStyle") || "standard")
    }
  });
  recordUtterance("summary", "開始遊戲", getPassage(), "researcher", "none");
  recordPassageNarration(getPassage());
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
  $("passageMeta").textContent = `${p.time} / ${p.location} / 第 ${state.turnNo || 1} 回合 / ${formatClock()}`;
  $("passageText").innerHTML = p.text.map((line) => `<p>${esc(applyVars(line))}</p>`).join("") + (state.lastEvent ? `<p class="system-line">${esc(state.lastEvent)}</p>` : "");
  $("choiceList").innerHTML = p.choices.map((choice, index) => renderChoice(choice, index)).join("");
  $("choiceList").querySelectorAll("button[data-choice]").forEach((button) => button.addEventListener("click", () => choose(Number(button.dataset.choice))));
  $("passageFooter").innerHTML = `<span>Engine ${esc(ENGINE_VERSION)}</span><span class="footer-tags">${(p.tags || []).map((tag) => `<b>${esc(tag)}</b>`).join(" ")}</span>`;
}

function renderChoice(choice, index) {
  const locked = !canChoose(choice);
  const prefix = state.options.numberedLinks ? `${index + 1}. ` : "";
  const meta = choice.skill ? ` <span class="choice-meta">[${esc(labels.skills[choice.skill])} ${choice.dc || 6}]</span>` : "";
  const reason = locked ? `<span class="choice-lock">${esc(lockReason(choice))}</span>` : "";
  return `<button type="button" class="link-internal${locked ? " link-disabled" : ""}" data-choice="${index}" ${locked ? "disabled" : ""}>${esc(prefix + choice.text)}${meta}${reason}</button>`;
}

function renderSidebar() {
  const p = getPassage();
  const manifestSource = activeManifest.metadata && activeManifest.metadata.source ? activeManifest.metadata.source : "fallback";
  $("characterBox").innerHTML = `<p><strong>${esc(state.player.name)}</strong></p><p>地點：${esc(p.location)}</p><p>第 ${state.day} 日，${formatClock()}</p><p>資料：${esc(manifestSource)}</p><p>風格：${esc(labels.styles[state.player.textStyle] || "標準")}</p>`;
  $("statusBox").innerHTML = ["spirit", "composure", "suspicion", "fatigue", "hunger"].map((key) => statMeter(labels.stats[key], state.stats[key], key)).join("") + `<div class="wallet">錢：${esc(state.stats.coin)}</div><div class="skill-grid">${Object.keys(labels.skills).map((key) => `<span>${esc(labels.skills[key])} ${esc(state.skills[key])}</span>`).join("")}</div>`;
  $("itemBox").innerHTML = state.items.slice(0, 9).map((item) => `<p><strong>${esc(item)}</strong></p>`).join("") || "<p>無</p>";
  $("noteBox").innerHTML = state.notes.slice(0, 9).map((note) => `<p>${esc(note)}</p>`).join("") || "<p>無</p>";
}

function statMeter(label, value, key) {
  const number = clamp(Number(value || 0), 0, 100);
  const color = key === "suspicion" ? "red" : key === "fatigue" || key === "hunger" ? "gold" : key === "spirit" ? "blue" : "green";
  return `<div class="stat-name"><span>${esc(label)}</span><span>${number}</span></div><div class="meter ${color}"><span style="width:${number}%"></span></div>`;
}

function canChoose(choice) {
  if (!choice.req) return true;
  if (choice.req.item && !state.items.includes(choice.req.item)) return false;
  if (choice.req.flag && !state.flags[choice.req.flag]) return false;
  if (choice.req.coin && state.stats.coin < choice.req.coin) return false;
  return true;
}

function lockReason(choice) {
  if (!choice.req) return "";
  if (choice.req.item) return ` 需物品：${choice.req.item}`;
  if (choice.req.flag) return ` 需旗標：${choice.req.flag}`;
  if (choice.req.coin) return ` 需錢：${choice.req.coin}`;
  return " 條件不足";
}

function choose(index) {
  const p = getPassage();
  const choice = p.choices[index];
  if (!choice || !canChoose(choice)) return;
  const outcome = resolveChoice(choice);
  const turnNo = recordUtterance(choice.kind || "decision", choice.text, p, "pc", outcome);
  state.events.push({
    turn_no: turnNo,
    scene_code: p.code,
    scene_title: p.title,
    choice_text: choice.text,
    to_scene: choice.to,
    outcome,
    created_at: new Date().toISOString()
  });
  applyChoice(choice, outcome);
  if (choice.autoRun) runAutoLoops();
  state.passage = choice.to;
  advanceTime(choice.kind);
  maybeRandomEvent();
  recordPassageNarration(getPassage());
  saveState();
  render();
}

function resolveChoice(choice) {
  if (!choice.skill) return "none";
  const burden = Math.floor((state.stats.fatigue + state.stats.hunger + state.stats.suspicion) / 35);
  const score = 5 + (state.skills[choice.skill] || 0) * 2 + Math.floor(state.dev.traceability / 25) - burden;
  const success = score >= (choice.dc || 6);
  if (success) {
    state.skills[choice.skill] = clamp((state.skills[choice.skill] || 0) + 1, 0, 9);
    applyDev({ smm: 1, tms: 1, traceability: 1 });
    return "success";
  }
  applyEffects({ composure: -2, suspicion: 1 });
  return "partial";
}

function applyChoice(choice, outcome) {
  applyEffects(choice.effects);
  applyDev(choice.dev);
  if (choice.item) addUnique(state.items, choice.item);
  if (choice.note) addNote(choice.note);
  if (choice.flag) state.flags[choice.flag] = true;
  if (outcome === "success") addNote(`檢定成功：${choice.text}`);
  if (outcome === "partial") addNote(`檢定僅部分成功：${choice.text}`);
}

function applyEffects(effects) {
  Object.keys(effects || {}).forEach((key) => {
    state.stats[key] = clamp(Number(state.stats[key] || 0) + Number(effects[key] || 0), key === "coin" ? -99 : 0, key === "coin" ? 999 : 100);
  });
}

function applyDev(dev) {
  Object.keys(dev || {}).forEach((key) => {
    state.dev[key] = clamp(Number(state.dev[key] || 0) + Number(dev[key] || 0), 0, 100);
  });
}

function advanceTime(kind) {
  const delta = kind === "action" ? 2 : kind === "decision" ? 2 : kind === "question" ? 2 : 1;
  state.hour += delta;
  if (state.hour >= 24) {
    state.hour -= 24;
    state.day += 1;
  }
  applyEffects({ hunger: 1, fatigue: 1 });
}

function maybeRandomEvent() {
  state.lastEvent = "";
  if (!state.options.randomEvents || state.turnNo % 3 !== 0 || randomEvents.length === 0) return;
  const event = randomEvents[state.turnNo % randomEvents.length];
  state.lastEvent = event.text;
  applyEffects(event.effects || {});
  applyDev(event.dev || {});
  const p = getPassage();
  const turnNo = recordUtterance("narration", event.text, { code: p.code, title: p.title, location: p.location }, "gm", event.key || "random_event");
  state.events.push({
    turn_no: turnNo,
    scene_code: p.code,
    scene_title: event.key || "random_event",
    choice_text: event.text,
    to_scene: state.passage,
    created_at: new Date().toISOString()
  });
}

function runAutoLoops() {
  for (let i = state.auto.generated + 1; i <= state.auto.limit; i += 1) {
    const seed = routeCycle[(i - 1) % routeCycle.length];
    addUnique(state.items, seed.item);
    addNote(`第${i}輪：${seed.note}`);
    applyDev({ smm: 2, tms: 2, traceability: 4 });
    applyEffects({ fatigue: 1, hunger: 1, composure: 1 });
    const scene = { code: `SCN-AUTO-${String(i).padStart(3, "0")}`, title: `第${i}輪：${seed.title}`, location: seed.location };
    const turnNo = recordUtterance("summary", `整理${seed.location}線索：${seed.note}`, scene, "pc", "auto_loop");
    state.events.push({
      turn_no: turnNo,
      scene_code: scene.code,
      scene_title: scene.title,
      choice_text: `整理${seed.location}線索`,
      to_scene: "AutoEnd",
      auto_loop_no: i,
      created_at: new Date().toISOString()
    });
    state.auto.generated = i;
  }
  state.auto.completed = true;
}

function makeAutoPassage(loopNo) {
  const seed = routeCycle[(loopNo - 1) % routeCycle.length];
  const next = loopNo >= state.auto.limit ? "AutoEnd" : `Auto-${loopNo + 1}`;
  return {
    code: `SCN-AUTO-${String(loopNo).padStart(3, "0")}`,
    title: `第${loopNo}輪：${seed.title}`,
    time: `第${loopNo}輪`,
    location: seed.location,
    tags: ["auto", "route"],
    text: [`${seed.location}的線索被重新抄入札記。`, `${state.player.name}把人物、地點、時間與來源排成同一列。`, `這是第 ${loopNo} 輪長線延伸，會留下 scene、event 與 utterance。`],
    choices: [ch(`整理${seed.title}`, next, "summary", { composure: 1, fatigue: 1 }, { smm: 2, tms: 2, traceability: 4 }, { item: seed.item, note: seed.note }), ch("暫停輪迴，回夜宿札記", "Night", "decision", { composure: 1 }, { traceability: 2 })]
  };
}

function makeAutoEnd() {
  return {
    code: "SCN-AUTO-END",
    title: "長線札記收束",
    time: "長線收束",
    location: "南京客舍",
    tags: ["export", "end"],
    text: [`${state.player.name}把長線札記疊在桌上。`, `目前已生成 ${state.auto.generated}/${state.auto.limit} 輪自動劇情。`, "可繼續遊玩，也可打開開發者面板匯出 JSON。"],
    choices: [ch("回南京城門重新入局", "Gate", "decision", { spirit: 2, composure: 2 }, { smm: 1, tms: 1, traceability: 2 }), ch("回夜宿札記", "Night", "summary", { composure: 2 }, { traceability: 2 }), ch("從第一輪手動重走", "Auto-1", "decision", { spirit: -1 }, { traceability: 2 })]
  };
}

function getPassage() {
  if (state.passage === "AutoEnd") return makeAutoEnd();
  const match = /^Auto-(\d+)$/.exec(state.passage || "");
  if (match) return makeAutoPassage(clamp(Number(match[1]), 1, state.auto.limit));
  return passages[state.passage] || passages.Gate || Object.values(passages)[0];
}

function recordPassageNarration(scene) {
  if (!scene || state.narrated[scene.code]) return;
  state.narrated[scene.code] = true;
  recordUtterance("narration", (scene.text || []).map(applyVars).join("\n"), scene, "gm", "scene_enter");
}

function recordUtterance(kind, text, scene, source, outcome) {
  const turnNo = nextTurnNo();
  const sourceInfo = speakerForSource(source);
  const fn = normalizeFunction(kind);
  state.utterances.push({
    project_code: corpusConfig.project_code,
    team_code: corpusConfig.team_code,
    session_code: corpusConfig.session_code,
    turn_no: turnNo,
    sub_turn_no: null,
    utterance_code: utteranceCode(turnNo),
    speaker_type: sourceInfo.speaker_type,
    speaker_code: sourceInfo.speaker_code,
    speaker_label_raw: sourceInfo.speaker_label_raw,
    utterance_text: text,
    utterance_function: fn,
    is_in_character: sourceInfo.speaker_type === "PC" || sourceInfo.speaker_type === "NPC",
    is_gm_narration: sourceInfo.speaker_type === "GM" && fn === "narration",
    is_rule_related: fn === "rule_check",
    is_decision_related: ["decision", "negotiation", "clarification"].includes(fn),
    is_knowledge_related: ["question", "clarification", "summary"].includes(fn),
    scene_code: scene.code,
    scene_title: scene.title,
    location: scene.location,
    source,
    outcome: outcome || "none",
    smm_score: state.dev.smm,
    tms_score: state.dev.tms,
    traceability_score: state.dev.traceability,
    created_at: new Date().toISOString()
  });
  return turnNo;
}

function speakerForSource(source) {
  if (source === "gm") return { speaker_type: "GM", speaker_code: corpusConfig.gm_code, speaker_label_raw: "GM" };
  if (source === "researcher") return { speaker_type: "Researcher", speaker_code: corpusConfig.researcher_code, speaker_label_raw: "Researcher" };
  return { speaker_type: "PC", speaker_code: state.player.character_code, speaker_label_raw: state.player.name };
}

function handleAction(action) {
  if (action === "save") {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    openOverlay("保存", "<p>已保存到瀏覽器 localStorage。</p>");
  }
  if (action === "load") loadManualSave();
  if (action === "settings") openSettings();
  if (action === "restart") restartGame();
  if (action === "developer") openDeveloper();
}

function loadManualSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      openOverlay("載入", "<p>尚無手動保存。</p>");
      return;
    }
    state = mergeState(clone(defaultState), JSON.parse(raw));
    saveState();
    render();
    openOverlay("載入", "<p>已載入手動保存。</p>");
  } catch (error) {
    openOverlay("載入失敗", `<pre>${esc(error.message)}</pre>`);
  }
}

function restartGame() {
  localStorage.removeItem(STORAGE_KEY);
  state = clone(defaultState);
  render();
}

function openSettings() {
  openOverlay("設定", `<div class="settings-grid"><label>文字外觀<select id="settingTextStyle">${Object.keys(labels.styles).map((key) => `<option value="${key}" ${state.player.textStyle === key ? "selected" : ""}>${labels.styles[key]}</option>`).join("")}</select></label><label class="checkline"><input type="checkbox" id="settingNumbered" ${state.options.numberedLinks ? "checked" : ""}> 選項編號</label><label class="checkline"><input type="checkbox" id="settingRandom" ${state.options.randomEvents ? "checked" : ""}> 隨機街頭事件</label></div><p><button type="button" id="applySettings">套用</button></p>`);
  $("applySettings").addEventListener("click", () => {
    state.player.textStyle = $("settingTextStyle").value;
    state.options.numberedLinks = $("settingNumbered").checked;
    state.options.randomEvents = $("settingRandom").checked;
    saveState();
    closeOverlay();
    render();
  });
}

function openDeveloper() {
  const data = buildCorpus();
  openOverlay("開發者 / TRPG Corpus", `<div class="dev-grid"><p><strong>Engine</strong><span>${ENGINE_VERSION}</span></p><p><strong>Utterance</strong><span>${state.utterances.length}</span></p><p><strong>Events</strong><span>${state.events.length}</span></p><p><strong>SMM</strong><span>${state.dev.smm}</span></p><p><strong>TMS</strong><span>${state.dev.tms}</span></p><p><strong>追溯</strong><span>${state.dev.traceability}</span></p></div><div class="developer-actions"><button id="copyJson" type="button">複製 JSON</button><button id="downloadJson" type="button">下載 JSON</button><button id="downloadCsv" type="button">下載 staging CSV</button></div><section class="settings-grid"><label>World manifest JSON<input id="manifestFile" type="file" accept="application/json,.json"></label><label>Manifest API URL<input id="manifestUrl" type="url" value="http://localhost:8787/api/world-manifest?project_code=${esc(corpusConfig.project_code)}&team_code=${esc(corpusConfig.team_code)}"></label><button id="loadManifestUrl" type="button">讀取 manifest</button><button id="clearManifest" type="button">清除 manifest</button></section><details open><summary>輸出預覽</summary><pre>${esc(JSON.stringify(data, null, 2))}</pre></details>`);
  $("copyJson").addEventListener("click", () => navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(data, null, 2)));
  $("downloadJson").addEventListener("click", () => downloadJson(data));
  $("downloadCsv").addEventListener("click", () => downloadText(`da_go_${corpusConfig.session_code}_stg_utterance_import.csv`, toCsv(data.stg_Utterance_Import), "text/csv;charset=utf-8"));
  $("manifestFile").addEventListener("change", loadManifestFile);
  $("loadManifestUrl").addEventListener("click", loadManifestUrl);
  $("clearManifest").addEventListener("click", () => {
    localStorage.removeItem(MANIFEST_KEY);
    activeManifest = clone(defaultManifest);
    corpusConfig = Object.assign({}, defaultManifest.config);
    passages = normalizePassages(activeManifest);
    randomEvents = normalizeArray(activeManifest.random_events, fallbackRandomEvents);
    routeCycle = normalizeArray(activeManifest.route_cycle, fallbackRouteCycle);
    closeOverlay();
    render();
  });
}

function buildCorpus() {
  const scenes = Object.keys(passages).map((key, index) => sceneRow(passages[key], index + 1))
    .concat(Array.from({ length: state.auto.limit }, (_, i) => sceneRow(makeAutoPassage(i + 1), Object.keys(passages).length + i + 1)))
    .concat([sceneRow(makeAutoEnd(), 999)]);
  return {
    metadata: {
      export_format: "da_go_playlog_json_v2",
      engine_version: ENGINE_VERSION,
      database_name: corpusConfig.database_name,
      project_code: corpusConfig.project_code,
      team_code: corpusConfig.team_code,
      session_code: corpusConfig.session_code,
      import_batch_code: corpusConfig.import_batch_code,
      source_manifest_format: activeManifest.manifest_format || "unknown",
      exported_at: new Date().toISOString()
    },
    stg_Import_Batch: importBatchRow(),
    dbo_Scene: scenes,
    stg_Utterance_Import: state.utterances.map(toStagingUtterance),
    dbo_Decision_Log_preview: state.events.map(toDecisionPreview),
    raw_game_events: state.events,
    game_state: state
  };
}

function importBatchRow() {
  return {
    batch_code: corpusConfig.import_batch_code,
    project_code: corpusConfig.project_code,
    source_table_name: "stg.Utterance_Import",
    source_file_name: `da_go_${corpusConfig.session_code}.json`,
    source_file_type: "json",
    import_purpose: "da_go playlog roundtrip",
    imported_by: "da_go browser export",
    import_status: "created",
    total_row_count: state.utterances.length,
    import_note: "import_batch_id 由 trpg-corpus 匯入程序配置。"
  };
}

function toStagingUtterance(u, index) {
  return {
    import_batch_code: corpusConfig.import_batch_code,
    import_batch_id: null,
    source_row_no: index + 1,
    project_code: u.project_code,
    team_code: u.team_code,
    session_code: u.session_code,
    scene_code: u.scene_code,
    turn_no_text: String(u.turn_no),
    sub_turn_no_text: u.sub_turn_no == null ? null : String(u.sub_turn_no),
    utterance_code: u.utterance_code,
    speaker_type: u.speaker_type,
    speaker_code: u.speaker_code,
    speaker_label_raw: u.speaker_label_raw,
    utterance_function: normalizeFunction(u.utterance_function),
    is_in_character_text: boolText(u.is_in_character),
    is_gm_narration_text: boolText(u.is_gm_narration),
    is_rule_related_text: boolText(u.is_rule_related),
    is_decision_related_text: boolText(u.is_decision_related),
    is_knowledge_related_text: boolText(u.is_knowledge_related),
    start_timecode: null,
    end_timecode: null,
    duration_sec_text: null,
    utterance_text_raw: u.utterance_text,
    utterance_text_clean: u.utterance_text,
    utterance_text_verified: null,
    language_code: "zh-TW",
    emotion_label: "neutral",
    interaction_target_type: "unknown",
    interaction_target_code: null,
    related_rule_code: null,
    related_world_setting_code: null,
    related_item_code: null,
    ai_summary: null,
    ai_annotation_json: JSON.stringify({
      source: "da_go",
      outcome: u.outcome,
      smm_score: u.smm_score,
      tms_score: u.tms_score,
      traceability_score: u.traceability_score,
      created_at: u.created_at
    }),
    human_annotation_note: null,
    transcription_confidence_text: "1",
    review_status: "draft",
    include_in_analysis_text: "1",
    exclusion_reason: null,
    import_status: "raw"
  };
}

function toDecisionPreview(e, index) {
  return {
    decision_code: `DAGO-DEC-${String(index + 1).padStart(5, "0")}`,
    project_code: corpusConfig.project_code,
    team_code: corpusConfig.team_code,
    session_code: corpusConfig.session_code,
    turn_no: e.turn_no,
    scene_code: e.scene_code,
    decision_title: e.choice_text,
    decision_type: "action_choice",
    decision_status: "implemented",
    consensus_level: "unclear",
    selected_option: e.choice_text,
    outcome_summary: e.outcome || "none",
    next_scene_code: e.to_scene || null
  };
}

function boolText(value) { return value ? "1" : "0"; }

function sceneRow(scene, sceneNo) {
  return {
    project_code: corpusConfig.project_code,
    team_code: corpusConfig.team_code,
    session_code: corpusConfig.session_code,
    scene_code: scene.code,
    scene_no: sceneNo,
    scene_title: scene.title,
    scene_type: scene.code.indexOf("SCN-AUTO") === 0 ? "other" : "play",
    location_name: scene.location || null,
    scene_summary_raw: (scene.text || []).join("\n"),
    source_type: "database_imported",
    extraction_method: "imported",
    review_status: "draft",
    scene_status: "draft"
  };
}

async function loadManifestFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const text = await file.text();
  persistManifest(JSON.parse(text));
  state.passage = Object.keys(passages)[0] || "Gate";
  state.narrated = {};
  saveState();
  closeOverlay();
  render();
}

async function loadManifestUrl() {
  const url = $("manifestUrl").value.trim();
  if (!url) return;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
  const manifest = await response.json();
  persistManifest(manifest);
  state.passage = Object.keys(passages)[0] || "Gate";
  state.narrated = {};
  saveState();
  closeOverlay();
  render();
}

function downloadJson(data) {
  downloadText(`da_go_${corpusConfig.session_code}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
}

function downloadText(fileName, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((key) => csvCell(row[key])).join(","));
  return `${headers.join(",")}\r\n${body.join("\r\n")}`;
}

function csvCell(value) {
  if (value == null) return "";
  return `"${String(value).replace(/"/g, '""')}"`;
}

function openOverlay(title, html) {
  $("overlayTitle").textContent = title;
  $("overlayContent").innerHTML = html;
  $("overlayBackdrop").classList.remove("hidden");
}

function closeOverlay() { $("overlayBackdrop").classList.add("hidden"); }

function handleHotkey(event) {
  if (!state.started) return;
  if (event.key === "Escape") {
    closeOverlay();
    return;
  }
  const number = Number(event.key);
  if (Number.isInteger(number) && number >= 1 && number <= 9 && getPassage().choices[number - 1]) choose(number - 1);
}
