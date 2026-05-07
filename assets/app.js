const STORAGE_KEY = "daGoNarrativeGameState";
const SAVE_DETAILS_KEY = "daGoSaveDetails";
const SAVE_SLOT_PREFIX = "daGoSaveSlot";
const AUTOSAVE_KEY = "daGoAutosave";
const ENGINE_VERSION = "0.2.0-trpg-corpus";

const scenes = {
  opening: {
    code: "SCN-001",
    title: "雨港資料室",
    phase: "exposition",
    minutes: 10,
    text: "夜雨覆蓋港區。你被研究隊伍指派進入舊資料室，確認一批角色設定、場景摘要與決策紀錄是否能重新組成可追溯的敘事鏈。桌上有三份資料：一份角色檔、一份世界設定、一份未完成的場次紀錄。",
    choices: [
      { label: "先閱讀角色檔", next: "character_file", effects: { focus: 6, smm: 4, memory: "確認角色動機與敘事功能。" }, tags: ["character_lookup"] },
      { label: "先整理世界設定", next: "world_file", effects: { focus: 4, smm: 6, memory: "建立共通世界觀基準。" }, tags: ["world_setting_lookup"] },
      { label: "直接查看場次紀錄", next: "session_file", effects: { focus: -4, tms: 5, memory: "發現場次紀錄缺少決策理由。" }, tags: ["transcript_lookup"] }
    ]
  },
  character_file: {
    code: "SCN-002",
    title: "角色檔案",
    phase: "rising_action",
    minutes: 15,
    text: "角色檔標示主角具有調查職能，擅長保存線索，但與隊伍中另一名角色存在資訊不對稱。若不先建立共同理解，後續共創容易發生角色語風與行動邏輯衝突。",
    choices: [
      { label: "把角色動機寫入短期記憶", next: "decision_point", effects: { smm: 8, coherence: 6, item: "角色動機卡" }, tags: ["smm_alignment", "character_lookup"] },
      { label: "指定一名成員負責角色知識", next: "decision_point", effects: { tms: 8, traceability: 4, item: "角色知識分工" }, tags: ["tms_role", "role_assignment"] }
    ]
  },
  world_file: {
    code: "SCN-003",
    title: "世界設定",
    phase: "rising_action",
    minutes: 15,
    text: "世界設定顯示雨港由三個勢力共同治理。每次改寫都必須保留勢力關係、資源限制與禁區規則，否則延伸文本會失去因果一致性。",
    choices: [
      { label: "標記禁區規則", next: "decision_point", effects: { coherence: 8, traceability: 5, item: "禁區規則" }, tags: ["rule_lookup"] },
      { label: "標記勢力關係", next: "decision_point", effects: { smm: 5, tms: 5, item: "勢力關係圖" }, tags: ["world_setting_lookup"] }
    ]
  },
  session_file: {
    code: "SCN-004",
    title: "場次紀錄",
    phase: "rising_action",
    minutes: 20,
    text: "逐字稿中有多次討論、提問與協商，但只有結果，缺少理由與選項。你必須補足決策紀錄，否則專家評分時難以判定共識品質。",
    choices: [
      { label: "補記被拒絕選項", next: "decision_point", effects: { traceability: 9, coherence: 4, memory: "補記被拒絕選項與理由。" }, tags: ["decision_trace", "transcript_lookup"] },
      { label: "補記共識等級", next: "decision_point", effects: { smm: 4, traceability: 7, memory: "補記共識等級與決策狀態。" }, tags: ["consensus_quality"] }
    ]
  },
  decision_point: {
    code: "SCN-005",
    title: "第一次團隊決策",
    phase: "midpoint",
    minutes: 20,
    text: "隊伍必須決定：下一步先擴寫角色衝突，或先穩定世界觀規則。兩條路徑都可產生文本，但會影響一致性、創作效率與可追溯性。",
    choices: [
      { label: "先擴寫角色衝突", next: "character_conflict", effects: { creativity: 10, coherence: -3, focus: -3 }, tags: ["creation_choice"] },
      { label: "先穩定世界觀規則", next: "rule_stabilize", effects: { coherence: 10, creativity: -2, traceability: 4 }, tags: ["rule_interpretation", "worldbuilding_choice"] }
    ]
  },
  character_conflict: {
    code: "SCN-006",
    title: "角色衝突擴寫",
    phase: "climax",
    minutes: 25,
    text: "角色衝突讓文本變得鮮明，但部分設定與禁區規則衝突。你可以保留戲劇性，並用補充設定修正因果鏈。",
    choices: [
      { label: "新增補充設定並連回原規則", next: "ending", effects: { creativity: 6, coherence: 8, traceability: 8, item: "補充設定" }, tags: ["causal_link", "rule_lookup"] },
      { label: "保留衝突，交給 GM 裁定", next: "ending", effects: { creativity: 8, coherence: -6, traceability: 2 }, tags: ["gm_decided"] }
    ]
  },
  rule_stabilize: {
    code: "SCN-007",
    title: "規則穩定化",
    phase: "climax",
    minutes: 25,
    text: "世界觀規則被整理成共同準則。文本穩定，但角色衝突較弱。你可以加入一個受規則限制的艱難選擇，提高敘事張力。",
    choices: [
      { label: "加入受限選擇", next: "ending", effects: { creativity: 7, coherence: 7, smm: 3 }, tags: ["action_choice"] },
      { label: "維持規則優先", next: "ending", effects: { coherence: 10, creativity: -4, traceability: 5 }, tags: ["worldbuilding_choice"] }
    ]
  },
  ending: {
    code: "SCN-008",
    title: "場次摘要",
    phase: "resolution",
    minutes: 0,
    text: "本輪共創結束。系統已保存場景、選擇、狀態變化、知識查詢與資料庫對應欄位。你可以到「資料庫」頁匯出 trpg-corpus JSON，後續再轉入 SQL Server staging 表或正式表。",
    choices: [
      { label: "重新開始", next: "opening", effects: {}, tags: ["restart"], restart: true }
    ]
  }
};

const eventPool = [
  { name: "ambient_rain", weight: 3, text: "雨聲讓討論速度下降，但也降低了場面壓力。", effects: { focus: 1, smm: 1 } },
  { name: "missing_note", weight: 2, text: "你發現一段摘要缺少來源回合。", effects: { traceability: -3, focus: -1 } },
  { name: "shared_reference", weight: 2, text: "隊伍引用同一份世界設定，協調成本降低。", effects: { smm: 3, coherence: 2 } },
  { name: "expertise_shift", weight: 1, text: "一名成員主動承擔規則查詢，TMS 分工更清楚。", effects: { tms: 4, traceability: 2 } }
];

const defaultState = {
  meta: {
    engine_version: ENGINE_VERSION,
    passage_count: 0,
    passage_prev: "none",
    passage_current: "opening",
    save_versions: [ENGINE_VERSION]
  },
  profile: {
    character_name: "雨港紀錄者",
    character_code: "PC-DA-GO-001",
    character_type: "player_character",
    archetype: "調查者",
    race_or_species: "人類",
    class_or_profession: "敘事資料管理員",
    faction: "研究小隊",
    narrative_function: "保存線索、整理共識、建立事件因果鏈",
    background_story: "受研究團隊委託，進入雨港資料室整理 TRPG 共創歷程。",
    personality_note: "謹慎，偏好證據與可追溯紀錄。",
    motivation_note: "讓團隊能共同記得角色、世界觀與決策理由。",
    relationship_note: "與 GM、玩家、觀察者共同維護語料。",
    ability_note: "查詢、摘要、標註、因果鏈整理。",
    item_note: "錄音筆、逐字稿、資料庫查詢表。"
  },
  settings: {
    display_mode: "research",
    sidebar_stats: "all",
    numberify_enabled: "true",
    autosave_enabled: "true",
    research_note: "本遊戲為研究型互動敘事工具，用於記錄 SMM/TMS、決策與知識查詢。"
  },
  corpus: {
    project_code: "TRPG-PROJ-001",
    team_code: "TEAM-001",
    session_code: "S001",
    import_batch_code: "DA_GO_EXPORT_001",
    api_endpoint: ""
  },
  time: {
    day: 1,
    hour: 19,
    minute: 0
  },
  game: {
    currentScene: "opening",
    turnNo: 1,
    stats: { focus: 50, creativity: 50, coherence: 50, smm: 50, tms: 50, traceability: 50 },
    memory: ["進入雨港資料室。"],
    inventory: ["逐字稿索引"],
    events: [],
    decisions: [],
    retrievals: [],
    utterances: [],
    eventPoolLog: [],
    lastEvent: null
  },
  world: [
    { code: "WS-RAIN-HARBOR", title: "雨港", summary: "由三個勢力共同治理的港區，所有延伸文本須維持勢力關係一致。" },
    { code: "RULE-TRACE", title: "可追溯規則", summary: "重大選擇需保存提出者、理由、被拒絕選項與後果。" },
    { code: "ITEM-TRANSCRIPT", title: "逐字稿索引", summary: "逐字稿是事件、決策與知識查詢的主要來源。" }
  ]
};

let state = loadState();

const tabs = Array.from(document.querySelectorAll(".tab"));
const pages = {
  game: document.getElementById("page-game"),
  character: document.getElementById("page-character"),
  world: document.getElementById("page-world"),
  log: document.getElementById("page-log"),
  save: document.getElementById("page-save"),
  settings: document.getElementById("page-settings"),
  corpus: document.getElementById("page-corpus")
};

const importFile = document.getElementById("importFile");
const exportSave = document.getElementById("exportSave");
const exportCorpus = document.getElementById("exportCorpus");
const resetGame = document.getElementById("resetGame");
const characterForm = document.getElementById("characterForm");
const lookupForm = document.getElementById("lookupForm");
const corpusForm = document.getElementById("corpusForm");
const settingsForm = document.getElementById("settingsForm");
const copyCorpusJson = document.getElementById("copyCorpusJson");

tabs.forEach((tab) => tab.addEventListener("click", () => switchPage(tab.dataset.page)));
importFile.addEventListener("change", importJson);
exportSave.addEventListener("click", () => downloadJson("da-go-save.json", state));
exportCorpus.addEventListener("click", () => downloadJson("da-go-trpg-corpus-export.json", buildCorpusExport()));
resetGame.addEventListener("click", () => { state = structuredClone(defaultState); persist(); fillForms(); renderAll(); });
characterForm.addEventListener("submit", saveCharacter);
lookupForm.addEventListener("submit", recordLookup);
corpusForm.addEventListener("submit", saveCorpusSettings);
settingsForm.addEventListener("submit", saveSettings);
copyCorpusJson.addEventListener("click", copyCorpusExport);

fillForms();
renderAll();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try { return mergeState(structuredClone(defaultState), JSON.parse(raw)); }
  catch (_) { return structuredClone(defaultState); }
}

function mergeState(base, incoming) {
  const incomingGame = incoming.game || {};
  return {
    meta: { ...base.meta, ...(incoming.meta || {}) },
    profile: { ...base.profile, ...(incoming.profile || {}) },
    settings: { ...base.settings, ...(incoming.settings || {}) },
    corpus: { ...base.corpus, ...(incoming.corpus || {}) },
    time: { ...base.time, ...(incoming.time || {}) },
    game: {
      ...base.game,
      ...incomingGame,
      stats: { ...base.game.stats, ...(incomingGame.stats || {}) },
      memory: Array.isArray(incomingGame.memory) ? incomingGame.memory : base.game.memory,
      inventory: Array.isArray(incomingGame.inventory) ? incomingGame.inventory : base.game.inventory,
      events: Array.isArray(incomingGame.events) ? incomingGame.events : base.game.events,
      decisions: Array.isArray(incomingGame.decisions) ? incomingGame.decisions : base.game.decisions,
      retrievals: Array.isArray(incomingGame.retrievals) ? incomingGame.retrievals : base.game.retrievals,
      utterances: Array.isArray(incomingGame.utterances) ? incomingGame.utterances : base.game.utterances,
      eventPoolLog: Array.isArray(incomingGame.eventPoolLog) ? incomingGame.eventPoolLog : base.game.eventPoolLog
    },
    world: Array.isArray(incoming.world) ? incoming.world : base.world
  };
}

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function switchPage(pageKey) {
  if (!pages[pageKey]) return;
  tabs.forEach((tab) => tab.setAttribute("aria-current", tab.dataset.page === pageKey ? "page" : "false"));
  Object.entries(pages).forEach(([key, page]) => { page.hidden = key !== pageKey; });
  if (pageKey === "save") renderSaveSlots();
}

function renderAll() {
  renderGame();
  renderStatus();
  renderWorld();
  renderLookupList();
  renderTimeline();
  renderSaveSlots();
  renderMapping();
}

function renderGame() {
  const scene = scenes[state.game.currentScene] || scenes.opening;
  document.getElementById("sceneTitle").textContent = scene.title;
  document.getElementById("sceneMeta").textContent = `時間：${formatTime()} / 階段：${scene.phase} / 回合：${state.game.turnNo} / passages：${state.meta.passage_count}`;
  document.getElementById("sceneCode").textContent = scene.code;
  document.getElementById("passageText").textContent = scene.text;

  const eventBanner = document.getElementById("eventBanner");
  if (state.game.lastEvent) {
    eventBanner.hidden = false;
    eventBanner.textContent = `事件池：${state.game.lastEvent.text}`;
  } else {
    eventBanner.hidden = true;
    eventBanner.textContent = "";
  }

  const choiceList = document.getElementById("choiceList");
  choiceList.innerHTML = "";
  scene.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    const number = state.settings.numberify_enabled === "true" ? `${index + 1}. ` : "";
    button.innerHTML = `<strong>${escapeHtml(number + choice.label)}</strong><span>${escapeHtml((choice.tags || []).join(" / "))}</span>`;
    button.addEventListener("click", () => choose(choice));
    choiceList.appendChild(button);
  });
}

function choose(choice) {
  if (choice.restart) {
    const keepSettings = { ...state.settings };
    const keepCorpus = { ...state.corpus };
    state = structuredClone(defaultState);
    state.settings = keepSettings;
    state.corpus = keepCorpus;
    state.game.memory = ["重新開始遊戲。"];
    persist();
    fillForms();
    renderAll();
    return;
  }

  const currentScene = scenes[state.game.currentScene];
  passageHeader(choice.next);
  advanceTime(currentScene.minutes || 10);
  applyEffects(choice.effects || {});
  const poolEvent = runEventPool();

  const event = {
    turn_no: state.game.turnNo,
    scene_code: currentScene.code,
    scene_title: currentScene.title,
    phase: currentScene.phase,
    choice_label: choice.label,
    tags: choice.tags || [],
    time_after: { ...state.time },
    stats_after: { ...state.game.stats },
    event_pool: poolEvent ? poolEvent.name : null,
    created_at: new Date().toISOString()
  };
  state.game.events.push(event);
  state.game.utterances.push(makeUtterance(choice, currentScene));

  state.game.decisions.push({
    decision_code: `DEC-${String(state.game.decisions.length + 1).padStart(3, "0")}`,
    decision_no: state.game.decisions.length + 1,
    decision_title: choice.label,
    decision_type: mapDecisionType(choice.tags || []),
    decision_scope: "team",
    decision_status: "implemented",
    consensus_level: inferConsensusLevel(),
    consensus_quality_score: state.game.stats.smm,
    decision_importance: inferDecisionImportance(choice.tags || []),
    decision_text_raw: choice.label,
    decision_summary: `${currentScene.title} 中選擇：${choice.label}`,
    traceability_note: `由場景 ${currentScene.code}、回合 ${state.game.turnNo} 的選擇產生。`,
    smm_alignment_note: `SMM=${state.game.stats.smm}`,
    tms_process_note: `TMS=${state.game.stats.tms}`,
    source_turn_no: state.game.turnNo,
    source_type: "system_log",
    extraction_method: "system"
  });

  if ((choice.tags || []).some((tag) => tag.includes("lookup") || tag.includes("tms") || tag.includes("rule"))) {
    state.game.retrievals.push(makeRetrieval(choice, currentScene));
  }

  state.game.currentScene = choice.next;
  state.game.turnNo += 1;
  if (state.settings.autosave_enabled === "true") saveToSlot("auto");
  persist();
  renderAll();
}

function passageHeader(nextPassage) {
  state.meta.passage_prev = state.meta.passage_current;
  state.meta.passage_current = nextPassage;
  state.meta.passage_count += 1;
  if (!state.meta.save_versions.includes(ENGINE_VERSION)) state.meta.save_versions.push(ENGINE_VERSION);
}

function advanceTime(minutes) {
  state.time.minute += minutes;
  while (state.time.minute >= 60) { state.time.minute -= 60; state.time.hour += 1; }
  while (state.time.hour >= 24) { state.time.hour -= 24; state.time.day += 1; }
}

function applyEffects(effects) {
  Object.entries(effects).forEach(([key, value]) => {
    if (key in state.game.stats) state.game.stats[key] = clamp(state.game.stats[key] + Number(value), 0, 100);
  });
  if (effects.memory) state.game.memory.unshift(effects.memory);
  if (effects.item && !state.game.inventory.includes(effects.item)) state.game.inventory.unshift(effects.item);
  state.game.memory = state.game.memory.slice(0, 8);
}

function runEventPool() {
  if (state.game.currentScene === "ending") return null;
  if (state.game.turnNo % 2 !== 0) { state.game.lastEvent = null; return null; }
  const event = rollWeightedRandomFromArray(eventPool);
  if (!event) return null;
  applyEffects(event.effects || {});
  state.game.lastEvent = { name: event.name, text: event.text };
  state.game.eventPoolLog.push({ turn_no: state.game.turnNo, ...state.game.lastEvent, created_at: new Date().toISOString() });
  state.game.memory.unshift(event.text);
  state.game.memory = state.game.memory.slice(0, 8);
  return event;
}

function rollWeightedRandomFromArray(items) {
  const valid = items.filter((item) => item && Number(item.weight) > 0);
  const sum = valid.reduce((acc, item) => acc + Number(item.weight), 0);
  if (!sum) return null;
  let roll = Math.random() * sum;
  for (const item of valid) {
    roll -= Number(item.weight);
    if (roll <= 0) return item;
  }
  return valid[0] || null;
}

function renderStatus() {
  const visibleStats = Object.entries(state.game.stats).filter(([key]) => {
    if (state.settings.sidebar_stats === "minimal") return ["focus", "coherence"].includes(key);
    if (state.settings.sidebar_stats === "research") return ["smm", "tms", "traceability"].includes(key);
    return true;
  });
  const panel = document.getElementById("characterStatus");
  panel.innerHTML = `
    <h3>${escapeHtml(state.profile.character_name)}</h3>
    <p class="muted">${escapeHtml(state.profile.character_code)} / ${escapeHtml(state.profile.class_or_profession)}</p>
    <p class="muted">${escapeHtml(formatTime())}</p>
    <div class="stat-list">${visibleStats.map(([key, value]) => `
      <div class="stat-row"><span>${escapeHtml(statLabel(key))}</span><meter min="0" max="100" value="${value}"></meter><strong>${value}</strong></div>
    `).join("")}</div>
  `;
  renderCompact("memoryList", state.game.memory);
  renderCompact("inventoryList", state.game.inventory);
}

function renderCompact(id, items) {
  const node = document.getElementById(id);
  node.innerHTML = items.length ? items.map((item) => `<p>${escapeHtml(item)}</p>`).join("") : `<p class="empty">尚無資料</p>`;
}

function renderWorld() {
  document.getElementById("worldSettings").innerHTML = state.world.map((item) => `
    <article class="section-item"><h3>${escapeHtml(item.title)}</h3><p class="muted">${escapeHtml(item.code)}</p><p>${escapeHtml(item.summary)}</p></article>
  `).join("");
}

function renderTimeline() {
  const timeline = document.getElementById("eventTimeline");
  document.getElementById("logCount").textContent = `${state.game.events.length} 筆事件 / ${state.game.decisions.length} 筆決策 / ${state.game.retrievals.length} 筆查詢 / ${state.game.utterances.length} 筆發言`;
  if (state.game.events.length === 0) { timeline.innerHTML = `<p class="empty">尚無遊戲紀錄</p>`; return; }
  timeline.innerHTML = state.game.events.map((event) => `
    <article class="timeline-item">
      <div class="timeline-marker">Turn ${event.turn_no}<br>${escapeHtml(event.scene_code)}<br>${escapeHtml(formatTime(event.time_after))}</div>
      <div><h3>${escapeHtml(event.choice_label)}</h3><p>${escapeHtml(event.scene_title)} / ${escapeHtml(event.phase)}</p><p class="muted">${escapeHtml((event.tags || []).join(" / "))}</p></div>
    </article>
  `).join("");
}

function recordLookup(event) {
  event.preventDefault();
  const formData = new FormData(lookupForm);
  const query = String(formData.get("query") || "").trim();
  if (!query) return;
  state.game.retrievals.push({
    retrieval_code: `RET-${String(state.game.retrievals.length + 1).padStart(3, "0")}`,
    retrieval_no: state.game.retrievals.length + 1,
    retrieval_type: "manual_lookup",
    retrieval_purpose: String(formData.get("purpose") || "").trim(),
    query_text_raw: query,
    retrieval_success: false,
    retrieval_success_level: "unknown",
    source_turn_no: state.game.turnNo,
    created_at: new Date().toISOString(),
    source_type: "human_annotated",
    extraction_method: "manual"
  });
  lookupForm.reset();
  persist();
  renderLookupList();
  renderTimeline();
}

function renderLookupList() {
  const list = document.getElementById("lookupList");
  if (!list) return;
  list.innerHTML = state.game.retrievals.length ? state.game.retrievals.map((item) => `
    <p><strong>${escapeHtml(item.retrieval_code)}</strong> ${escapeHtml(item.retrieval_type)}：${escapeHtml(item.query_text_raw || item.retrieval_purpose || "系統查詢")}</p>
  `).join("") : `<p class="empty">尚無查詢紀錄</p>`;
}

function renderSaveSlots() {
  const node = document.getElementById("saveSlots");
  if (!node) return;
  const details = loadSaveDetails();
  const rows = ["auto", 0, 1, 2, 3, 4, 5, 6, 7].map((slot) => {
    const detail = slot === "auto" ? details.autosave : details.slots[slot];
    const label = slot === "auto" ? "自動存檔" : `槽 ${Number(slot) + 1}`;
    const meta = detail ? `${detail.scene_title || "未知場景"} / ${detail.saved_at || ""}` : "空白";
    const saveButton = slot === "auto" ? "" : `<button type="button" data-save-slot="${slot}">儲存</button>`;
    const loadButton = detail ? `<button type="button" data-load-slot="${slot}">讀取</button>` : "";
    const deleteButton = detail ? `<button type="button" data-delete-slot="${slot}">刪除</button>` : "";
    return `<article class="save-slot"><strong>${label}</strong><p>${escapeHtml(meta)}</p><div class="form-actions">${saveButton}${loadButton}${deleteButton}</div></article>`;
  }).join("");
  node.innerHTML = rows;
  node.querySelectorAll("[data-save-slot]").forEach((btn) => btn.addEventListener("click", () => { saveToSlot(Number(btn.dataset.saveSlot)); renderSaveSlots(); }));
  node.querySelectorAll("[data-load-slot]").forEach((btn) => btn.addEventListener("click", () => { loadFromSlot(btn.dataset.loadSlot === "auto" ? "auto" : Number(btn.dataset.loadSlot)); }));
  node.querySelectorAll("[data-delete-slot]").forEach((btn) => btn.addEventListener("click", () => { deleteSlot(btn.dataset.deleteSlot === "auto" ? "auto" : Number(btn.dataset.deleteSlot)); renderSaveSlots(); }));
}

function loadSaveDetails() {
  const raw = localStorage.getItem(SAVE_DETAILS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (_) { /* noop */ }
  }
  return { autosave: null, slots: Array(8).fill(null) };
}

function writeSaveDetails(details) { localStorage.setItem(SAVE_DETAILS_KEY, JSON.stringify(details)); }

function saveToSlot(slot) {
  const details = loadSaveDetails();
  const scene = scenes[state.game.currentScene] || scenes.opening;
  const payload = JSON.stringify(state);
  const metadata = { saved_at: new Date().toLocaleString("zh-TW"), scene_title: scene.title, turn_no: state.game.turnNo, engine_version: ENGINE_VERSION };
  if (slot === "auto") {
    localStorage.setItem(AUTOSAVE_KEY, payload);
    details.autosave = metadata;
  } else {
    localStorage.setItem(`${SAVE_SLOT_PREFIX}${slot}`, payload);
    details.slots[slot] = metadata;
  }
  writeSaveDetails(details);
}

function loadFromSlot(slot) {
  const raw = slot === "auto" ? localStorage.getItem(AUTOSAVE_KEY) : localStorage.getItem(`${SAVE_SLOT_PREFIX}${slot}`);
  if (!raw) return;
  try {
    state = mergeState(structuredClone(defaultState), JSON.parse(raw));
    persist();
    fillForms();
    renderAll();
    switchPage("game");
  } catch (_) { alert("存檔無法讀取"); }
}

function deleteSlot(slot) {
  const details = loadSaveDetails();
  if (slot === "auto") {
    localStorage.removeItem(AUTOSAVE_KEY);
    details.autosave = null;
  } else {
    localStorage.removeItem(`${SAVE_SLOT_PREFIX}${slot}`);
    details.slots[slot] = null;
  }
  writeSaveDetails(details);
}

function fillForms() {
  fillForm(characterForm, state.profile);
  fillForm(corpusForm, state.corpus);
  fillForm(settingsForm, state.settings);
}

function fillForm(form, values) {
  Array.from(form.elements).forEach((element) => {
    if (element.name && values[element.name] !== undefined) element.value = values[element.name];
  });
}

function saveCharacter(event) {
  event.preventDefault();
  const formData = new FormData(characterForm);
  formData.forEach((value, key) => { state.profile[key] = String(value || "").trim(); });
  persist();
  renderAll();
  switchPage("game");
}

function saveCorpusSettings(event) {
  event.preventDefault();
  const formData = new FormData(corpusForm);
  formData.forEach((value, key) => { state.corpus[key] = String(value || "").trim(); });
  persist();
  renderMapping();
}

function saveSettings(event) {
  event.preventDefault();
  const formData = new FormData(settingsForm);
  formData.forEach((value, key) => { state.settings[key] = String(value || "").trim(); });
  persist();
  renderAll();
  switchPage("game");
}

function buildCorpusExport() {
  const c = state.corpus;
  return {
    metadata: {
      export_format: "da_go_trpg_corpus_json_v2",
      target_database: "TRPG_Corpus_DB",
      engine_version: ENGINE_VERSION,
      project_code: c.project_code,
      team_code: c.team_code,
      session_code: c.session_code,
      import_batch_code: c.import_batch_code,
      exported_at: new Date().toISOString()
    },
    dbo_Player_Character: [{
      character_code: state.profile.character_code,
      character_name: state.profile.character_name,
      character_type: state.profile.character_type,
      archetype: state.profile.archetype,
      race_or_species: state.profile.race_or_species,
      class_or_profession: state.profile.class_or_profession,
      faction: state.profile.faction,
      narrative_function: state.profile.narrative_function,
      background_story: state.profile.background_story,
      personality_note: state.profile.personality_note,
      motivation_note: state.profile.motivation_note,
      relationship_note: state.profile.relationship_note,
      ability_note: state.profile.ability_note,
      item_note: state.profile.item_note
    }],
    dbo_Scene: Object.values(scenes).map((scene, index) => ({
      scene_code: scene.code,
      scene_no: index + 1,
      scene_title: scene.title,
      narrative_phase: scene.phase,
      scene_summary: scene.text
    })),
    dbo_Utterance: state.game.utterances,
    dbo_Decision_Log: state.game.decisions,
    dbo_Knowledge_Retrieval_Log: state.game.retrievals,
    dbo_Team_Play_History: [{
      session_code: c.session_code,
      history_summary: state.game.events.map((event) => `${event.turn_no}. ${event.choice_label}`).join("\n"),
      smm_summary: `Final SMM=${state.game.stats.smm}`,
      tms_summary: `Final TMS=${state.game.stats.tms}`,
      traceability_summary: `Final traceability=${state.game.stats.traceability}`,
      settings_summary: JSON.stringify(state.settings)
    }],
    raw_game_events: state.game.events,
    raw_event_pool: state.game.eventPoolLog
  };
}

function renderMapping() {
  const data = [
    ["角色卡", "dbo.Player_Character", "角色名稱、代碼、身份、背景、動機、能力"],
    ["場景文本", "dbo.Scene", "場景代碼、敘事階段、摘要"],
    ["玩家選擇", "dbo.Decision_Log", "決策類型、共識品質、SMM/TMS 註記"],
    ["系統發言", "dbo.Utterance", "回合、發話類型、功能、逐字稿文本"],
    ["知識查詢", "dbo.Knowledge_Retrieval_Log", "查詢目的、查詢文字、來源回合"],
    ["歷程摘要", "dbo.Team_Play_History", "場次總結、SMM/TMS/可追溯性摘要"]
  ];
  document.getElementById("mappingTable").innerHTML = data.map((row) => `
    <div class="mapping-row"><strong>${escapeHtml(row[0])}</strong><span>${escapeHtml(row[1])}</span><p>${escapeHtml(row[2])}</p></div>
  `).join("");
}

function makeUtterance(choice, scene) {
  return {
    turn_no: state.game.turnNo,
    utterance_code: `UTT-${String(state.game.utterances.length + 1).padStart(4, "0")}`,
    scene_code: scene.code,
    speaker_type: "PL",
    speaker_code: state.profile.character_code,
    speaker_label_raw: state.profile.character_name,
    utterance_function: mapUtteranceFunction(choice.tags || []),
    is_in_character: false,
    is_gm_narration: false,
    is_rule_related: (choice.tags || []).some((tag) => tag.includes("rule")),
    is_decision_related: true,
    is_knowledge_related: (choice.tags || []).some((tag) => tag.includes("lookup") || tag.includes("tms")),
    start_timecode: formatTime(),
    utterance_text_raw: choice.label,
    language_code: "zh-TW",
    review_status: "system_generated",
    include_in_analysis: true
  };
}

function makeRetrieval(choice, scene) {
  return {
    retrieval_code: `RET-${String(state.game.retrievals.length + 1).padStart(3, "0")}`,
    retrieval_no: state.game.retrievals.length + 1,
    retrieval_type: mapRetrievalType(choice.tags || []),
    retrieval_purpose: choice.label,
    query_initiator_role: "PL",
    query_text_raw: `由場景 ${scene.code} 觸發：${choice.label}`,
    retrieval_success: true,
    retrieval_success_level: "partial",
    was_result_used_in_decision: true,
    source_turn_no: state.game.turnNo,
    tms_relevance_note: "系統自動記錄由選擇觸發的知識查詢。",
    source_type: "system_log",
    extraction_method: "system",
    created_at: new Date().toISOString()
  };
}

function mapDecisionType(tags) {
  if (tags.includes("role_assignment")) return "role_assignment";
  if (tags.includes("creation_choice")) return "creation_choice";
  if (tags.includes("rule_interpretation")) return "rule_interpretation";
  if (tags.includes("worldbuilding_choice")) return "worldbuilding_choice";
  if (tags.includes("action_choice")) return "action_choice";
  return "other";
}

function mapRetrievalType(tags) {
  if (tags.includes("rule_lookup")) return "rule_lookup";
  if (tags.includes("world_setting_lookup")) return "world_setting_lookup";
  if (tags.includes("character_lookup")) return "character_lookup";
  if (tags.includes("transcript_lookup")) return "transcript_lookup";
  return "database_query";
}

function mapUtteranceFunction(tags) {
  if (tags.includes("rule_lookup") || tags.includes("rule_interpretation")) return "rule_check";
  if (tags.includes("consensus_quality")) return "clarification";
  if (tags.includes("decision_trace")) return "summary";
  return "decision";
}

function inferConsensusLevel() {
  const value = state.game.stats.smm;
  if (value >= 85) return "unanimous";
  if (value >= 70) return "high";
  if (value >= 45) return "medium";
  if (value >= 25) return "low";
  return "none";
}

function inferDecisionImportance(tags) {
  if (tags.includes("causal_link") || tags.includes("worldbuilding_choice")) return "high";
  if (tags.includes("gm_decided")) return "critical";
  return "medium";
}

function statLabel(key) {
  return ({ focus: "專注", creativity: "創造力", coherence: "一致性", smm: "SMM", tms: "TMS", traceability: "可追溯" })[key] || key;
}

function formatTime(value = state.time) {
  return `第 ${value.day} 日 ${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}

function importJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { state = mergeState(structuredClone(defaultState), JSON.parse(String(reader.result || "{}"))); persist(); fillForms(); renderAll(); }
    catch (_) { alert("JSON 格式無法解析"); }
  };
  reader.readAsText(file, "utf-8");
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyCorpusExport() {
  const text = JSON.stringify(buildCorpusExport(), null, 2);
  try { await navigator.clipboard.writeText(text); alert("已複製 corpus JSON"); }
  catch (_) { downloadJson("da-go-trpg-corpus-export.json", buildCorpusExport()); }
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
