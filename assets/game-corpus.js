const STORAGE_KEY = "daGoCorpusRpgStateV4";
const SAVE_KEY = "daGoCorpusRpgManualSaveV4";
const MANIFEST_KEY = "daGoCorpusWorldManifestV3";
const ENGINE_VERSION = "1.4.4-sidebar-status";

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
  stats: { spirit: "精神", composure: "鎮定", suspicion: "疑心", fatigue: "疲勞", hunger: "飢餓", heat: "注目", reputation: "名聲", coin: "錢" },
  skills: { inquiry: "探問", archive: "案卷", influence: "交涉", travel: "行路" },
  styles: { standard: "標準", scroll: "書卷", night: "夜讀", large: "大字" },
  roles: { scribe: "書吏線人", wanderer: "江湖遊士", merchant: "商旅耳目", medic: "醫館學徒" },
  origins: { nanjing: "南京", north: "北路", south: "南市", wudu: "五毒" },
  traits: { calm: "冷靜", streetwise: "熟路", silver_tongue: "善談", sturdy: "耐勞" },
  difficulties: { relaxed: "寬鬆", standard: "標準", pressure: "壓力" },
  genders: { female: "女", male: "男", undisclosed: "未定" },
  heights: { short: "矮", average: "中等", tall: "高" },
  builds: { slender: "纖瘦", balanced: "勻稱", strong: "健壯", soft: "豐潤" },
  bodyLines: { straight: "直線", soft_curve: "柔和", firm: "結實" },
  skinTones: { pale: "白皙", wheat: "小麥", bronze: "古銅", deep: "深褐" },
  faces: { clear: "清秀", upright: "端正", sharp: "銳利", gentle: "溫雅" },
  eyeColors: { black: "黑瞳", brown: "褐瞳", amber: "琥珀瞳", gray: "灰瞳" },
  hairColors: { black: "黑髮", dark_brown: "深褐髮", tea: "茶褐髮", silver: "銀灰髮" },
  hairLengths: { short: "短髮", shoulder: "及肩", long: "長髮", bound: "束髮" },
  ranks: { commoner: "平民", poor: "寒門", gentry: "士族旁支", merchant_house: "商戶" },
  attributePlans: { balanced: "均衡配點", body: "體魄配點", mind: "心智配點", social: "社交配點", travel: "探索配點" },
  specialOrigins: { none: "無特殊身世", north_contact: "北路舊識", south_patron: "南市庇護", wudu_debt: "五毒舊債", office_file: "官署文書" },
  seasons: { spring: "春", summer: "夏", autumn: "秋", winter: "冬" },
  modes: { story: "劇情", standard: "標準", survival: "生存" }
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

const fallbackEventPools = [
  {
    id: "city_after_choice",
    name: "南京街頭事件",
    trigger: "after_choice",
    entries: [
      {
        event_id: "EV_CITY_PATROL",
        title: "巡丁盤問",
        text: "巡丁攔下你，問你為何反覆打聽北路文書。",
        weight: 3,
        cooldown_turns: 4,
        max_triggers_per_day: 2,
        conditions: [{ path: "stats.suspicion", op: ">=", value: 8 }],
        effects: [
          { op: "add", path: "stats.heat", value: 3 },
          { op: "add", path: "stats.composure", value: -2 },
          { op: "note", value: "注目上升。若注目太高，官署行動會變難。" }
        ]
      },
      {
        event_id: "EV_CITY_RUMOUR",
        title: "茶棚耳語",
        text: "有人提到一份被押往案卷房的北路封文。",
        weight: 4,
        cooldown_turns: 3,
        max_triggers_per_day: 1,
        effects: [
          { op: "add", path: "dev.smm", value: 2 },
          { op: "add", path: "dev.traceability", value: 2 },
          { op: "note", value: "北路封文可能接往魏無忌案卷。" }
        ]
      },
      {
        event_id: "EV_BODY_WARNING",
        title: "身體負擔",
        text: "你站起身時眼前一黑，飢餓與疲勞拖慢了判斷。",
        weight: 4,
        cooldown_turns: 2,
        max_triggers_per_day: 2,
        conditions: [{ any: [{ path: "stats.hunger", op: ">=", value: 55 }, { path: "stats.fatigue", op: ">=", value: 65 }] }],
        effects: [
          { op: "add", path: "stats.spirit", value: -4 },
          { op: "add", path: "stats.composure", value: -2 }
        ]
      },
      {
        event_id: "EV_HELPFUL_SCRIBE",
        title: "書吏提醒",
        text: "一名書吏提醒你補上消息來源，免得回寫資料時失去脈絡。",
        weight: 2,
        cooldown_turns: 5,
        max_triggers_per_day: 1,
        conditions: [{ path: "dev.traceability", op: "<", value: 72 }],
        effects: [
          { op: "add", path: "dev.traceability", value: 5 },
          { op: "add", path: "stats.reputation", value: 1 }
        ]
      }
    ]
  },
  {
    id: "night_pressure",
    name: "夜間壓力",
    trigger: "daily",
    entries: [
      {
        event_id: "EV_NIGHT_COST",
        title: "夜宿開銷",
        text: "客舍收走一文錢。你若身無分文，隔日精神會下降。",
        weight: 1,
        cooldown_turns: 0,
        max_triggers_per_day: 1,
        effects: [{ op: "add", path: "stats.coin", value: -1 }]
      }
    ]
  }
];

const fallbackPassages = {
  Gate: {
    code: "SCN-GAME-001", title: "南京城門", time: "卯時", location: "南京", tags: ["hub", "town"],
    text: [
      "雨才停。南京城門外的石道帶著水光，驛卒牽馬穿過人群，文書被油紙裹得嚴實。",
      "{{name}}站在門洞陰影下。北境兵事、崑崙舊路、南陽商旅與案卷房傳言同時湧入。",
      "這裡是主樞紐。你可以反覆調查、工作、購物、休息與回到客舍札記。"
    ],
    choices: [
      ch("往驛站查看北方文書", "Relay", "action", { spirit: -2, fatigue: 2 }, { smm: 1, tms: 2, traceability: 4 }, { skill: "archive", dc: 7, item: "驛站木牌" }),
      ch("到茶棚打聽南京流言", "Tea", "question", { coin: -1, suspicion: 1, hunger: 2 }, { smm: 2, tms: 1, traceability: 2 }, { skill: "inquiry", dc: 6, note: "茶棚有人提到銀川。" }),
      ch("沿秦淮河找南方商旅", "River", "action", { spirit: -1, fatigue: 3 }, { smm: 1, tms: 3, traceability: 2 }, { skill: "travel", dc: 6 }),
      ch("去南市買補給", "Market", "action", { fatigue: 1 }, { tms: 1 }),
      ch("找短工換錢", "Work", "action", { spirit: -3, fatigue: 8, hunger: 6, coin: 4 }, { tms: 1 }, { note: "短工讓角色獲得行動資源。" }),
      ch("打開客舍札記", "Codex", "summary", { composure: 1 }, { smm: 2, tms: 2, traceability: 4 })
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
    text: ["封口編號可以把消息接回文袋來源。這種小札記能讓後續追查時找得到人與地。", "你把編號抄下，又補上時間、地點、來源與疑點。", "這份索引能讓線索從茶棚、驛站與案卷房彼此接上。"],
    choices: [
      ch("整理成客舍札記", "Codex", "summary", { composure: 2 }, { smm: 3, tms: 4, traceability: 8 }, { item: "來源索引卡", flag: "source_index" }),
      ch("回驛站", "Relay", "action", { suspicion: 1 }, { traceability: 1 })
    ]
  },
  Codex: {
    code: "SCN-GAME-013", title: "客舍札記", time: "整理時", location: "客舍桌前", tags: ["journal", "route"],
    text: ["桌上有三疊紙：人物對照、地點索引、決策理由。你把白日聽見的名字按先後順序壓平。", "目前取得的物品與紀錄會在左欄顯示。若要追新路線，先把札記補到能交代來龍去脈。", "這一頁只處理角色手上的線索。"],
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
      ch("休息", "Gate", "rest", {}, { smm: 1, tms: 1, traceability: 2 }, { rest: true }),
      ch("下一日往北路追銀川", "NorthRoad", "decision", { spirit: -2, composure: 2 }, { smm: 3, tms: 3, traceability: 5 }),
      ch("下一日查南陽與五毒", "South", "decision", { spirit: -1, composure: 1 }, { smm: 3, tms: 4, traceability: 5 }),
      ch("生成二十四輪札記", "AutoEnd", "summary", { composure: 2 }, { smm: 6, tms: 6, traceability: 8 }, { autoRun: true }),
      ch("手動進入下一輪札記", "Auto-1", "decision", { spirit: -1, composure: 2 }, { smm: 3, tms: 3, traceability: 5 })
    ]
  }
};

function enhanceFallbackPassages(passages) {
  passages.Gate.choices.unshift(
    ch("查看今日目標與地圖", "TownMap", "summary", {}, { smm: 2, traceability: 2 })
  );
  passages.Gate.choices.push(
    ch("檢查結案條件", "GoalBoard", "summary", { composure: 1 }, { smm: 3, tms: 2, traceability: 3 })
  );

  passages.TownMap = {
    code: "SCN-GAME-100",
    title: "南京行動地圖",
    time: "街市開放",
    location: "南京",
    tags: ["map", "sandbox"],
    text: [
      "你把今日能去的地方寫成一張簡表。每個地點都會消耗時間，也可能改變注目、飢餓、疲勞與名聲。",
      "核心目標：取得三條以上有效線索，整理成能交代人、事、地的結案札記。",
      "若注目、疲勞或飢餓失控，部分調查會被鎖住。"
    ],
    choices: [
      ch("城門與茶棚：便宜打聽", "Tea", "question", { hunger: 1 }, { smm: 2, traceability: 2 }),
      ch("驛站與北街：查北路文書", "Relay", "action", { fatigue: 2 }, { tms: 2, traceability: 3 }),
      ch("南市：購物、短工、商旅", "Market", "action", { hunger: 1 }, { tms: 2 }),
      ch("官署案卷房：高風險高收益", "Yamen", "decision", { heat: 1 }, { smm: 2, traceability: 4 }, { conditions: [{ path: "stats.heat", op: "<", value: 18 }] }),
      ch("醫館：降低疲勞與飢餓", "Clinic", "action", {}, { tms: 1 }),
      ch("客舍：休息與保存進度", "Night", "summary", {}, { smm: 1, tms: 1 })
    ]
  };

  passages.GoalBoard = {
    code: "SCN-GAME-101",
    title: "結案條件",
    time: "整理時",
    location: "客舍桌前",
    tags: ["goal", "progress"],
    text: [
      "結案至少需要三種材料：北路關卡、PC 名字對照、南陽路引、案卷摘記、來源索引卡。",
      "高品質結案需要保持注目低於二十五，並且保留至少一文錢或一份補給。",
      "結案後可以繼續補線索，或回客舍休息進入下一日。"
    ],
    choices: [
      ch("回行動地圖", "TownMap", "summary", {}, { smm: 1 }),
      ch("整理線索，嘗試結案", "FinalReport", "summary", { composure: 4 }, { smm: 5, tms: 5, traceability: 8 }, {
        conditions: [{
          op: "at_least_flags",
          count: 3,
          flags: ["weifen_lead", "pc_crosswalk", "south_pass", "wuji_dossier", "source_index"]
        }]
      }),
      ch("先去找更可靠的來源", "Archive", "action", { fatigue: 1 }, { traceability: 3 })
    ]
  };

  passages.Clinic = {
    code: "SCN-GAME-102",
    title: "城南醫館",
    time: "午後",
    location: "南京城南",
    tags: ["rest", "clinic"],
    text: [
      "醫館門口排著雨後受寒的人。你可以花錢買藥，也可以幫忙整理藥櫃換一碗熱湯。",
      "這裡提供低風險恢復，但會消耗白日時段。",
      "若飢餓或疲勞已經太高，先處理身體狀態會讓後續檢定更可靠。"
    ],
    choices: [
      ch("買一包醒神藥", "Clinic", "purchase", { coin: -3, fatigue: -24, spirit: 8 }, { tms: 1 }, { req: { coin: 3 }, item: "醒神藥", note: "疲勞下降，精神回升。" }),
      ch("幫忙整理藥櫃換熱湯", "Clinic", "action", { fatigue: 4, hunger: -18, coin: 1 }, { tms: 2, traceability: 1 }, { note: "熱湯讓飢餓下降。" }),
      ch("向醫師問五毒舊傷", "South", "question", { coin: -1, suspicion: 1 }, { smm: 2, tms: 3, traceability: 3 }, { skill: "inquiry", dc: 8, flag: "poison_clue", note: "醫師提到五毒舊傷與南陽路線。" }),
      ch("回行動地圖", "TownMap", "summary", {}, { smm: 1 })
    ]
  };

  passages.FinalReport = {
    code: "SCN-GAME-103",
    title: "結案札記",
    time: "深夜",
    location: "南京客舍",
    tags: ["ending", "export"],
    text: [
      "你把線索壓成四欄：人物、地點、事件、來源。每一欄都能回到一段遊玩紀錄。",
      "這份札記已達到最小結案門檻。若要提高品質，可以重開一輪，降低注目並補齊更多來源。",
      "結案後仍可補線索、休息，或重開新一日。"
    ],
    choices: [
      ch("回南京行動地圖繼續補線索", "TownMap", "summary", { composure: 2 }, { smm: 2, tms: 2, traceability: 2 }),
      ch("休息後開始新一日", "Night", "rest", {}, { smm: 1, traceability: 2 }, { rest: true })
    ]
  };

  passages.Yamen.choices.unshift(
    ch("先交出來源索引卡降低盤問", "Yamen", "summary", { heat: -5, suspicion: -2, composure: 2 }, { traceability: 5 }, { req: { item: "來源索引卡" }, note: "書吏認可你的資料來源格式。" })
  );
  passages.Night.choices.unshift(
    ch("查看結案條件", "GoalBoard", "summary", { composure: 1 }, { smm: 3, tms: 2 })
  );
}

enhanceFallbackPassages(fallbackPassages);

const defaultManifest = {
  manifest_format: "da_go_world_manifest_v1",
  bundle_format: "da_go_runtime_bundle_v1",
  metadata: {
    source: "fallback",
    source_note: "本機預設資料，等待 trpg-corpus manifest 取代。"
  },
  config: corpusConfig,
  world_state: { start_passage: "Gate", day: 1, hour: 6, location: "南京" },
  states: [
    { key: "stats.spirit", group: "stats", type: "number", default: "50", min: 0, max: 100, label: "精神" },
    { key: "stats.composure", group: "stats", type: "number", default: "50", min: 0, max: 100, label: "鎮定" },
    { key: "stats.suspicion", group: "stats", type: "number", default: "0", min: 0, max: 100, label: "疑心" },
    { key: "stats.fatigue", group: "stats", type: "number", default: "0", min: 0, max: 100, label: "疲勞" },
    { key: "stats.hunger", group: "stats", type: "number", default: "0", min: 0, max: 100, label: "飢餓" },
    { key: "stats.heat", group: "stats", type: "number", default: "0", min: 0, max: 100, label: "注目" },
    { key: "stats.reputation", group: "stats", type: "number", default: "20", min: 0, max: 100, label: "名聲" },
    { key: "stats.coin", group: "stats", type: "number", default: "12", min: -99, max: 999, label: "錢" }
  ],
  passages: fallbackPassages,
  random_events: fallbackRandomEvents,
  event_pools: fallbackEventPools,
  relationship_defs: [],
  route_cycle: fallbackRouteCycle,
  characters: [],
  npcs: [],
  world_settings: [],
  items: [],
  rules: []
};

let activeManifest = loadManifest();
corpusConfig = Object.assign({}, defaultManifest.config, activeManifest.config || {});
let passages = normalizePassages(activeManifest);
let randomEvents = normalizeArray(activeManifest.random_events, fallbackRandomEvents);
let routeCycle = normalizeArray(activeManifest.route_cycle, fallbackRouteCycle);
let stateDefinitions = normalizeStateDefinitions(activeManifest.states);
let relationshipDefinitions = normalizeRelationshipDefs(activeManifest.relationship_defs, activeManifest.npcs);
let eventPools = normalizeEventPools(activeManifest.event_pools);

const defaultState = {
  started: false, passage: "Gate", turnNo: 0, utteranceNo: 0, day: 1, hour: 6,
  player: {
    name: "旅人", player_code: "PLAYER-LOCAL", member_code: "TM-LOCAL", character_code: "PC-LOCAL", textStyle: "standard",
    role: "scribe", origin: "nanjing", trait: "calm", difficulty: "standard",
    gender: "female", height: "average", build: "slender", bodyLine: "straight", skinTone: "pale",
    face: "clear", eyeColor: "black", hairColor: "black", hairLength: "short",
    rank: "commoner", attributePlan: "balanced", specialOrigin: "none", startSeason: "autumn", gameMode: "standard"
  },
  stats: { spirit: 50, composure: 50, coin: 12, suspicion: 0, fatigue: 0, hunger: 0, heat: 0, reputation: 20 },
  skills: { inquiry: 1, archive: 1, influence: 1, travel: 1 },
  dev: { smm: 50, tms: 50, traceability: 50 },
  items: ["素布行囊"], notes: ["大興二十年八月，南京。"], flags: {}, relations: {}, utterances: [], events: [], narrated: {},
  eventMemory: { counts: {}, dayCounts: {}, cooldownUntil: {} },
  feedbackSeen: {},
  auto: { generated: 0, limit: 24, completed: false }, lastEvent: "",
  options: { numberedLinks: true, randomEvents: true, showCheckRate: true }
};

let state = loadState();
const $ = (id) => document.getElementById(id);

$("startForm").addEventListener("submit", startGame);
$("randomizeCharacter").addEventListener("click", randomizeCharacterForm);
$("closeOverlay").addEventListener("click", closeOverlay);
document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.panel)));
document.addEventListener("keyup", handleHotkey);
render();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeState(createDefaultState(), JSON.parse(raw)) : createDefaultState();
  } catch (error) {
    return createDefaultState();
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
  stateDefinitions = normalizeStateDefinitions(activeManifest.states);
  relationshipDefinitions = normalizeRelationshipDefs(activeManifest.relationship_defs, activeManifest.npcs);
  eventPools = normalizeEventPools(activeManifest.event_pools);
  localStorage.setItem(MANIFEST_KEY, JSON.stringify(activeManifest));
}

function mergeManifest(base, incoming) {
  const merged = Object.assign({}, base, incoming || {});
  if (incoming && !incoming.bundle_format) delete merged.bundle_format;
  merged.metadata = Object.assign({}, base.metadata || {}, incoming && incoming.metadata ? incoming.metadata : {});
  merged.config = Object.assign({}, base.config || {}, incoming && incoming.config ? incoming.config : {});
  return merged;
}

function normalizePassages(manifest) {
  if (manifest && manifest.passages && !Array.isArray(manifest.passages)) return normalizePassageMap(manifest.passages);
  if (manifest && Array.isArray(manifest.passages) && manifest.passages.length > 0) {
    const output = {};
    manifest.passages.forEach((passage, index) => {
      const key = passage.id || passage.passage_code || passage.code || passage.scene_code || `Passage${index + 1}`;
      output[key] = normalizePassage(passage, key, index);
    });
    addFallbackChoices(output);
    return output;
  }
  if (manifest && Array.isArray(manifest.scenes) && manifest.scenes.length > 0) {
    const output = {};
    manifest.scenes.forEach((scene, index) => {
      const key = scene.key || scene.scene_key || scene.scene_code || `Scene${index + 1}`;
      output[key] = normalizePassage(scene, key, index);
    });
    addFallbackChoices(output);
    return output;
  }
  return normalizePassageMap(fallbackPassages);
}

function normalizePassageMap(value) {
  const output = {};
  Object.keys(value || {}).forEach((key, index) => {
    output[key] = normalizePassage(value[key], key, index);
  });
  addFallbackChoices(output);
  return output;
}

function normalizePassage(passage, key, index) {
  const tags = parseJsonIfString(passage.tags || passage.tag_json || []);
  return {
    code: passage.code || passage.passage_code || passage.scene_code || key,
    title: passage.title || passage.scene_title || passage.passage_title || key,
    time: passage.time || passage.time_slot || `第 ${index + 1} 場`,
    location: passage.location || passage.location_name || "",
    tags: Array.isArray(tags) ? tags : ["corpus"],
    text: normalizeTextLines(passage.text || passage.body || passage.body_markdown || passage.scene_summary_clean || passage.scene_summary_raw || passage.scene_summary || ""),
    choices: normalizeChoices(passage.choices, key),
    on_enter: normalizeEffectsSpec(passage.on_enter || passage.on_enter_json),
    on_exit: normalizeEffectsSpec(passage.on_exit || passage.on_exit_json),
    is_terminal: !!passage.is_terminal
  };
}

function addFallbackChoices(output) {
  const keys = Object.keys(output);
  keys.forEach((key, index) => {
    if (!output[key].choices.length && !output[key].is_terminal) {
      output[key].choices.push(ch("前往下一段", keys[index + 1] || keys[0], "decision", [], { traceability: 1 }));
    }
  });
}

function normalizeChoices(choices, currentKey) {
  if (!Array.isArray(choices)) return [];
  return choices.map((choice, index) => {
    const parsedChoice = parseJsonIfString(choice);
    const check = parseJsonIfString(parsedChoice.check || parsedChoice.skill_check || parsedChoice.skill_check_json || {});
    const extra = Object.assign({}, parsedChoice.extra || {});
    ["item", "note", "flag", "req", "autoRun", "rest", "on_success", "success_effects", "on_failure", "failure_effects"].forEach((key) => {
      if (parsedChoice[key] !== undefined) extra[key] = parsedChoice[key];
    });
    return Object.assign(ch(
      parsedChoice.text || parsedChoice.choice_text || `選項 ${index + 1}`,
      parsedChoice.to || parsedChoice.target || parsedChoice.next_passage_code || parsedChoice.next_scene_key || parsedChoice.next_scene_code || currentKey,
      normalizeFunction(parsedChoice.kind || parsedChoice.utterance_function || "decision"),
      normalizeEffectsSpec(parsedChoice.effects || parsedChoice.effect_json),
      parsedChoice.dev || { traceability: 1 },
      extra
    ), {
      id: parsedChoice.id || parsedChoice.choice_code || `choice_${index + 1}`,
      conditions: normalizeConditionList(parsedChoice.conditions || parsedChoice.condition_json),
      visibility: normalizeConditionList(parsedChoice.visibility || parsedChoice.visibility_json),
      failure_passage_code: parsedChoice.failure_passage_code || parsedChoice.failure || null,
      skill: parsedChoice.skill || check.skill || null,
      dc: parsedChoice.dc || check.dc || check.difficulty || null,
      check
    });
  });
}

function normalizeArray(value, fallback) {
  return Array.isArray(value) && value.length ? value : fallback.slice();
}

function normalizeTextLines(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function parseJsonIfString(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !/^[\[{]/.test(trimmed)) return value;
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return value;
  }
}

function normalizeEffectsSpec(value) {
  const parsed = parseJsonIfString(value);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed.filter(Boolean);
  if (typeof parsed === "object" && parsed.op) return [parsed];
  if (typeof parsed === "object") return parsed;
  return [];
}

function normalizeConditionList(value) {
  const parsed = parseJsonIfString(value);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed.filter(Boolean);
  if (typeof parsed === "object") return [parsed];
  return [];
}

function normalizeStateDefinitions(value) {
  const parsed = parseJsonIfString(value);
  const rows = Array.isArray(parsed)
    ? parsed
    : Object.keys(parsed || {}).map((key) => Object.assign({ key }, parsed[key]));
  return rows.map((row) => {
    const key = row.key || row.state_key;
    return {
      key,
      group: row.group || row.state_group || (key ? key.split(".")[0] : "runtime"),
      type: row.type || row.value_type || "string",
      default: row.default !== undefined ? row.default : row.default_value_text,
      min: row.min !== undefined ? Number(row.min) : row.min_value !== undefined ? Number(row.min_value) : null,
      max: row.max !== undefined ? Number(row.max) : row.max_value !== undefined ? Number(row.max_value) : null,
      label: row.label || row.ui_label || key,
      ui_visible: row.ui_visible !== false
    };
  }).filter((row) => row.key);
}

function normalizeRelationshipDefs(value, npcs) {
  const rows = normalizeArray(parseJsonIfString(value), []);
  if (rows.length) return rows.map(normalizeRelationshipDef).filter(Boolean);
  return normalizeArray(npcs, []).map((npc) => normalizeRelationshipDef({
    npc_code: npc.npc_code,
    npc_name: npc.npc_name,
    metrics: [
      { key: "trust", default: 0, min: -100, max: 100, label: "信任" },
      { key: "favor", default: 0, min: -100, max: 100, label: "好感" },
      { key: "fear", default: 0, min: -100, max: 100, label: "畏懼" }
    ]
  })).filter(Boolean);
}

function normalizeRelationshipDef(row) {
  const npcCode = row.npc_code || row.code;
  if (!npcCode) return null;
  return {
    npc_code: npcCode,
    npc_name: row.npc_name || row.name || npcCode,
    metrics: normalizeArray(parseJsonIfString(row.metrics), []).map((metric) => ({
      key: metric.key || metric.relation_key,
      default: Number(metric.default !== undefined ? metric.default : metric.default_value || 0),
      min: Number(metric.min !== undefined ? metric.min : metric.min_value || -100),
      max: Number(metric.max !== undefined ? metric.max : metric.max_value || 100),
      label: metric.label || metric.ui_label || metric.key || metric.relation_key
    })).filter((metric) => metric.key)
  };
}

function normalizeEventPools(value) {
  return normalizeArray(parseJsonIfString(value), []).map((pool, index) => {
    const entries = normalizeArray(parseJsonIfString(pool.entries), []).map((entry, entryIndex) => ({
      event_id: entry.event_id || entry.id || entry.event_code || `${pool.id || pool.event_pool_code || `pool_${index + 1}`}_${entryIndex + 1}`,
      title: entry.title || entry.event_name || entry.event_title || "事件",
      passage_id: entry.passage_id || entry.passage_code || entry.target || null,
      text: entry.text || entry.event_text || entry.event_summary || "",
      conditions: normalizeConditionList(entry.conditions || entry.condition_json),
      effects: normalizeEffectsSpec(entry.effects || entry.effect_json),
      weight: Math.max(0, Number(entry.weight || 1)),
      cooldown_turns: Math.max(0, Number(entry.cooldown_turns || 0)),
      max_triggers_per_day: Math.max(0, Number(entry.max_triggers_per_day || 1))
    })).filter((entry) => entry.weight > 0);
    return {
      id: pool.id || pool.event_pool_code || `pool_${index + 1}`,
      name: pool.name || pool.pool_name || "事件池",
      trigger: pool.trigger || pool.trigger_type || "after_choice",
      location_scope: pool.location_scope || null,
      conditions: normalizeConditionList(pool.conditions || pool.condition_json),
      entries
    };
  }).filter((pool) => pool.entries.length);
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function createDefaultState() {
  const base = clone(defaultState);
  const world = activeManifest.world_state || {};
  base.passage = startPassageKey();
  base.day = Number(world.day || 1);
  base.hour = Number(world.hour || 6);
  applyStateDefaults(base);
  applyRelationshipDefaults(base);
  return base;
}

function startPassageKey() {
  const world = activeManifest.world_state || {};
  return world.start_passage || Object.keys(passages)[0] || "Gate";
}

function applyStateDefaults(targetState) {
  stateDefinitions.forEach((definition) => {
    setPath(targetState, definition.key, coerceDefaultValue(definition));
  });
}

function coerceDefaultValue(definition) {
  const raw = definition.default;
  if (definition.type === "number") return Number(raw || 0);
  if (definition.type === "boolean") return raw === true || raw === "1" || raw === "true";
  if (definition.type === "json") return parseJsonIfString(raw) || null;
  return raw == null ? "" : String(raw);
}

function applyRelationshipDefaults(targetState) {
  relationshipDefinitions.forEach((definition) => {
    if (!targetState.relations[definition.npc_code]) targetState.relations[definition.npc_code] = {};
    definition.metrics.forEach((metric) => {
      targetState.relations[definition.npc_code][metric.key] = Number(metric.default || 0);
    });
  });
}

function mergeState(base, incoming) {
  const n = Object.assign({}, base, incoming || {});
  ["player", "stats", "skills", "dev", "auto", "options", "flags", "relations", "narrated", "feedbackSeen"].forEach((k) => { n[k] = Object.assign({}, base[k], incoming && incoming[k] ? incoming[k] : {}); });
  n.eventMemory = {
    counts: Object.assign({}, base.eventMemory.counts, incoming && incoming.eventMemory ? incoming.eventMemory.counts : {}),
    dayCounts: Object.assign({}, base.eventMemory.dayCounts, incoming && incoming.eventMemory ? incoming.eventMemory.dayCounts : {}),
    cooldownUntil: Object.assign({}, base.eventMemory.cooldownUntil, incoming && incoming.eventMemory ? incoming.eventMemory.cooldownUntil : {})
  };
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
function nextActionTurnNo() { state.turnNo = Number(state.turnNo || 0) + 1; return state.turnNo; }
function nextUtteranceNo() { state.utteranceNo = Number(state.utteranceNo || 0) + 1; return state.utteranceNo; }
function utteranceCode(utteranceNo) { return `UTT-${corpusConfig.session_code}-${String(utteranceNo).padStart(5, "0")}`.slice(0, 80); }
function normalizeFunction(kind) { return VALID_UTTERANCE_FUNCTIONS.has(kind) ? kind : kindMap[kind] || "summary"; }

function getPath(root, path) {
  return String(path || "").split(".").filter(Boolean).reduce((current, part) => (current == null ? undefined : current[part]), root);
}

function setPath(root, path, value) {
  const parts = String(path || "").split(".").filter(Boolean);
  if (!parts.length) return;
  let current = root;
  parts.slice(0, -1).forEach((part) => {
    if (current[part] == null || typeof current[part] !== "object") current[part] = {};
    current = current[part];
  });
  current[parts[parts.length - 1]] = clampForPath(path, value);
}

function clampForPath(path, value) {
  const definition = stateDefinitions.find((item) => item.key === path);
  if (!definition || definition.type !== "number") return value;
  const min = definition.min == null ? -Infinity : definition.min;
  const max = definition.max == null ? Infinity : definition.max;
  return clamp(Number(value), min, max);
}

function addPath(path, value) {
  const current = Number(getPath(state, path) || 0);
  setPath(state, path, current + Number(value || 0));
}

function startGame(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state = mergeState(createDefaultState(), {
    started: true,
    player: {
      name: String(form.get("playerName") || "旅人").trim().slice(0, 16) || "旅人",
      textStyle: String(form.get("textStyle") || "standard"),
      role: String(form.get("role") || "scribe"),
      origin: String(form.get("origin") || "nanjing"),
      trait: String(form.get("trait") || "calm"),
      difficulty: String(form.get("difficulty") || "standard"),
      gender: String(form.get("gender") || "female"),
      height: String(form.get("height") || "average"),
      build: String(form.get("build") || "slender"),
      bodyLine: String(form.get("bodyLine") || "straight"),
      skinTone: String(form.get("skinTone") || "pale"),
      face: String(form.get("face") || "clear"),
      eyeColor: String(form.get("eyeColor") || "black"),
      hairColor: String(form.get("hairColor") || "black"),
      hairLength: String(form.get("hairLength") || "short"),
      rank: String(form.get("rank") || "commoner"),
      attributePlan: String(form.get("attributePlan") || "balanced"),
      specialOrigin: String(form.get("specialOrigin") || "none"),
      startSeason: String(form.get("startSeason") || "autumn"),
      gameMode: String(form.get("gameMode") || "standard")
    },
    options: { showCheckRate: form.get("showCheckRate") === "on" }
  });
  state.turnNo = 0;
  state.utteranceNo = 0;
  applyCharacterCreation();
  recordUtterance("summary", "開始遊戲", getPassage(), "researcher", "none", 0);
  enterPassage(getPassage(), 0);
  saveState();
  render();
}

function randomizeCharacterForm() {
  const form = $("startForm");
  [
    "gender", "height", "build", "bodyLine", "skinTone", "face", "eyeColor", "hairColor", "hairLength",
    "role", "origin", "trait", "rank", "attributePlan", "specialOrigin", "startSeason", "gameMode", "difficulty", "textStyle"
  ].forEach((name) => {
    const inputs = Array.from(form.querySelectorAll(`input[name="${name}"]`));
    if (!inputs.length) return;
    const picked = inputs[Math.floor(Math.random() * inputs.length)];
    picked.checked = true;
  });
}

function applyCharacterCreation() {
  const seasonStart = {
    spring: { hour: 7, note: "春季開局：雨水讓街路難行，案卷房較早開門。", effects: { fatigue: 1 }, skills: { archive: 1 } },
    summer: { hour: 5, note: "夏季開局：天亮較早，炎熱會提高注目。", effects: { heat: 2, hunger: 1 }, skills: { travel: 1 } },
    autumn: { hour: 6, note: "秋季開局：南京風乾，路線與人名都容易追。", effects: { composure: 2 }, skills: { inquiry: 1 } },
    winter: { hour: 7, note: "冬季開局：寒意拖慢行程，客舍更容易取得消息。", effects: { fatigue: 2, suspicion: -1 }, skills: { influence: 1 } }
  };
  const packages = {
    role: {
      scribe: { skills: { archive: 1 }, dev: { traceability: 6 }, item: "來源索引卡", note: "書吏線人開局：案卷能力提高，取得來源索引卡。" },
      wanderer: { skills: { travel: 1 }, effects: { spirit: 8, fatigue: -4 }, item: "舊路草圖", note: "江湖遊士開局：行路能力提高，身體負擔較低。" },
      merchant: { skills: { inquiry: 1 }, effects: { coin: 5, reputation: 3 }, item: "商旅名帖", note: "商旅耳目開局：探問能力提高，旅費較足。" },
      medic: { skills: { influence: 1 }, effects: { hunger: -4, fatigue: -6, composure: 4 }, item: "醒神藥", note: "醫館學徒開局：鎮定提高，疲勞與飢餓較低。" }
    },
    origin: {
      north: { dev: { smm: 3 }, note: "北路出身：你更容易辨認銀川與關卡線索。" },
      south: { effects: { coin: 2 }, note: "南市出身：你熟悉商旅口音與市集價格。" },
      wudu: { dev: { tms: 3 }, note: "五毒出身：你知道南方藥箋與山門稱呼。" },
      nanjing: { effects: { reputation: 1 }, note: "南京出身：你知道城門、茶舍與案卷房的日常節奏。" }
    },
    trait: {
      calm: { effects: { composure: 8 }, note: "冷靜特質：壓力來時較不容易失序。" },
      streetwise: { effects: { suspicion: -2, heat: -1 }, note: "熟路特質：你知道何時轉巷，何時停步。" },
      silver_tongue: { skills: { influence: 1 }, note: "善談特質：交涉起點提高。" },
      sturdy: { effects: { fatigue: -10, spirit: 4 }, note: "耐勞特質：疲勞累積較慢。" }
    },
    rank: {
      poor: { effects: { coin: -2, suspicion: -1 }, skills: { travel: 1 }, note: "寒門身分：金錢少，但你熟悉低聲交易。" },
      commoner: { effects: { coin: 1 }, note: "平民身分：不惹眼，也不容易被拒於門外。" },
      gentry: { effects: { reputation: 5, suspicion: 2 }, skills: { archive: 1 }, note: "士族旁支：名帖好用，注目也較高。" },
      merchant_house: { effects: { coin: 6, heat: 1 }, skills: { inquiry: 1 }, note: "商戶身分：盤纏足，商路消息較多。" }
    },
    attributePlan: {
      body: { effects: { spirit: 6, fatigue: -6 }, skills: { travel: 1 }, note: "體魄配點：精神與行路提高。" },
      mind: { effects: { composure: 6 }, skills: { archive: 1 }, note: "心智配點：鎮定與案卷提高。" },
      social: { effects: { reputation: 4, suspicion: -1 }, skills: { influence: 1 }, note: "社交配點：名聲與交涉提高。" },
      travel: { effects: { spirit: 3, fatigue: -3 }, skills: { inquiry: 1, travel: 1 }, note: "探索配點：探問與行路提高。" },
      balanced: { effects: { spirit: 2, composure: 2 }, note: "均衡配點：精神與鎮定略升。" }
    },
    specialOrigin: {
      north_contact: { item: "北路舊識名單", flag: "north_contact", skills: { inquiry: 1 }, note: "特殊身世：北路舊識可引出軍路消息。" },
      south_patron: { item: "南市保書", flag: "south_patron", effects: { coin: 2, reputation: 2 }, note: "特殊身世：南市庇護讓初期買賣更順。" },
      wudu_debt: { item: "五毒欠條", flag: "wudu_debt", effects: { suspicion: 1 }, skills: { influence: 1 }, note: "特殊身世：五毒舊債帶來線索，也帶來風險。" },
      office_file: { item: "官署文書副本", flag: "office_file", skills: { archive: 1 }, dev: { traceability: 4 }, note: "特殊身世：官署文書讓案卷線更早展開。" },
      none: { note: "無特殊身世：初期牽連較少。" }
    },
    body: {
      short: { effects: { suspicion: -1 }, note: "身形較矮：混入人群時較不醒目。" },
      tall: { effects: { reputation: 1, heat: 1 }, note: "身形較高：容易被記住。" },
      strong: { effects: { spirit: 4, fatigue: -5 }, note: "體型健壯：長路與工作較不吃力。" },
      soft: { effects: { composure: 2, reputation: 1 }, note: "體型豐潤：儀態親和，交談壓力略低。" },
      slender: { skills: { travel: 1 }, note: "體型纖瘦：穿街過巷較靈活。" },
      balanced: { effects: { spirit: 1, composure: 1 }, note: "體型勻稱：精神與鎮定略升。" },
      firm: { effects: { fatigue: -3 }, note: "線條結實：疲勞壓力略降。" },
      straight: { effects: { heat: -1 }, note: "線條直線：衣裝簡潔，街上注目略降。" },
      soft_curve: { effects: { reputation: 1 }, note: "線條柔和：初見印象較親近。" }
    },
    face: {
      clear: { effects: { suspicion: -1 }, note: "面容清秀：初見時較不易引來敵意。" },
      upright: { effects: { reputation: 2 }, note: "面容端正：人們較願意聽你說完。" },
      sharp: { skills: { inquiry: 1 }, note: "面容銳利：探問時更容易抓住細節。" },
      gentle: { effects: { composure: 2 }, note: "面容溫雅：鎮定略升。" }
    },
    gameMode: {
      story: { effects: { coin: 6, heat: -2, hunger: -6, fatigue: -6 }, note: "劇情模式：資源較寬，適合追劇情線。" },
      survival: { effects: { coin: -4, heat: 3, hunger: 8, fatigue: 6 }, note: "生存模式：資源壓力提高，休息與補給更常被使用。" },
      standard: { note: "標準模式：資源、事件與檢定維持預設值。" }
    },
    difficulty: {
      relaxed: { effects: { coin: 4, heat: -3, suspicion: -2 }, note: "寬鬆難度：初期阻力降低。" },
      pressure: { effects: { coin: -4, heat: 4, hunger: 8, fatigue: 6 }, note: "壓力難度：初期阻力提高。" },
      standard: { note: "標準難度：依一般規則開始。" }
    }
  };

  const start = seasonStart[state.player.startSeason] || seasonStart.autumn;
  state.hour = start.hour;
  applyCreationPackage(start);
  [
    ["role", state.player.role],
    ["origin", state.player.origin],
    ["trait", state.player.trait],
    ["rank", state.player.rank],
    ["attributePlan", state.player.attributePlan],
    ["specialOrigin", state.player.specialOrigin],
    ["body", state.player.height],
    ["body", state.player.build],
    ["body", state.player.bodyLine],
    ["face", state.player.face],
    ["gameMode", state.player.gameMode],
    ["difficulty", state.player.difficulty]
  ].forEach(([group, key]) => applyCreationPackage(packages[group] && packages[group][key]));

  addNote(`外觀：${describeAppearance()}。`);

  Object.keys(state.skills).forEach((key) => {
    state.skills[key] = clamp(Number(state.skills[key] || 0), 0, 9);
  });
}

function applyCreationPackage(pkg) {
  if (!pkg) return;
  applyEffects(pkg.effects);
  applyDev(pkg.dev);
  Object.keys(pkg.skills || {}).forEach((key) => {
    state.skills[key] = Number(state.skills[key] || 0) + Number(pkg.skills[key] || 0);
  });
  if (pkg.item) addUnique(state.items, pkg.item);
  if (pkg.flag) state.flags[pkg.flag] = true;
  if (pkg.note) addNote(pkg.note);
}

function describeAppearance() {
  return [
    labels.genders[state.player.gender],
    labels.heights[state.player.height],
    labels.builds[state.player.build],
    labels.bodyLines[state.player.bodyLine],
    labels.skinTones[state.player.skinTone],
    labels.faces[state.player.face],
    labels.eyeColors[state.player.eyeColor],
    labels.hairColors[state.player.hairColor],
    labels.hairLengths[state.player.hairLength]
  ].filter(Boolean).join("、");
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
  $("passageMeta").textContent = `${p.time} / ${p.location} / 已行動 ${state.turnNo || 0} 回合 / ${formatClock()}`;
  $("passageText").innerHTML = p.text.map((line) => `<p>${esc(applyVars(line))}</p>`).join("") + (state.lastEvent ? `<p class="system-line">${esc(state.lastEvent)}</p>` : "");
  $("choiceList").innerHTML = p.choices.map((choice, index) => renderChoice(choice, index)).join("");
  $("choiceList").querySelectorAll("button[data-choice]").forEach((button) => button.addEventListener("click", () => choose(Number(button.dataset.choice))));
  $("passageFooter").innerHTML = `<span>${esc(p.location)} / 第 ${esc(state.day)} 日 ${esc(formatClock())}</span>`;
}

function renderChoice(choice, index) {
  const prefix = state.options.numberedLinks ? `${index + 1}. ` : "";
  const meta = choice.skill ? ` <span class="choice-meta">[${esc(labels.skills[choice.skill] || choice.skill)} ${choice.dc || 6}${state.options.showCheckRate ? ` / ${estimateCheckChance(choice)}%` : ""}]</span>` : "";
  return `<button type="button" class="link-internal" data-choice="${index}">${esc(prefix + choice.text)}${meta}</button>`;
}

function renderSidebar() {
  const p = getPassage();
  const progress = progressSummary();
  $("overviewBox").innerHTML = `<div class="overview-list"><p><span>角色</span><span>${esc(state.player.name)}</span></p><p><span>身分</span><span>${esc(labels.roles[state.player.role] || state.player.role)}</span></p><p><span>模式</span><span>${esc(labels.modes[state.player.gameMode] || state.player.gameMode)}</span></p><p><span>地點</span><span>${esc(p.location)}</span></p><p><span>日期</span><span>第 ${state.day} 日 ${formatClock()}</span></p><p><span>行動</span><span>${state.turnNo || 0}</span></p><p><span>線索</span><span>${progress.count}/${progress.required}</span></p></div><h3 class="sidebar-subtitle">狀態</h3><div class="sidebar-status">${sidebarStatusRows()}</div>`;
}

function estimateCheckChance(choice) {
  if (!choice.skill) return 100;
  const dc = Number(choice.dc || 6);
  const burden = Math.floor((state.stats.fatigue + state.stats.hunger + state.stats.suspicion + state.stats.heat) / 40);
  const fixed = 3 + (state.skills[choice.skill] || 0) * 2 + Math.floor(state.dev.traceability / 30) - burden;
  let success = 0;
  for (let roll = 1; roll <= 6; roll += 1) {
    if (roll + fixed >= dc) success += 1;
  }
  return Math.round((success / 6) * 100);
}

function sidebarStatusRows() {
  return ["spirit", "composure", "fatigue", "hunger", "heat", "suspicion"].map((key) => {
    const value = clamp(Number(state.stats[key] || 0), 0, 100);
    return `<div class="sidebar-meter"><p><span>${esc(labels.stats[key])}</span><span>${value}</span></p><b><i style="width:${value}%"></i></b></div>`;
  }).join("");
}

function progressSummary() {
  const checks = [
    ["北路關卡", "weifen_lead"],
    ["PC 名字對照", "pc_crosswalk"],
    ["南陽路引", "south_pass"],
    ["魏無忌案卷", "wuji_dossier"],
    ["來源索引卡", "source_index"]
  ];
  const lines = checks.map(([label, flag]) => `${state.flags[flag] ? "已得" : "未得"}：${label}`);
  return { count: checks.filter(([, flag]) => !!state.flags[flag]).length, required: 3, lines };
}

function statMeter(label, value, key) {
  const number = clamp(Number(value || 0), 0, 100);
  const color = key === "suspicion" || key === "heat" ? "red" : key === "fatigue" || key === "hunger" ? "gold" : key === "spirit" ? "blue" : "green";
  return `<div class="stat-name"><span>${esc(label)}</span><span>${number}</span></div><div class="meter ${color}"><span style="width:${number}%"></span></div>`;
}

function canChoose(choice) {
  if (choice.visibility && choice.visibility.length && !evaluateConditions(choice.visibility)) return false;
  if (choice.conditions && choice.conditions.length && !evaluateConditions(choice.conditions)) return false;
  if (choice.req) {
    if (choice.req.item && !state.items.includes(choice.req.item)) return false;
    if (Array.isArray(choice.req.items) && choice.req.items.some((item) => !state.items.includes(item))) return false;
    if (choice.req.flag && !state.flags[choice.req.flag]) return false;
    if (Array.isArray(choice.req.flags) && choice.req.flags.some((flag) => !state.flags[flag])) return false;
    if (choice.req.coin && state.stats.coin < choice.req.coin) return false;
    if (choice.req.stat && Number(getPath(state, choice.req.stat.path)) < Number(choice.req.stat.min || 0)) return false;
  }
  return true;
}

function lockReason(choice) {
  if (choice.req) {
    if (choice.req.item) return `需物品：${choice.req.item}`;
    if (Array.isArray(choice.req.items)) return `需物品：${choice.req.items.join("、")}`;
    if (choice.req.flag) return `需旗標：${choice.req.flag}`;
    if (Array.isArray(choice.req.flags)) return `需旗標：${choice.req.flags.join("、")}`;
    if (choice.req.coin) return `需錢：${choice.req.coin}`;
    if (choice.req.stat) return `需${choice.req.stat.path}達 ${choice.req.stat.min || 0}`;
  }
  return "條件不足";
}

function evaluateConditions(conditions) {
  return normalizeConditionList(conditions).every(evaluateCondition);
}

function evaluateCondition(condition) {
  if (condition.all) return normalizeConditionList(condition.all).every(evaluateCondition);
  if (condition.any) return normalizeConditionList(condition.any).some(evaluateCondition);
  if (condition.not) return !evaluateCondition(condition.not);
  if (condition.op === "at_least_flags") {
    const flags = Array.isArray(condition.flags) ? condition.flags : [];
    return flags.filter((flag) => !!state.flags[flag]).length >= Number(condition.count || 1);
  }
  if (condition.op === "has_item") return state.items.includes(condition.value || condition.item);
  if (condition.op === "not_has_item") return !state.items.includes(condition.value || condition.item);
  const path = condition.path || condition.key;
  const actual = path ? getPath(state, path) : undefined;
  const expected = condition.value;
  switch (condition.op || "==") {
    case ">": return Number(actual) > Number(expected);
    case ">=": return Number(actual) >= Number(expected);
    case "<": return Number(actual) < Number(expected);
    case "<=": return Number(actual) <= Number(expected);
    case "!=":
    case "ne": return actual !== expected;
    case "truthy": return !!actual;
    case "falsy": return !actual;
    case "includes": return Array.isArray(actual) ? actual.includes(expected) : String(actual || "").includes(String(expected));
    case "in": return Array.isArray(expected) && expected.includes(actual);
    case "==":
    case "eq":
    default: return actual === expected || String(actual) === String(expected);
  }
}

function choose(index) {
  const p = getPassage();
  const choice = p.choices[index];
  if (!choice) return;
  if (!canChoose(choice)) {
    showChoiceBlocked(choice, p);
    return;
  }
  if (choice.rest) {
    openRestPanel(choice, p);
    return;
  }
  performChoice(choice, p);
}

function performChoice(choice, p, context) {
  applyEffects(p.on_exit);
  const actionTurnNo = nextActionTurnNo();
  const outcome = resolveChoice(choice);
  const turnNo = recordUtterance(choice.kind || "decision", choice.text, p, "pc", outcome, actionTurnNo);
  state.events.push({
    turn_no: turnNo,
    scene_code: p.code,
    scene_title: p.title,
    choice_text: choice.text,
    to_scene: choice.to,
    outcome,
    rest_plan: context && context.rest ? context.rest : null,
    created_at: new Date().toISOString()
  });
  applyChoice(choice, outcome);
  if (choice.autoRun) runAutoLoops();
  state.passage = outcome === "partial" && choice.failure_passage_code ? choice.failure_passage_code : choice.to;
  if (context && context.rest) {
    applyRestPlan(context.rest);
  } else {
    advanceTime(choice.kind);
  }
  maybeRandomEvent("after_choice");
  enterPassage(getPassage(), actionTurnNo);
  checkThresholdFeedback();
  saveState();
  render();
}

function openRestPanel(choice, scene) {
  const options = buildRestOptions();
  openOverlay("休息至何時", `<p>現在是第 ${esc(state.day)} 日 ${esc(formatClock())}。休息會推進時間，降低疲勞並提高精神，飢餓也會上升。</p><div class="developer-actions">${options.map((option, index) => `<button type="button" data-rest-option="${index}">${esc(option.label)}<span class="choice-meta"> ${option.hours} 小時</span></button>`).join("")}</div>`);
  $("overlayContent").querySelectorAll("[data-rest-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const plan = options[Number(button.dataset.restOption)];
      closeOverlay();
      performChoice(choice, scene, { rest: plan });
    });
  });
}

function buildRestOptions() {
  return [
    { label: "小睡兩小時", hours: 2 },
    { label: "休息四小時", hours: 4 },
    restUntil("清晨", 6),
    restUntil("正午", 12),
    restUntil("黃昏", 18),
    restUntil("入夜", 22)
  ];
}

function restUntil(label, targetHour) {
  let hours = Number(targetHour) - Number(state.hour || 0);
  if (hours <= 0) hours += 24;
  return { label: `休息到${label}`, hours, targetHour };
}

function applyRestPlan(plan) {
  const hours = clamp(Number(plan.hours || 1), 1, 24);
  const dayBefore = state.day;
  advanceClock(hours);
  applyEffects({
    spirit: Math.min(36, hours * 4),
    composure: Math.min(28, hours * 3),
    fatigue: -Math.min(70, hours * 8),
    hunger: Math.ceil(hours * 1.5),
    suspicion: hours >= 6 ? -1 : 0,
    heat: hours >= 8 ? -1 : 0
  });
  applyNeedsPressure();
  if (state.day > dayBefore) runRuntimeEvent("daily");
  addNote(`${plan.label}：休息 ${hours} 小時，現在是第 ${state.day} 日 ${formatClock()}。`);
}

function showChoiceBlocked(choice, scene) {
  state.lastEvent = `${choice.text}：${lockReason(choice)}`;
  addNote(state.lastEvent);
  recordUtterance("clarification", state.lastEvent, scene, "researcher", "blocked_choice", state.turnNo || 0);
  saveState();
  render();
}

function resolveChoice(choice) {
  if (!choice.skill) return "none";
  const burden = Math.floor((state.stats.fatigue + state.stats.hunger + state.stats.suspicion + state.stats.heat) / 40);
  const roll = 1 + Math.floor(Math.random() * 6);
  const score = roll + 3 + (state.skills[choice.skill] || 0) * 2 + Math.floor(state.dev.traceability / 30) - burden;
  const success = score >= (choice.dc || 6);
  if (success) {
    state.skills[choice.skill] = clamp((state.skills[choice.skill] || 0) + 1, 0, 9);
    applyDev({ smm: 1, tms: 1, traceability: 1 });
    addNote(`檢定 ${labels.skills[choice.skill] || choice.skill}：${score}/${choice.dc || 6}，成功。`);
    return "success";
  }
  applyEffects({ composure: -3, suspicion: 2, heat: 1 });
  addNote(`檢定 ${labels.skills[choice.skill] || choice.skill}：${score}/${choice.dc || 6}，代價上升。`);
  return "partial";
}

function applyChoice(choice, outcome) {
  applyEffects(choice.effects);
  applyDev(choice.dev);
  if (outcome === "success") applyEffects(choice.on_success || choice.success_effects);
  if (outcome === "partial") applyEffects(choice.on_failure || choice.failure_effects);
  if (choice.item) addUnique(state.items, choice.item);
  if (choice.note) addNote(choice.note);
  if (choice.flag) state.flags[choice.flag] = true;
  if (outcome === "success") addNote(`檢定成功：${choice.text}`);
  if (outcome === "partial") addNote(`檢定僅部分成功：${choice.text}`);
}

function applyEffects(effects) {
  const parsed = normalizeEffectsSpec(effects);
  if (Array.isArray(parsed)) {
    parsed.forEach(applyEffect);
    return;
  }
  Object.keys(parsed || {}).forEach((key) => {
    state.stats[key] = clamp(Number(state.stats[key] || 0) + Number(parsed[key] || 0), key === "coin" ? -99 : 0, key === "coin" ? 999 : 100);
  });
}

function applyEffect(effect) {
  if (!effect || typeof effect !== "object") return;
  const op = effect.op || "add";
  if (op === "add") {
    addPath(effect.path, effect.value);
    return;
  }
  if (op === "set") {
    setPath(state, effect.path, effect.value);
    return;
  }
  if (op === "toggle") {
    setPath(state, effect.path, !getPath(state, effect.path));
    return;
  }
  if (op === "push_unique" || op === "add_item") {
    const listPath = effect.path || "items";
    const list = getPath(state, listPath);
    if (Array.isArray(list)) addUnique(list, effect.value || effect.item);
    return;
  }
  if (op === "remove_item") {
    state.items = state.items.filter((item) => item !== (effect.value || effect.item));
    return;
  }
  if (op === "set_flag") {
    state.flags[effect.flag || effect.path] = effect.value !== false;
    return;
  }
  if (op === "note" || op === "add_note") {
    addNote(effect.value || effect.text);
    return;
  }
  if (op === "advance_time") {
    advanceClock(Number(effect.hours || effect.value || 1));
    return;
  }
  if (op === "add_relation") {
    const npcCode = effect.npc_code || effect.npc || effect.target;
    const metric = effect.metric || effect.relation_key || "trust";
    if (!npcCode) return;
    if (!state.relations[npcCode]) state.relations[npcCode] = {};
    const path = `relations.${npcCode}.${metric}`;
    addPath(path, Number(effect.value || 0));
  }
}

function applyDev(dev) {
  Object.keys(dev || {}).forEach((key) => {
    state.dev[key] = clamp(Number(state.dev[key] || 0) + Number(dev[key] || 0), 0, 100);
  });
}

function advanceTime(kind) {
  const delta = kind === "action" ? 2 : kind === "decision" ? 2 : kind === "question" ? 2 : 1;
  const dayBefore = state.day;
  advanceClock(delta);
  applyEffects({ hunger: 1, fatigue: 1 });
  applyNeedsPressure();
  if (state.day > dayBefore) runRuntimeEvent("daily");
}

function advanceClock(hours) {
  state.hour += Number(hours || 0);
  if (state.hour >= 24) {
    const extraDays = Math.floor(state.hour / 24);
    state.hour = state.hour % 24;
    state.day += extraDays;
  }
  while (state.hour < 0) {
    state.hour += 24;
    state.day = Math.max(1, state.day - 1);
  }
}

function maybeRandomEvent(trigger) {
  state.lastEvent = "";
  if (!state.options.randomEvents) return;
  if (eventPools.length) {
    runRuntimeEvent(trigger || "after_choice");
    return;
  }
  if (state.turnNo % 3 !== 0 || randomEvents.length === 0) return;
  const event = randomEvents[state.turnNo % randomEvents.length];
  state.lastEvent = event.text;
  applyEffects(event.effects || {});
  applyDev(event.dev || {});
  const p = getPassage();
  const turnNo = recordUtterance("narration", event.text, { code: p.code, title: p.title, location: p.location }, "gm", event.key || "random_event", state.turnNo || 0);
  state.events.push({
    turn_no: turnNo,
    scene_code: p.code,
    scene_title: event.key || "random_event",
    choice_text: event.text,
    to_scene: state.passage,
    created_at: new Date().toISOString()
  });
}

function applyNeedsPressure() {
  if (state.stats.hunger >= 85) {
    applyEffects({ spirit: -6, composure: -3, fatigue: 4 });
    addNote("飢餓過高，行動品質下降。");
  }
  if (state.stats.fatigue >= 90) {
    applyEffects({ spirit: -8, composure: -4, suspicion: 1 });
    addNote("疲勞過高，檢定負擔增加。");
  }
  if (state.stats.heat >= 35) {
    applyEffects({ suspicion: 2, composure: -2 });
    addNote("注目偏高，官署與驛站行動風險增加。");
  }
  if (state.stats.spirit <= 5 || state.stats.composure <= 5) {
    state.passage = "Night";
    applyEffects({ fatigue: 8, hunger: 5 });
    addNote("精神或鎮定見底，你被迫回客舍休整。");
  }
}

function checkThresholdFeedback() {
  const messages = [
    thresholdFeedback("fatigue_75", state.stats.fatigue >= 75, "疲勞已到高檔，長途行動與檢定會更吃力。"),
    thresholdFeedback("hunger_70", state.stats.hunger >= 70, "飢餓已影響判斷，休息前最好補給。"),
    thresholdFeedback("heat_25", state.stats.heat >= 25, "注目升高，官署、驛站與差人事件更容易壓過來。"),
    thresholdFeedback("reputation_45", state.stats.reputation >= 45, "名聲已累積到能換取更多協助。"),
    thresholdFeedback("spirit_15", state.stats.spirit <= 15, "精神偏低，冒險行動會更容易失誤。"),
    thresholdFeedback("composure_15", state.stats.composure <= 15, "鎮定偏低，交涉與盤問的代價會提高。")
  ].filter(Boolean);
  if (messages.length && !state.lastEvent) state.lastEvent = messages[messages.length - 1];
}

function thresholdFeedback(key, condition, message) {
  if (condition && !state.feedbackSeen[key]) {
    state.feedbackSeen[key] = true;
    addNote(message);
    return message;
  }
  if (!condition && state.feedbackSeen[key]) state.feedbackSeen[key] = false;
  return "";
}

function runRuntimeEvent(trigger) {
  const candidates = [];
  eventPools.forEach((pool) => {
    if (pool.trigger !== trigger) return;
    if (pool.conditions.length && !evaluateConditions(pool.conditions)) return;
    pool.entries.forEach((entry) => {
      if (!isEventEntryAvailable(entry)) return;
      if (entry.conditions.length && !evaluateConditions(entry.conditions)) return;
      candidates.push({ pool, entry });
    });
  });
  const selected = weightedPick(candidates);
  if (!selected) return;
  applyRuntimeEvent(selected.pool, selected.entry);
}

function isEventEntryAvailable(entry) {
  const key = eventMemoryKey(entry);
  if ((state.eventMemory.cooldownUntil[key] || 0) > state.turnNo) return false;
  const dayKey = `${state.day}:${key}`;
  if (entry.max_triggers_per_day && (state.eventMemory.dayCounts[dayKey] || 0) >= entry.max_triggers_per_day) return false;
  return true;
}

function weightedPick(candidates) {
  const total = candidates.reduce((sum, item) => sum + item.entry.weight, 0);
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const candidate of candidates) {
    roll -= candidate.entry.weight;
    if (roll <= 0) return candidate;
  }
  return candidates[candidates.length - 1] || null;
}

function applyRuntimeEvent(pool, entry) {
  const key = eventMemoryKey(entry);
  const p = getPassage();
  state.lastEvent = entry.text || entry.title;
  applyEffects(entry.effects);
  const turnNo = recordUtterance("narration", state.lastEvent, { code: p.code, title: entry.title || pool.name, location: p.location }, "gm", key, state.turnNo || 0);
  state.events.push({
    turn_no: turnNo,
    scene_code: p.code,
    scene_title: entry.title || pool.name,
    choice_text: state.lastEvent,
    to_scene: entry.passage_id || state.passage,
    event_pool: pool.id,
    event_id: key,
    runtime_event: true,
    created_at: new Date().toISOString()
  });
  state.eventMemory.counts[key] = (state.eventMemory.counts[key] || 0) + 1;
  const dayKey = `${state.day}:${key}`;
  state.eventMemory.dayCounts[dayKey] = (state.eventMemory.dayCounts[dayKey] || 0) + 1;
  if (entry.cooldown_turns) state.eventMemory.cooldownUntil[key] = state.turnNo + entry.cooldown_turns;
  if (entry.passage_id && passages[entry.passage_id]) state.passage = entry.passage_id;
}

function eventMemoryKey(entry) {
  return entry.event_id || entry.passage_id || entry.title || entry.text;
}

function runAutoLoops() {
  for (let i = state.auto.generated + 1; i <= state.auto.limit; i += 1) {
    const seed = routeCycle[(i - 1) % routeCycle.length];
    addUnique(state.items, seed.item);
    addNote(`第${i}輪：${seed.note}`);
    applyDev({ smm: 2, tms: 2, traceability: 4 });
    applyEffects({ fatigue: 1, hunger: 1, composure: 1 });
    const scene = { code: `SCN-AUTO-${String(i).padStart(3, "0")}`, title: `第${i}輪：${seed.title}`, location: seed.location };
    const autoTurnNo = nextActionTurnNo();
    const turnNo = recordUtterance("summary", `整理${seed.location}線索：${seed.note}`, scene, "pc", "auto_loop", autoTurnNo);
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
    text: [`${seed.location}的線索被重新抄入札記。`, `${state.player.name}把人物、地點、時間與來源排成同一列。`, `這是第 ${loopNo} 輪長線延伸，會留下完整遊玩紀錄。`],
    choices: [ch(`整理${seed.title}`, next, "summary", { composure: 1, fatigue: 1 }, { smm: 2, tms: 2, traceability: 4 }, { item: seed.item, note: seed.note }), ch("暫停輪迴，回夜宿札記", "Night", "decision", { composure: 1 }, { traceability: 2 })]
  };
}

function makeAutoEnd() {
  return {
    code: "SCN-AUTO-END",
    title: "長線札記收束",
    time: "長線收束",
    location: "南京客舍",
    tags: ["ending", "route"],
    text: [`${state.player.name}把長線札記疊在桌上。`, `目前已生成 ${state.auto.generated}/${state.auto.limit} 輪自動劇情。`, "可繼續遊玩，也可由研究者面板處理紀錄。"],
    choices: [ch("回南京城門重新入局", "Gate", "decision", { spirit: 2, composure: 2 }, { smm: 1, tms: 1, traceability: 2 }), ch("回夜宿札記", "Night", "summary", { composure: 2 }, { traceability: 2 }), ch("從第一輪手動重走", "Auto-1", "decision", { spirit: -1 }, { traceability: 2 })]
  };
}

function getPassage() {
  if (state.passage === "AutoEnd") return makeAutoEnd();
  const match = /^Auto-(\d+)$/.exec(state.passage || "");
  if (match) return makeAutoPassage(clamp(Number(match[1]), 1, state.auto.limit));
  return passages[state.passage] || passages.Gate || Object.values(passages)[0];
}

function enterPassage(scene, turnNo) {
  if (!scene) return;
  applyEffects(scene.on_enter);
  recordPassageNarration(scene, turnNo);
}

function recordPassageNarration(scene, turnNo) {
  if (!scene || state.narrated[scene.code]) return;
  state.narrated[scene.code] = true;
  recordUtterance("narration", (scene.text || []).map(applyVars).join("\n"), scene, "gm", "scene_enter", turnNo == null ? state.turnNo || 0 : turnNo);
}

function recordUtterance(kind, text, scene, source, outcome, turnNo) {
  const usedTurnNo = turnNo == null ? Number(state.turnNo || 0) : Number(turnNo || 0);
  const utteranceNo = nextUtteranceNo();
  const safeScene = scene || getPassage();
  const sourceInfo = speakerForSource(source);
  const fn = normalizeFunction(kind);
  state.utterances.push({
    project_code: corpusConfig.project_code,
    team_code: corpusConfig.team_code,
    session_code: corpusConfig.session_code,
    turn_no: usedTurnNo,
    sub_turn_no: utteranceNo,
    utterance_code: utteranceCode(utteranceNo),
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
    scene_code: safeScene.code,
    scene_title: safeScene.title,
    location: safeScene.location,
    source,
    outcome: outcome || "none",
    smm_score: state.dev.smm,
    tms_score: state.dev.tms,
    traceability_score: state.dev.traceability,
    created_at: new Date().toISOString()
  });
  return usedTurnNo;
}

function speakerForSource(source) {
  if (source === "gm") return { speaker_type: "GM", speaker_code: corpusConfig.gm_code, speaker_label_raw: "GM" };
  if (source === "researcher") return { speaker_type: "Researcher", speaker_code: corpusConfig.researcher_code, speaker_label_raw: "Researcher" };
  return { speaker_type: "PC", speaker_code: state.player.character_code, speaker_label_raw: state.player.name };
}

function handleAction(action, panel) {
  if (action === "panel") {
    openSidePanel(panel);
    return;
  }
  if (action === "save") {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    openOverlay("保存", "<p>已保存到瀏覽器 localStorage。</p>");
  }
  if (action === "load") loadManualSave();
  if (action === "settings") openSettings();
  if (action === "restart") restartGame();
  if (action === "developer") openDeveloper();
}

function openSidePanel(panel) {
  if (panel === "attributes") return openAttributesPanel();
  if (panel === "social") return openSocialPanel();
  if (panel === "traits") return openTraitsPanel();
  if (panel === "journal") return openJournalPanel();
  if (panel === "stats") return openStatsPanel();
  if (panel === "achievements") return openAchievementsPanel();
  if (panel === "options") return openSettings();
  if (panel === "saves") return openSavesPanel();
  if (panel === "researcher") return openResearcherPanel();
  openJournalPanel();
}

function openAttributesPanel() {
  openOverlay("屬性", `<div class="panel-grid"><section><h3>狀態</h3>${["spirit", "composure", "suspicion", "fatigue", "hunger", "heat", "reputation"].map((key) => statMeter(labels.stats[key], state.stats[key], key)).join("")}<div class="panel-list"><p><span>錢</span><span>${esc(state.stats.coin)}</span></p></div></section><section><h3>技能</h3><div class="panel-list">${Object.keys(labels.skills).map((key) => `<p><span>${esc(labels.skills[key])}</span><span>${esc(state.skills[key])}</span></p>`).join("")}</div><h3>回饋</h3><div class="panel-list">${attributeFeedbackRows()}</div></section></div>`);
}

function attributeFeedbackRows() {
  const rows = [];
  if (state.stats.fatigue >= 75) rows.push(["疲勞", "長途行動與檢定更吃力"]);
  if (state.stats.hunger >= 70) rows.push(["飢餓", "休息前最好先補給"]);
  if (state.stats.heat >= 25) rows.push(["注目", "官署與驛站風險提高"]);
  if (state.stats.reputation >= 45) rows.push(["名聲", "可換取更多協助"]);
  if (state.stats.spirit <= 15) rows.push(["精神", "冒險行動更容易失誤"]);
  if (state.stats.composure >= 70) rows.push(["鎮定", "談判與整理線索更有餘裕"]);
  return profileRows(rows.length ? rows : [["目前", "狀態仍可控制"]]);
}

function profileRows(rows) {
  return rows.map(([label, value]) => `<p><span>${esc(label)}</span><span>${esc(value || "")}</span></p>`).join("");
}

function researcherRuntimeRows() {
  const runtimeManifest = window.DaGoRuntimeManifest || {};
  const manifestSource = activeManifest.metadata && activeManifest.metadata.source ? activeManifest.metadata.source : "fallback";
  const format = activeManifest.bundle_format || activeManifest.manifest_format || "fallback";
  return profileRows([
    ["Engine", ENGINE_VERSION],
    ["Runtime", runtimeManifest.runtime_version || "local"],
    ["Source", manifestSource],
    ["Format", format],
    ["Utterance", state.utterances.length],
    ["Events", state.events.length],
    ["SMM", state.dev.smm],
    ["TMS", state.dev.tms],
    ["追溯", state.dev.traceability]
  ]);
}

function openSocialPanel() {
  const relationRows = Object.keys(state.relations || {}).map((code) => {
    const relation = state.relations[code] || {};
    const definition = relationshipDefinitions.find((item) => item.npc_code === code);
    const name = definition ? definition.npc_name : code;
    const values = Object.keys(relation).map((key) => `${key} ${relation[key]}`).join("，") || "尚無資料";
    return `<p><span>${esc(name)}</span><span>${esc(values)}</span></p>`;
  }).join("");
  openOverlay("社交", `<div class="panel-list"><p><span>名聲</span><span>${esc(state.stats.reputation)}</span></p><p><span>疑心</span><span>${esc(state.stats.suspicion)}</span></p><p><span>注目</span><span>${esc(state.stats.heat)}</span></p>${relationRows || "<p><span>NPC 關係</span><span>尚未建立</span></p>"}</div>`);
}

function openTraitsPanel() {
  openOverlay("特質", `<div class="panel-grid"><section><h3>身體</h3><div class="panel-list">${profileRows([["性別", labels.genders[state.player.gender]], ["身高", labels.heights[state.player.height]], ["體型", labels.builds[state.player.build]], ["線條", labels.bodyLines[state.player.bodyLine]], ["膚色", labels.skinTones[state.player.skinTone]]])}</div></section><section><h3>頭部</h3><div class="panel-list">${profileRows([["面容", labels.faces[state.player.face]], ["瞳色", labels.eyeColors[state.player.eyeColor]], ["髮色", labels.hairColors[state.player.hairColor]], ["髮長", labels.hairLengths[state.player.hairLength]]])}</div></section><section><h3>背景</h3><div class="panel-list">${profileRows([["名字", state.player.name], ["身分", labels.roles[state.player.role] || state.player.role], ["出身", labels.origins[state.player.origin] || state.player.origin], ["品級", labels.ranks[state.player.rank] || state.player.rank], ["特質", labels.traits[state.player.trait] || state.player.trait], ["配點", labels.attributePlans[state.player.attributePlan] || state.player.attributePlan], ["身世", labels.specialOrigins[state.player.specialOrigin] || state.player.specialOrigin]])}</div></section><section><h3>遊戲</h3><div class="panel-list">${profileRows([["時節", labels.seasons[state.player.startSeason] || state.player.startSeason], ["模式", labels.modes[state.player.gameMode] || state.player.gameMode], ["難度", labels.difficulties[state.player.difficulty] || state.player.difficulty], ["成功率", state.options.showCheckRate ? "顯示" : "隱藏"]])}</div></section></div><h3>物品</h3><div class="panel-list">${state.items.map((item) => `<p><span>${esc(item)}</span><span>持有</span></p>`).join("") || "<p><span>物品</span><span>無</span></p>"}</div>`);
}

function openJournalPanel() {
  const progress = progressSummary();
  const notes = state.notes.slice(0, 18).map((note) => `<p><span>${esc(note)}</span><span></span></p>`).join("");
  openOverlay("日誌", `<h3>線索</h3><div class="panel-list">${progress.lines.map((line) => `<p><span>${esc(line)}</span><span></span></p>`).join("")}</div><h3>紀錄</h3><div class="panel-list">${notes || "<p><span>尚無紀錄</span><span></span></p>"}</div>`);
}

function openStatsPanel() {
  const progress = progressSummary();
  openOverlay("統計", `<div class="panel-list"><p><span>行動回合</span><span>${esc(state.turnNo || 0)}</span></p><p><span>已得線索</span><span>${progress.count}/${progress.required}</span></p><p><span>日期</span><span>第 ${esc(state.day)} 日 ${esc(formatClock())}</span></p><p><span>自動札記</span><span>${esc(state.auto.generated)}/${esc(state.auto.limit)}</span></p><p><span>模式</span><span>${esc(labels.modes[state.player.gameMode] || state.player.gameMode)}</span></p><p><span>難度</span><span>${esc(labels.difficulties[state.player.difficulty] || state.player.difficulty)}</span></p></div>`);
}

function openAchievementsPanel() {
  const rows = [
    ["北路關卡", !!state.flags.weifen_lead],
    ["人物對照", !!state.flags.pc_crosswalk],
    ["南陽路引", !!state.flags.south_pass],
    ["案卷摘記", !!state.flags.wuji_dossier],
    ["來源索引", !!state.flags.source_index],
    ["結案札記", progressSummary().count >= progressSummary().required],
    ["長線札記", !!state.auto.completed]
  ].map(([label, unlocked]) => `<p><span>${esc(label)}</span><span>${unlocked ? "已取得" : "未取得"}</span></p>`).join("");
  openOverlay("成就", `<div class="panel-list">${rows}</div>`);
}

function openSavesPanel() {
  openOverlay("存檔", `<div class="developer-actions"><button id="panelSave" type="button">保存</button><button id="panelLoad" type="button">載入</button><button id="panelRestart" type="button">重來</button><button id="panelExport" type="button">下載備份</button></div><p>保存與載入使用瀏覽器 localStorage。備份檔只保存目前遊戲狀態。</p>`);
  $("panelSave").addEventListener("click", () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    openOverlay("存檔", "<p>已保存到瀏覽器 localStorage。</p>");
  });
  $("panelLoad").addEventListener("click", loadManualSave);
  $("panelRestart").addEventListener("click", restartGame);
  $("panelExport").addEventListener("click", () => downloadText("da_go_save.json", JSON.stringify(state, null, 2), "application/json;charset=utf-8"));
}

function openResearcherPanel() {
  const code = `USR-${Date.now()}`;
  openOverlay("研究者劇情", `<div class="panel-list">${researcherRuntimeRows()}</div><div class="editor-grid"><label>段落代碼<input id="storyCode" type="text" value="${esc(code)}"></label><label>標題<input id="storyTitle" type="text" value="研究者新增段落"></label><label>地點<input id="storyLocation" type="text" value="${esc(getPassage().location || "南京")}"></label><label>時間<input id="storyTime" type="text" value="研究者輸入"></label><label>選項文字<input id="storyChoiceText" type="text" value="回到南京城門"></label><label>選項目標<input id="storyChoiceTarget" type="text" value="Gate"></label></div><label>劇情正文<textarea id="storyBody">請在此輸入研究者編寫的劇情。每一行會保存成 passage 文字。</textarea></label><label>Corpus API<input id="storyApiUrl" type="url" value="http://localhost:8787/api/researcher-stories"></label><div class="editor-actions"><button id="addStoryPassage" type="button">加入本機遊戲</button><button id="sendStoryToCorpus" type="button">送入 trpg-corpus</button><button id="downloadStoryBundle" type="button">下載劇情 JSON</button><button id="openDeveloperPanel" type="button">研究資料輸出</button></div><div id="researcherResult" class="feedback-list"></div>`);
  $("addStoryPassage").addEventListener("click", addResearcherPassage);
  $("sendStoryToCorpus").addEventListener("click", sendResearcherStory);
  $("downloadStoryBundle").addEventListener("click", () => downloadText(`da_go_researcher_story_${$("storyCode").value.trim() || code}.json`, JSON.stringify(buildResearcherStoryPayload(), null, 2), "application/json;charset=utf-8"));
  $("openDeveloperPanel").addEventListener("click", openDeveloper);
}

function buildResearcherStoryPayload() {
  const passageCode = normalizeStoryCode($("storyCode").value || `USR-${Date.now()}`);
  const title = $("storyTitle").value.trim() || "研究者新增段落";
  const location = $("storyLocation").value.trim() || getPassage().location || "南京";
  const time = $("storyTime").value.trim() || "研究者輸入";
  const body = $("storyBody").value.trim() || "研究者尚未輸入正文。";
  const choiceText = $("storyChoiceText").value.trim() || "回到南京城門";
  const target = normalizeStoryCode($("storyChoiceTarget").value || "Gate");
  return {
    story_code: `DAGO-STORY-${passageCode}`,
    story_json_format: "da_go_researcher_story_v1",
    metadata: {
      engine_version: ENGINE_VERSION,
      database_name: corpusConfig.database_name,
      project_code: corpusConfig.project_code,
      team_code: corpusConfig.team_code,
      session_code: corpusConfig.session_code,
      submitted_at: new Date().toISOString(),
      source: "da_go_researcher_panel"
    },
    config: corpusConfig,
    passages: [
      {
        id: passageCode,
        passage_code: passageCode,
        title,
        location,
        time_slot: time,
        body,
        tags: ["researcher", "manual"],
        on_enter: [],
        on_exit: [],
        is_start: false,
        is_terminal: false,
        sort_order: Object.keys(passages).length + 100,
        choices: [
          {
            id: `${passageCode}-CHOICE-1`,
            choice_code: `${passageCode}-CHOICE-1`,
            text: choiceText,
            target,
            utterance_function: "decision",
            conditions: [],
            effects: [],
            visibility: [],
            sort_order: 1
          }
        ]
      }
    ],
    auto_load: true
  };
}

function normalizeStoryCode(value) {
  const cleaned = String(value || "").trim().replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || `USR-${Date.now()}`;
}

function addResearcherPassage() {
  const payload = buildResearcherStoryPayload();
  const rawPassage = payload.passages[0];
  const manifest = clone(activeManifest);
  if (Array.isArray(manifest.passages)) {
    manifest.passages = manifest.passages.filter((passage) => (passage.id || passage.passage_code || passage.code) !== rawPassage.passage_code);
    manifest.passages.push(rawPassage);
  } else {
    manifest.passages = Object.assign({}, manifest.passages || {});
    manifest.passages[rawPassage.passage_code] = rawPassage;
  }
  manifest.metadata = Object.assign({}, manifest.metadata || {}, { source: "researcher-local", updated_at: new Date().toISOString() });
  persistManifest(manifest);
  state.passage = rawPassage.passage_code;
  delete state.narrated[rawPassage.passage_code];
  state.lastEvent = `已加入研究者段落：${rawPassage.title}`;
  addNote(state.lastEvent);
  saveState();
  render();
  $("researcherResult").innerHTML = `<p><span>本機段落</span><span>${esc(rawPassage.passage_code)}</span></p>`;
}

async function sendResearcherStory() {
  const payload = buildResearcherStoryPayload();
  const url = $("storyApiUrl").value.trim() || "http://localhost:8787/api/researcher-stories";
  $("researcherResult").innerHTML = "<p><span>送出中</span><span>等待 API 回應</span></p>";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story_code: payload.story_code, story_json: payload, auto_load: true })
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
    $("researcherResult").innerHTML = `<p><span>已送出</span><span>${esc(response.status)}</span></p><pre>${esc(text)}</pre>`;
  } catch (error) {
    $("researcherResult").innerHTML = `<p><span>送出失敗</span><span>${esc(error.message)}</span></p>`;
  }
}

function loadManualSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      openOverlay("載入", "<p>尚無手動保存。</p>");
      return;
    }
    state = mergeState(createDefaultState(), JSON.parse(raw));
    saveState();
    render();
    openOverlay("載入", "<p>已載入手動保存。</p>");
  } catch (error) {
    openOverlay("載入失敗", `<pre>${esc(error.message)}</pre>`);
  }
}

function restartGame() {
  localStorage.removeItem(STORAGE_KEY);
  state = createDefaultState();
  closeOverlay();
  render();
}

function resetStateForManifest() {
  const previous = state || {};
  state = mergeState(createDefaultState(), {
    started: !!previous.started,
    player: previous.player || defaultState.player,
    options: previous.options || defaultState.options
  });
  state.passage = startPassageKey();
  state.narrated = {};
  state.lastEvent = "";
}

function openSettings() {
  openOverlay("設定", `<div class="settings-grid"><label>文字外觀<select id="settingTextStyle">${Object.keys(labels.styles).map((key) => `<option value="${key}" ${state.player.textStyle === key ? "selected" : ""}>${labels.styles[key]}</option>`).join("")}</select></label><label class="checkline"><input type="checkbox" id="settingNumbered" ${state.options.numberedLinks ? "checked" : ""}> 選項編號</label><label class="checkline"><input type="checkbox" id="settingRandom" ${state.options.randomEvents ? "checked" : ""}> 隨機街頭事件</label><label class="checkline"><input type="checkbox" id="settingCheckRate" ${state.options.showCheckRate ? "checked" : ""}> 顯示技能檢定成功率</label></div><p><button type="button" id="applySettings">套用</button></p>`);
  $("applySettings").addEventListener("click", () => {
    state.player.textStyle = $("settingTextStyle").value;
    state.options.numberedLinks = $("settingNumbered").checked;
    state.options.randomEvents = $("settingRandom").checked;
    state.options.showCheckRate = $("settingCheckRate").checked;
    saveState();
    closeOverlay();
    render();
  });
}

function openDeveloper() {
  const data = buildCorpus();
  openOverlay("研究資料 / TRPG Corpus", `<div class="dev-grid"><p><strong>Engine</strong><span>${ENGINE_VERSION}</span></p><p><strong>Utterance</strong><span>${state.utterances.length}</span></p><p><strong>Events</strong><span>${state.events.length}</span></p><p><strong>SMM</strong><span>${state.dev.smm}</span></p><p><strong>TMS</strong><span>${state.dev.tms}</span></p><p><strong>追溯</strong><span>${state.dev.traceability}</span></p></div><div class="developer-actions"><button id="copyJson" type="button">複製 JSON</button><button id="downloadJson" type="button">下載 JSON</button><button id="downloadCsv" type="button">下載 staging CSV</button></div><section class="settings-grid"><label>Runtime bundle / manifest JSON<input id="manifestFile" type="file" accept="application/json,.json"></label><label>Runtime API URL<input id="manifestUrl" type="url" value="http://localhost:8787/api/runtime-bundle?project_code=${esc(corpusConfig.project_code)}&team_code=${esc(corpusConfig.team_code)}"></label><button id="loadManifestUrl" type="button">讀取資料</button><button id="clearManifest" type="button">清除資料</button></section><details open><summary>輸出預覽</summary><pre>${esc(JSON.stringify(data, null, 2))}</pre></details>`);
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
    stateDefinitions = normalizeStateDefinitions(activeManifest.states);
    relationshipDefinitions = normalizeRelationshipDefs(activeManifest.relationship_defs, activeManifest.npcs);
    eventPools = normalizeEventPools(activeManifest.event_pools);
    resetStateForManifest();
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
      source_bundle_format: activeManifest.bundle_format || "unknown",
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
  resetStateForManifest();
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
  resetStateForManifest();
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
