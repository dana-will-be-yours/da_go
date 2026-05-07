const STORAGE_KEY = "daGoPlayableStateV1";
const SAVE_KEY = "daGoPlayableSaveV1";
const ENGINE_VERSION = "0.6.0-nanjing-playable";

const corpusConfig = {
  project_code: "TRPG-PROJ-DAGUO",
  team_code: "TEAM-DAGUO-FOOTSTEPS",
  team_name: "大國年代記正史足跡 Team",
  session_code: "DA20-NANJING-GAME-001",
  import_batch_code: "DAGUO_DA20_NANJING_UTT_001",
  database_name: "TRPG_Corpus_DB"
};

const sourceDocuments = [
  {
    code: "SRC-DAGUO-FOOTSTEPS",
    title: "【大國年代記】正史足跡",
    source_type: "trpg_transcript",
    local_path: "C:\\Users\\sun\\Documents\\New project\\da_go\\【大國年代記】正史足跡.html"
  },
  {
    code: "SRC-DOL-UI-ZIP",
    title: "Degrees of Lewdity 0.5.9.8 text only",
    source_type: "ui_reference",
    local_path: "C:\\Users\\sun\\Documents\\New project\\da_go\\Degrees of Lewdity 0.5.9.8 text only.zip"
  },
  {
    code: "SRC-DOL-MASTER-ZIP",
    title: "degrees-of-lewdity-master",
    source_type: "ui_reference",
    local_path: "C:\\Users\\sun\\Documents\\New project\\da_go\\degrees-of-lewdity-master.zip"
  }
];

const teamMembers = [
  {
    player_code: "PLAYER-DANA",
    player_name: "大拿",
    participant_role: "gm",
    member_code: "TM-DAGUO-DANA",
    member_role: "gm",
    is_gm: true,
    is_player: false,
    is_researcher: true
  },
  {
    player_code: "PLAYER-LIS",
    player_name: "莉絲",
    participant_role: "player",
    member_code: "TM-DAGUO-LIS",
    member_role: "player",
    is_gm: false,
    is_player: true,
    is_researcher: false
  },
  {
    player_code: "PLAYER-PUMPKIN",
    player_name: "南瓜",
    participant_role: "player",
    member_code: "TM-DAGUO-PUMPKIN",
    member_role: "player",
    is_gm: false,
    is_player: true,
    is_researcher: false
  },
  {
    player_code: "PLAYER-ZOLA",
    player_name: "佐拉",
    participant_role: "player",
    member_code: "TM-DAGUO-ZOLA",
    member_role: "player",
    is_gm: false,
    is_player: true,
    is_researcher: false
  }
];

const sourceCharacters = [
  {
    character_code: "PC-DAGUO-YANGYUE",
    character_name: "陽月",
    team_member_code: "TM-DAGUO-LIS",
    player_code: "PLAYER-LIS",
    aliases: ["陽月"]
  },
  {
    character_code: "PC-DAGUO-CHUFU-CHULISHI",
    character_name: "楚服 / 楚璃詩",
    team_member_code: "TM-DAGUO-PUMPKIN",
    player_code: "PLAYER-PUMPKIN",
    aliases: ["楚服", "楚璃詩"]
  },
  {
    character_code: "PC-DAGUO-HUAQIONGYAO",
    character_name: "花瓊瑤",
    team_member_code: "TM-DAGUO-ZOLA",
    player_code: "PLAYER-ZOLA",
    aliases: ["花瓊瑤"]
  }
];

const textStyles = {
  standard: "標準",
  scroll: "書卷",
  night: "夜讀",
  large: "大字"
};

const passages = {
  Gate: {
    code: "SCN-DA20-001",
    title: "南京城門",
    time: "大興二十年八月，卯時",
    location: "南京",
    text: [
      "雨才停。南京城門外的石道還帶著水光，驛卒牽馬穿過人群，竹箱裡的文書被油紙裹得嚴實。",
      "{{name}}站在門洞陰影下，聽見城內鐘聲被霧氣壓低。有人談北境兵事，有人談崑崙舊路，也有人低聲說李暮辰病勢未明。",
      "入城的人很多。你要先往哪裡去？"
    ],
    choices: [
      { text: "往驛站查看北方文書", to: "Relay", kind: "action", effects: { spirit: -2, composure: 2 }, dev: { smm: 1, tms: 2, traceability: 4 }, item: "驛站木牌" },
      { text: "到茶棚打聽南京流言", to: "Tea", kind: "question", effects: { coin: -1, suspicion: 1 }, dev: { smm: 2, tms: 1, traceability: 2 }, note: "茶棚有人提到銀川。" },
      { text: "沿秦淮河找南方商旅", to: "River", kind: "action", effects: { spirit: -1, composure: -1 }, dev: { smm: 1, tms: 3, traceability: 2 } }
    ]
  },
  Relay: {
    code: "SCN-DA20-002",
    title: "驛站文書",
    time: "大興二十年八月，辰時",
    location: "南京驛站",
    text: [
      "驛站裡混著墨、馬汗與濕木的氣味。牆上掛著北路牌子，銀川與崑崙被朱筆圈出。",
      "一名驛卒看了你一眼，把剛到的文袋壓到櫃下。你聽見他向同僚說：北方的消息不能亂傳，南京這邊也要等官署口徑。",
      "文袋角落露出半行字：突厥，關卡，魏無紛。"
    ],
    choices: [
      { text: "記下魏無紛與關卡線索", to: "NorthRoad", kind: "summary", effects: { composure: 2, suspicion: 1 }, dev: { smm: 2, tms: 2, traceability: 5 }, item: "魏無紛關卡線索" },
      { text: "向驛卒表明你要尋人", to: "Yamen", kind: "negotiation", effects: { spirit: -2, suspicion: 2 }, dev: { smm: 2, tms: 1, traceability: 3 } },
      { text: "退回南京街上", to: "Gate", kind: "action", effects: { composure: 1 }, dev: { smm: 0, tms: 0, traceability: 1 } }
    ]
  },
  Tea: {
    code: "SCN-DA20-003",
    title: "城門茶棚",
    time: "大興二十年八月，辰時",
    location: "南京城門外",
    text: [
      "茶棚搭在城牆陰影邊。茶博士把粗碗推到你面前，嗓音壓得很低。",
      "他說北方有兩種消息：一種從官道來，講突厥才退；一種從江湖人嘴裡來，講崑崙山腳下有人帶傷回銀川。",
      "旁桌旅人提到楚服、花瓊瑤與陽月，名字像從很遠的路上滾進南京。"
    ],
    choices: [
      { text: "追問楚服與花瓊瑤", to: "KunlunEcho", kind: "question", effects: { coin: -1, composure: -1 }, dev: { smm: 3, tms: 2, traceability: 4 }, note: "楚服與楚璃詩需合併成同一 PC。" },
      { text: "記下陽月線的南陽傳聞", to: "SouthLead", kind: "summary", effects: { spirit: 1, suspicion: 1 }, dev: { smm: 2, tms: 2, traceability: 4 }, item: "南陽傳聞" },
      { text: "把茶棚消息帶去官署", to: "Yamen", kind: "decision", effects: { composure: 2, suspicion: 2 }, dev: { smm: 1, tms: 1, traceability: 3 } }
    ]
  },
  River: {
    code: "SCN-DA20-004",
    title: "秦淮河埠",
    time: "大興二十年八月，巳時",
    location: "秦淮河埠",
    text: [
      "河埠邊堆著南來貨箱。商旅躲在蓬下曬帳冊，船夫在水邊罵天色。",
      "有人提到南陽奴隸、商會與一位不該被牽出的舊人。這些名字暫時不連成案，卻全都通往正史足跡後段。",
      "一艘小船正要北上。船主問你是否上船。"
    ],
    choices: [
      { text: "向船主問南陽路線", to: "SouthLead", kind: "question", effects: { coin: -2, spirit: -1 }, dev: { smm: 2, tms: 3, traceability: 4 }, item: "南陽路引" },
      { text: "在河埠等官署差人", to: "Yamen", kind: "action", effects: { composure: 1, suspicion: 1 }, dev: { smm: 1, tms: 1, traceability: 3 } },
      { text: "回城門重新選路", to: "Gate", kind: "action", effects: { spirit: -1 }, dev: { smm: 0, tms: 0, traceability: 1 } }
    ]
  },
  KunlunEcho: {
    code: "SCN-DA20-005",
    title: "崑崙舊聲",
    time: "大興二十年八月，午時",
    location: "南京茶棚",
    text: [
      "茶博士說，從崑崙山腳傳回的話很亂。有人重傷，有人沉默，有人把一封信藏進袖中。",
      "楚服與楚璃詩是同一人的兩個名字，話本裡常被分開傳。花瓊瑤的名字則總和傷勢、救治與五毒舊事放在一起。",
      "你把這些名字寫在紙背，墨跡很快被潮氣暈開。"
    ],
    choices: [
      { text: "把名字對照寫進行囊札記", to: "NightRecord", kind: "summary", effects: { composure: 2 }, dev: { smm: 5, tms: 4, traceability: 6 }, item: "PC 名字對照" },
      { text: "追銀川路線", to: "NorthRoad", kind: "decision", effects: { spirit: -2, suspicion: 1 }, dev: { smm: 2, tms: 2, traceability: 4 } },
      { text: "改查南陽與五毒", to: "SouthLead", kind: "decision", effects: { composure: -1 }, dev: { smm: 2, tms: 3, traceability: 4 } }
    ]
  },
  SouthLead: {
    code: "SCN-DA20-006",
    title: "南陽線索",
    time: "大興二十年八月，未時",
    location: "南京南市",
    text: [
      "南市的布棚底下，一名商旅說南陽近來不平。奴隸、商會、江夏與南部叛亂的傳聞像被人故意拆散。",
      "他提到五毒山腳，又提到葛氏與葛初秋。你能聽出他有話沒說完。",
      "若現在把這條線收下，之後能通往陽月路線。"
    ],
    choices: [
      { text: "收下南陽路引", to: "NightRecord", kind: "decision", effects: { coin: -2, spirit: 1 }, dev: { smm: 3, tms: 4, traceability: 5 }, item: "南陽路引" },
      { text: "追問葛氏與五毒", to: "Yamen", kind: "question", effects: { suspicion: 2, composure: -1 }, dev: { smm: 2, tms: 3, traceability: 4 }, note: "五毒與葛氏可接祈禍篇。" },
      { text: "回茶棚整理人物名", to: "KunlunEcho", kind: "summary", effects: { composure: 1 }, dev: { smm: 2, tms: 2, traceability: 3 } }
    ]
  },
  NorthRoad: {
    code: "SCN-DA20-007",
    title: "北路牌",
    time: "大興二十年八月，申時",
    location: "南京北街",
    text: [
      "北街立著往銀川方向的路牌。雨水從木牌裂縫滴下，像把地名一筆一筆劃開。",
      "你已知道幾個詞：突厥、關卡、魏無紛、崑崙、銀川。它們暫時只是散落的鐵片，還沒有鑄成一把刀。",
      "差人從街口走過，似乎正在尋找打聽北方消息的人。"
    ],
    choices: [
      { text: "避開差人，入夜再寫札記", to: "NightRecord", kind: "action", effects: { spirit: -1, suspicion: -1 }, dev: { smm: 2, tms: 2, traceability: 5 }, item: "北路牌拓記" },
      { text: "跟差人去官署說明", to: "Yamen", kind: "negotiation", effects: { suspicion: 3, composure: 2 }, dev: { smm: 2, tms: 2, traceability: 4 } },
      { text: "轉去南市查另一條線", to: "SouthLead", kind: "decision", effects: { spirit: -1 }, dev: { smm: 1, tms: 3, traceability: 3 } }
    ]
  },
  Yamen: {
    code: "SCN-DA20-008",
    title: "舊案卷房",
    time: "大興二十年八月，酉時",
    location: "南京官署",
    text: [
      "官署後院的案卷房沒有點太多燈。書吏把竹簽塞回架上，問你從哪裡聽到這些名字。",
      "你看見封條上寫著魏無忌、公孫、李暮辰。這些案卷離南京很遠，又像正壓在南京桌面上。",
      "書吏沒有趕你走，只說天黑前只能查一份。"
    ],
    choices: [
      { text: "查魏無忌案卷", to: "Dossier", kind: "decision", effects: { composure: 1, suspicion: 2 }, dev: { smm: 2, tms: 2, traceability: 6 }, item: "魏無忌案卷摘記" },
      { text: "查崑崙與銀川往來", to: "NorthRoad", kind: "question", effects: { spirit: -1 }, dev: { smm: 2, tms: 2, traceability: 5 } },
      { text: "查南陽商會舊案", to: "SouthLead", kind: "question", effects: { suspicion: 1 }, dev: { smm: 2, tms: 3, traceability: 5 } }
    ]
  },
  Dossier: {
    code: "SCN-DA20-009",
    title: "魏無忌案卷",
    time: "大興二十年八月，酉時末",
    location: "南京官署",
    text: [
      "案卷紙面很乾，像被反覆翻過。魏無忌、公孫南平、公孫蒿、李暮辰與北垣被寫在不同頁上。",
      "你看不完全部，只能把可連回正史足跡的名字抄下。官署的燈忽明忽暗，外頭有人催促關門。",
      "這份摘記會在後續劇情裡打開更多路線。"
    ],
    choices: [
      { text: "把案卷藏入行囊", to: "NightRecord", kind: "action", effects: { suspicion: 2, composure: 1 }, dev: { smm: 3, tms: 3, traceability: 6 }, item: "魏無忌案卷摘記" },
      { text: "交還案卷，保留名字", to: "NightRecord", kind: "summary", effects: { suspicion: -1, composure: 2 }, dev: { smm: 2, tms: 2, traceability: 5 }, note: "你記住公孫蒿與北垣。" },
      { text: "回北街確認銀川線", to: "NorthRoad", kind: "decision", effects: { spirit: -1 }, dev: { smm: 2, tms: 2, traceability: 4 } }
    ]
  },
  NightRecord: {
    code: "SCN-DA20-010",
    title: "夜宿札記",
    time: "大興二十年八月，亥時",
    location: "南京客舍",
    text: [
      "夜裡，客舍窗紙被風吹得發響。{{name}}把白日收來的名字、路線與案卷放在桌上。",
      "南京只是開局。正史足跡裡的崑崙、銀川、五毒、南陽與雙孤單人線，都會從這些札記裡展開。",
      "你可以保存，或從札記選擇下一日的方向。"
    ],
    choices: [
      { text: "下一日往北路追銀川", to: "NorthRoad", kind: "decision", effects: { spirit: -2, composure: 2 }, dev: { smm: 3, tms: 3, traceability: 5 } },
      { text: "下一日查南陽與五毒", to: "SouthLead", kind: "decision", effects: { spirit: -1, composure: 1 }, dev: { smm: 3, tms: 4, traceability: 5 } },
      { text: "重新整理南京開局", to: "Gate", kind: "summary", effects: { composure: 2 }, dev: { smm: 2, tms: 2, traceability: 4 } }
    ]
  }
};

const defaultState = {
  started: false,
  passage: "Gate",
  turnNo: 1,
  player: {
    name: "旅人",
    player_code: "PLAYER-DA-GO-LOCAL",
    member_code: "TM-DA-GO-LOCAL",
    character_code: "PC-DA-GO-LOCAL",
    textStyle: "standard"
  },
  stats: {
    spirit: 50,
    composure: 50,
    coin: 12,
    suspicion: 0
  },
  items: ["素布行囊"],
  notes: ["大興二十年八月，南京。"],
  utterances: [],
  events: [],
  dev: {
    smm: 50,
    tms: 50,
    traceability: 50
  },
  options: {
    numberedLinks: true
  }
};

let state = loadState();
const $ = function (id) { return document.getElementById(id); };

$("startForm").addEventListener("submit", startGame);
$("closeOverlay").addEventListener("click", closeOverlay);
document.querySelectorAll("[data-action]").forEach(function (button) {
  button.addEventListener("click", function () {
    handleAction(button.dataset.action);
  });
});
document.addEventListener("keyup", handleHotkey);

render();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultState);
    return mergeState(clone(defaultState), JSON.parse(raw));
  } catch (error) {
    return clone(defaultState);
  }
}

function mergeState(base, incoming) {
  const next = Object.assign({}, base, incoming || {});
  next.player = Object.assign({}, base.player, incoming && incoming.player ? incoming.player : {});
  next.stats = Object.assign({}, base.stats, incoming && incoming.stats ? incoming.stats : {});
  next.dev = Object.assign({}, base.dev, incoming && incoming.dev ? incoming.dev : {});
  next.options = Object.assign({}, base.options, incoming && incoming.options ? incoming.options : {});
  next.items = Array.isArray(next.items) ? next.items : base.items.slice();
  next.notes = Array.isArray(next.notes) ? next.notes : base.notes.slice();
  next.utterances = Array.isArray(next.utterances) ? next.utterances : [];
  next.events = Array.isArray(next.events) ? next.events : [];
  return next;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function startGame(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = cleanText(form.get("playerName"), "旅人").slice(0, 16);
  const style = String(form.get("textStyle") || "standard");
  state = clone(defaultState);
  state.started = true;
  state.player.name = name;
  state.player.textStyle = textStyles[style] ? style : "standard";
  state.notes = [`${name}在南京城門入局。`];
  recordUtterance({
    speaker_type: "PC",
    speaker_label_raw: name,
    utterance_function: "summary",
    text: `${name}建立角色，進入南京。`,
    scene: passages.Gate,
    source: "start"
  });
  saveState();
  render();
}

function render() {
  document.body.dataset.textStyle = state.player.textStyle;
  $("startPanel").hidden = state.started;
  $("playPanel").hidden = !state.started;
  if (!state.started) {
    $("playerName").value = state.player.name;
    const selector = `input[name="textStyle"][value="${state.player.textStyle}"]`;
    const checked = document.querySelector(selector);
    if (checked) checked.checked = true;
  } else {
    renderPassage();
  }
  renderSidebar();
}

function renderPassage() {
  const passage = getPassage();
  $("passageTitle").textContent = passage.title;
  $("passageMeta").textContent = `${passage.time} | ${passage.location}`;
  $("passageText").innerHTML = passage.text.map(function (line) {
    return `<p>${esc(applyVars(line))}</p>`;
  }).join("");
  $("choiceList").innerHTML = passage.choices.map(function (choice, index) {
    const prefix = state.options.numberedLinks ? `${index + 1}. ` : "";
    return `<button type="button" class="link-internal" data-choice="${index}">${esc(prefix + choice.text)}</button>`;
  }).join("");
  document.querySelectorAll("[data-choice]").forEach(function (button) {
    button.addEventListener("click", function () {
      choose(Number(button.dataset.choice));
    });
  });
  $("passageFooter").textContent = `da_go ${ENGINE_VERSION} | ${passage.code} | Turn ${state.turnNo}`;
}

function renderSidebar() {
  const passage = getPassage();
  $("characterBox").innerHTML = [
    `<p><strong>${esc(state.player.name)}</strong></p>`,
    `<p>${esc(textStyles[state.player.textStyle] || "標準")}</p>`,
    `<p>${esc(passage.location)}</p>`
  ].join("");
  $("statusBox").innerHTML = [
    statRow("精神", state.stats.spirit, "blue"),
    statRow("鎮定", state.stats.composure, "green"),
    statRow("銀錢", state.stats.coin, "gold"),
    statRow("疑心", state.stats.suspicion, "red")
  ].join("");
  $("itemBox").innerHTML = state.items.length ? state.items.slice(0, 8).map(function (item) {
    return `<p>${esc(item)}</p>`;
  }).join("") : "<p>無</p>";
  $("noteBox").innerHTML = state.notes.length ? state.notes.slice(0, 8).map(function (note) {
    return `<p>${esc(note)}</p>`;
  }).join("") : "<p>無</p>";
}

function statRow(label, value, color) {
  const number = clamp(Number(value), 0, color === "red" ? 100 : 999);
  const width = color === "gold" ? clamp(number * 4, 0, 100) : clamp(number, 0, 100);
  return `<div class="stat-name"><span>${label}</span><span>${number}</span></div><div class="meter ${color}"><span style="width:${width}%"></span></div>`;
}

function choose(index) {
  const passage = getPassage();
  const choice = passage.choices[index];
  if (!choice) return;
  applyEffects(choice.effects || {});
  applyDev(choice.dev || {});
  addUnique(state.items, choice.item);
  if (choice.note) state.notes.unshift(choice.note);
  state.notes = state.notes.slice(0, 8);
  state.events.push({
    turn_no: state.turnNo,
    scene_code: passage.code,
    scene_title: passage.title,
    choice_text: choice.text,
    to_scene: choice.to,
    created_at: new Date().toISOString()
  });
  recordUtterance({
    speaker_type: "PC",
    speaker_label_raw: state.player.name,
    utterance_function: choice.kind || "decision",
    text: choice.text,
    scene: passage,
    source: "choice"
  });
  state.passage = choice.to;
  state.turnNo += 1;
  saveState();
  render();
}

function handleAction(action) {
  if (action === "save") {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    openOverlay("保存", "<p>已保存目前進度。</p>");
    return;
  }
  if (action === "load") {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      openOverlay("載入", "<p>沒有保存資料。</p>");
      return;
    }
    state = mergeState(clone(defaultState), JSON.parse(raw));
    saveState();
    render();
    openOverlay("載入", "<p>已載入保存資料。</p>");
    return;
  }
  if (action === "settings") {
    openSettings();
    return;
  }
  if (action === "restart") {
    state = clone(defaultState);
    saveState();
    render();
    return;
  }
  if (action === "developer") {
    openDeveloper();
  }
}

function openSettings() {
  const html = `
    <div class="settings-grid">
      <label>文字外觀
        <select id="settingTextStyle">
          ${Object.keys(textStyles).map(function (key) {
            const selected = key === state.player.textStyle ? " selected" : "";
            return `<option value="${key}"${selected}>${textStyles[key]}</option>`;
          }).join("")}
        </select>
      </label>
      <label class="checkline"><input id="settingNumbers" type="checkbox" ${state.options.numberedLinks ? "checked" : ""}> 選項編號</label>
    </div>
  `;
  openOverlay("設定", html);
  $("settingTextStyle").addEventListener("change", function (event) {
    state.player.textStyle = event.target.value;
    saveState();
    render();
  });
  $("settingNumbers").addEventListener("change", function (event) {
    state.options.numberedLinks = event.target.checked;
    saveState();
    render();
  });
}

function openDeveloper() {
  const corpus = buildCorpus();
  const html = `
    <div class="dev-grid">
      <p><strong>Team</strong><span>${esc(corpusConfig.team_code)}</span></p>
      <p><strong>Utterance</strong><span>${state.utterances.length}</span></p>
      <p><strong>SMM</strong><span>${state.dev.smm}</span></p>
      <p><strong>TMS</strong><span>${state.dev.tms}</span></p>
      <p><strong>追溯</strong><span>${state.dev.traceability}</span></p>
    </div>
    <div class="developer-actions">
      <button type="button" id="exportJson">匯出 JSON</button>
      <button type="button" id="copyJson">複製 JSON</button>
    </div>
    <details>
      <summary>Team / PC 對照</summary>
      <pre>${esc(JSON.stringify({
        gm_researcher: "大拿",
        player_pc: {
          "莉絲": "陽月",
          "南瓜": "楚服 / 楚璃詩",
          "佐拉": "花瓊瑤"
        }
      }, null, 2))}</pre>
    </details>
    <details>
      <summary>匯出摘要</summary>
      <pre>${esc(JSON.stringify(corpus.metadata, null, 2))}</pre>
    </details>
  `;
  openOverlay("開發者", html);
  $("exportJson").addEventListener("click", function () {
    download("da-go-trpg-corpus-export.json", buildCorpus());
  });
  $("copyJson").addEventListener("click", copyJson);
}

function openOverlay(title, html) {
  $("overlayTitle").textContent = title;
  $("overlayContent").innerHTML = html;
  $("overlayBackdrop").classList.remove("hidden");
}

function closeOverlay() {
  $("overlayBackdrop").classList.add("hidden");
}

function recordUtterance(entry) {
  const scene = entry.scene || getPassage();
  const speakerCode = makeSpeakerCode(entry.speaker_type, entry.speaker_label_raw);
  const inCharacter = entry.speaker_type === "PC";
  const utterance = {
    turn_no: state.turnNo,
    sub_turn_no: null,
    utterance_code: `UTT-${String(state.utterances.length + 1).padStart(5, "0")}`,
    project_code: corpusConfig.project_code,
    team_code: corpusConfig.team_code,
    session_code: corpusConfig.session_code,
    scene_code: scene.code,
    speaker_type: entry.speaker_type,
    speaker_code: speakerCode,
    speaker_label_raw: entry.speaker_label_raw,
    utterance_function: normalizeFunction(entry.utterance_function),
    is_in_character: inCharacter,
    is_gm_narration: entry.speaker_type === "GM" && entry.utterance_function === "narration",
    is_rule_related: entry.utterance_function === "rule_check",
    is_decision_related: ["decision", "negotiation", "clarification"].indexOf(entry.utterance_function) >= 0,
    is_knowledge_related: ["question", "clarification", "summary"].indexOf(entry.utterance_function) >= 0,
    start_timecode: scene.time,
    end_timecode: null,
    duration_sec: null,
    utterance_text_raw: entry.text,
    utterance_text_clean: entry.text,
    utterance_text_verified: null,
    language_code: "zh-TW",
    emotion_label: "neutral",
    interaction_target_type: null,
    related_rule_code: null,
    related_world_setting_code: scene.code,
    related_item_code: null,
    ai_summary: null,
    ai_annotation_json: JSON.stringify({ source: entry.source, engine_version: ENGINE_VERSION }),
    human_annotation_note: "da_go playable page",
    transcription_confidence: null,
    review_status: "draft",
    include_in_analysis: true,
    created_at: new Date().toISOString()
  };
  state.utterances.push(utterance);
}

function buildCorpus() {
  const localMember = {
    player_code: state.player.player_code,
    player_name: state.player.name,
    participant_role: "player",
    member_code: state.player.member_code,
    member_role: "player",
    is_gm: false,
    is_player: true,
    is_researcher: false
  };
  const localCharacter = {
    character_code: state.player.character_code,
    character_name: state.player.name,
    team_member_code: state.player.member_code,
    player_code: state.player.player_code,
    aliases: [state.player.name]
  };
  const members = teamMembers.concat([localMember]);
  const characters = sourceCharacters.concat([localCharacter]);
  return {
    metadata: {
      export_format: "da_go_playable_json_v1",
      target_database: corpusConfig.database_name,
      engine_version: ENGINE_VERSION,
      project_code: corpusConfig.project_code,
      team_code: corpusConfig.team_code,
      session_code: corpusConfig.session_code,
      import_batch_code: corpusConfig.import_batch_code,
      story_time: "大興二十年八月",
      story_place: "南京",
      exported_at: new Date().toISOString()
    },
    source_documents: sourceDocuments,
    dbo_Team: [{
      project_code: corpusConfig.project_code,
      team_code: corpusConfig.team_code,
      team_name: corpusConfig.team_name,
      assigned_gm_code: "TM-DAGUO-DANA",
      condition_trpg: true,
      condition_database: true,
      team_status: "in_progress"
    }],
    dbo_Player: members.map(function (member) {
      return {
        project_code: corpusConfig.project_code,
        player_code: member.player_code,
        player_label_raw: member.player_name,
        participant_role: member.participant_role,
        consent_status: "pending",
        is_anonymized: true
      };
    }),
    dbo_Team_Member: members.map(function (member) {
      return {
        team_code: corpusConfig.team_code,
        player_code: member.player_code,
        member_code: member.member_code,
        member_label_raw: member.player_name,
        member_role: member.member_role,
        is_gm: member.is_gm,
        is_player: member.is_player,
        is_researcher: member.is_researcher,
        attendance_status: "attended",
        include_in_analysis: true
      };
    }),
    dbo_Player_Character: characters.map(function (character) {
      return {
        team_member_code: character.team_member_code,
        player_code: character.player_code,
        character_code: character.character_code,
        character_name: character.character_name,
        character_aliases: character.aliases.join(" / "),
        character_type: "player_character",
        character_status: "draft"
      };
    }),
    dbo_TRPG_Session: [{
      team_code: corpusConfig.team_code,
      session_code: corpusConfig.session_code,
      session_no: 1,
      session_title: "大國年代記 da_go 南京開局",
      session_type: "play",
      transcript_status: "imported"
    }],
    dbo_Scene: Object.keys(passages).map(function (key, index) {
      const scene = passages[key];
      return {
        session_code: corpusConfig.session_code,
        scene_code: scene.code,
        scene_no: index + 1,
        scene_title: scene.title,
        scene_type: "play",
        scene_summary_raw: scene.text.join("\n"),
        scene_status: "draft"
      };
    }),
    stg_Utterance_Import: state.utterances.map(toStagingRow),
    dbo_Utterance_12_preview: state.utterances.map(toUtterance12Preview),
    raw_game_events: state.events,
    developer_metrics: state.dev
  };
}

function toStagingRow(utterance, index) {
  return {
    source_row_no: index + 1,
    project_code: utterance.project_code,
    team_code: utterance.team_code,
    session_code: utterance.session_code,
    scene_code: utterance.scene_code,
    turn_no_text: String(utterance.turn_no),
    sub_turn_no_text: utterance.sub_turn_no === null ? null : String(utterance.sub_turn_no),
    utterance_code: utterance.utterance_code,
    speaker_type: utterance.speaker_type,
    speaker_code: utterance.speaker_code,
    speaker_label_raw: utterance.speaker_label_raw,
    utterance_function: utterance.utterance_function,
    is_in_character_text: bitText(utterance.is_in_character),
    is_gm_narration_text: bitText(utterance.is_gm_narration),
    is_rule_related_text: bitText(utterance.is_rule_related),
    is_decision_related_text: bitText(utterance.is_decision_related),
    is_knowledge_related_text: bitText(utterance.is_knowledge_related),
    start_timecode: utterance.start_timecode,
    end_timecode: utterance.end_timecode,
    duration_sec_text: null,
    utterance_text_raw: utterance.utterance_text_raw,
    utterance_text_clean: utterance.utterance_text_clean,
    utterance_text_verified: utterance.utterance_text_verified,
    language_code: utterance.language_code,
    emotion_label: utterance.emotion_label,
    interaction_target_type: utterance.interaction_target_type,
    interaction_target_code: null,
    related_rule_code: utterance.related_rule_code,
    related_world_setting_code: utterance.related_world_setting_code,
    related_item_code: utterance.related_item_code,
    ai_summary: utterance.ai_summary,
    ai_annotation_json: utterance.ai_annotation_json,
    human_annotation_note: utterance.human_annotation_note,
    transcription_confidence_text: null,
    review_status: utterance.review_status,
    include_in_analysis_text: bitText(utterance.include_in_analysis)
  };
}

function toUtterance12Preview(utterance) {
  return {
    session_code: utterance.session_code,
    scene_code: utterance.scene_code,
    turn_no: utterance.turn_no,
    sub_turn_no: utterance.sub_turn_no,
    utterance_code: utterance.utterance_code,
    speaker_type: utterance.speaker_type,
    speaker_member_code: utterance.speaker_type === "PC" ? null : utterance.speaker_code,
    speaker_character_code: utterance.speaker_type === "PC" ? utterance.speaker_code : null,
    speaker_label_raw: utterance.speaker_label_raw,
    utterance_function: utterance.utterance_function,
    is_in_character: utterance.is_in_character,
    is_gm_narration: utterance.is_gm_narration,
    is_rule_related: utterance.is_rule_related,
    is_decision_related: utterance.is_decision_related,
    is_knowledge_related: utterance.is_knowledge_related,
    start_timecode: utterance.start_timecode,
    utterance_text_raw: utterance.utterance_text_raw,
    utterance_text_clean: utterance.utterance_text_clean,
    language_code: utterance.language_code,
    emotion_label: utterance.emotion_label,
    ai_annotation_json: utterance.ai_annotation_json,
    human_annotation_note: utterance.human_annotation_note,
    review_status: utterance.review_status,
    include_in_analysis: utterance.include_in_analysis
  };
}

function handleHotkey(event) {
  if (!state.started || !state.options.numberedLinks) return;
  if (["INPUT", "TEXTAREA", "SELECT"].indexOf(document.activeElement.tagName) >= 0) return;
  const index = Number(event.key);
  if (!index || index < 1 || index > 9) return;
  const button = document.querySelector(`[data-choice="${index - 1}"]`);
  if (button) button.click();
}

function getPassage() {
  return passages[state.passage] || passages.Gate;
}

function applyVars(line) {
  return String(line).replaceAll("{{name}}", state.player.name);
}

function applyEffects(effects) {
  Object.keys(effects).forEach(function (key) {
    state.stats[key] = clamp(Number(state.stats[key] || 0) + Number(effects[key]), 0, key === "coin" ? 999 : 100);
  });
}

function applyDev(effects) {
  Object.keys(effects).forEach(function (key) {
    state.dev[key] = clamp(Number(state.dev[key] || 0) + Number(effects[key]), 0, 100);
  });
}

function addUnique(list, value) {
  if (!value) return;
  if (list.indexOf(value) < 0) list.unshift(value);
}

function makeSpeakerCode(type, label) {
  if (type === "PC") return state.player.character_code;
  if ((type === "GM" || type === "Researcher") && label === "大拿") return "TM-DAGUO-DANA";
  return `${corpusConfig.team_code}-${type}-${slug(label) || "speaker"}`;
}

function normalizeFunction(value) {
  const allowed = ["narration", "dialogue", "action", "rule_check", "decision", "negotiation", "question", "clarification", "conflict", "summary"];
  return allowed.indexOf(value) >= 0 ? value : "action";
}

function bitText(value) {
  return value ? "1" : "0";
}

function cleanText(value, fallback) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function slug(value) {
  return String(value).trim().replace(/[^\w\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

function download(name, object) {
  const blob = new Blob([JSON.stringify(object, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyJson() {
  const text = JSON.stringify(buildCorpus(), null, 2);
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    download("da-go-trpg-corpus-export.json", buildCorpus());
  }
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
