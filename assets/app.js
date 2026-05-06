const STORAGE_KEY = "daGoTrpgSiteData";

const defaultData = {
  profile: {
    character_name: "示範角色",
    character_code: "DEMO-PC01",
    character_type: "player_character",
    archetype: "示範原型",
    race_or_species: "示範種族",
    class_or_profession: "示範職業",
    faction: "示範陣營",
    narrative_function: "示範敘事功能",
    background_story: "這是一筆示範角色背景。玩家可在角色建立頁輸入新資料，或匯入 JSON 替換。",
    personality_note: "示範個性文字。",
    motivation_note: "示範動機文字。",
    relationship_note: "示範關係文字。",
    ability_note: "示範能力文字。",
    item_note: "示範物品文字。"
  },
  images: {
    headshot: "",
    fullbody: ""
  },
  fields: [
    { label: "玩家備註", value: "此頁資料保存在瀏覽器 localStorage，可匯出 JSON 備份。" },
    { label: "自訂欄位示範", value: "玩家可直接修改此欄位內容。" }
  ],
  story: [
    {
      session_no: 1,
      scene_no: 1,
      kind: "示範場景",
      title: "示範紀錄一",
      type_label: "demo_opening",
      summary_text: "這是一筆示範團務劇情紀錄。"
    },
    {
      session_no: 1,
      scene_no: 2,
      kind: "示範事件",
      title: "示範紀錄二",
      type_label: "demo_event",
      summary_text: "此處可放置由資料庫匯出的事件摘要。"
    },
    {
      session_no: 1,
      scene_no: 3,
      kind: "示範決策",
      title: "示範紀錄三",
      type_label: "demo_decision",
      summary_text: "此處可放置玩家選擇、GM 裁定與後續劇情。"
    }
  ]
};

let state = loadState();

const tabs = Array.from(document.querySelectorAll(".tab"));
const pages = {
  character: document.getElementById("page-character"),
  images: document.getElementById("page-images"),
  fields: document.getElementById("page-fields"),
  story: document.getElementById("page-story"),
  create: document.getElementById("page-create")
};

const importFile = document.getElementById("importFile");
const exportData = document.getElementById("exportData");
const resetDemo = document.getElementById("resetDemo");
const headshotFile = document.getElementById("headshotFile");
const fullbodyFile = document.getElementById("fullbodyFile");
const addField = document.getElementById("addField");
const characterForm = document.getElementById("characterForm");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchPage(tab.dataset.page));
});

importFile.addEventListener("change", importJson);
exportData.addEventListener("click", exportJson);
resetDemo.addEventListener("click", () => {
  state = structuredClone(defaultData);
  persist();
  renderAll();
});
headshotFile.addEventListener("change", (event) => readImage(event, "headshot"));
fullbodyFile.addEventListener("change", (event) => readImage(event, "fullbody"));
addField.addEventListener("click", () => {
  state.fields.push({ label: "", value: "" });
  persist();
  renderFields();
});
characterForm.addEventListener("submit", createCharacter);

renderAll();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);
  try {
    return mergeData(structuredClone(defaultData), JSON.parse(raw));
  } catch (_) {
    return structuredClone(defaultData);
  }
}

function mergeData(base, incoming) {
  return {
    profile: { ...base.profile, ...(incoming.profile || {}) },
    images: { ...base.images, ...(incoming.images || {}) },
    fields: Array.isArray(incoming.fields) ? incoming.fields : base.fields,
    story: Array.isArray(incoming.story) ? incoming.story : base.story
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function switchPage(pageKey) {
  if (!pages[pageKey]) return;
  tabs.forEach((tab) => {
    tab.setAttribute("aria-current", tab.dataset.page === pageKey ? "page" : "false");
  });
  Object.entries(pages).forEach(([key, page]) => {
    page.hidden = key !== pageKey;
  });
}

function renderAll() {
  renderProfile();
  renderMetrics();
  renderSections();
  renderImages();
  renderFields();
  renderStory();
}

function renderProfile() {
  const profile = state.profile;
  const panel = document.getElementById("characterProfile");
  panel.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = profile.character_name || "-";
  const meta = document.createElement("p");
  meta.className = "muted";
  meta.textContent = [profile.character_code, profile.character_type].filter(Boolean).join(" / ");
  const list = document.createElement("dl");

  [
    ["原型", profile.archetype],
    ["種族", profile.race_or_species],
    ["職業", profile.class_or_profession],
    ["陣營", profile.faction],
    ["敘事功能", profile.narrative_function],
    ["背景", profile.background_story]
  ].forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "field-row";
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value || "-";
    row.append(dt, dd);
    list.appendChild(row);
  });

  panel.append(title, meta, list);
}

function renderMetrics() {
  const metrics = document.getElementById("metrics");
  metrics.innerHTML = "";
  [
    ["角色", state.profile.character_name ? 1 : 0],
    ["自填欄位", state.fields.length],
    ["團務紀錄", state.story.length],
    ["圖片", Number(Boolean(state.images.headshot)) + Number(Boolean(state.images.fullbody))],
    ["JSON", 1]
  ].forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "metric";
    card.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
    metrics.appendChild(card);
  });
}

function renderSections() {
  const sections = document.getElementById("sections");
  sections.innerHTML = "";
  const items = [
    ["角色個性", state.profile.personality_note],
    ["角色動機", state.profile.motivation_note],
    ["角色關係", state.profile.relationship_note],
    ["能力", state.profile.ability_note],
    ["物品", state.profile.item_note]
  ];

  items.forEach(([title, text]) => {
    const item = document.createElement("article");
    item.className = "section-item";
    item.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(text || "-")}</p>`;
    sections.appendChild(item);
  });
}

function renderImages() {
  setImage("headshot", state.images.headshot);
  setImage("fullbody", state.images.fullbody);
  renderMetrics();
}

function setImage(slot, dataUrl) {
  const preview = document.getElementById(`${slot}Preview`);
  const empty = document.getElementById(`${slot}Empty`);
  if (dataUrl) {
    preview.src = dataUrl;
    preview.hidden = false;
    empty.hidden = true;
  } else {
    preview.removeAttribute("src");
    preview.hidden = true;
    empty.hidden = false;
  }
}

function readImage(event, slot) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.images[slot] = String(reader.result || "");
    persist();
    renderImages();
  };
  reader.readAsDataURL(file);
}

function renderFields() {
  const list = document.getElementById("fieldList");
  list.innerHTML = "";

  if (state.fields.length === 0) {
    list.innerHTML = '<p class="empty">尚無自填欄位</p>';
    return;
  }

  state.fields.forEach((field, index) => {
    const row = document.createElement("section");
    row.className = "free-field";

    const labelWrap = document.createElement("label");
    labelWrap.textContent = "欄位名稱";
    const labelInput = document.createElement("input");
    labelInput.value = field.label || "";
    labelInput.addEventListener("input", () => {
      state.fields[index].label = labelInput.value;
      persist();
    });
    labelWrap.appendChild(labelInput);

    const valueWrap = document.createElement("label");
    valueWrap.textContent = "內容";
    const valueInput = document.createElement("textarea");
    valueInput.value = field.value || "";
    valueInput.addEventListener("input", () => {
      state.fields[index].value = valueInput.value;
      persist();
    });
    valueWrap.appendChild(valueInput);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "刪除";
    remove.addEventListener("click", () => {
      state.fields.splice(index, 1);
      persist();
      renderFields();
      renderMetrics();
    });

    row.append(labelWrap, valueWrap, remove);
    list.appendChild(row);
  });
}

function renderStory() {
  const scroll = document.getElementById("storyScroll");
  const count = document.getElementById("storyCount");
  scroll.innerHTML = "";
  count.textContent = `${state.story.length} 筆`;

  if (state.story.length === 0) {
    scroll.innerHTML = '<p class="empty">尚無團務劇情紀錄</p>';
    return;
  }

  state.story.forEach((record) => {
    const item = document.createElement("article");
    item.className = "story-record";
    item.innerHTML = `
      <div class="story-marker">場次 ${escapeHtml(record.session_no || "-")}<br>場景 ${escapeHtml(record.scene_no || "-")}</div>
      <div>
        <h3>${escapeHtml(record.title || "-")}</h3>
        <div class="story-meta">
          <span class="pill">${escapeHtml(record.kind || "-")}</span>
          <span class="pill">${escapeHtml(record.type_label || "-")}</span>
        </div>
        <p>${escapeHtml(record.summary_text || "-")}</p>
      </div>
    `;
    scroll.appendChild(item);
  });
}

function createCharacter(event) {
  event.preventDefault();
  const formData = new FormData(characterForm);
  formData.forEach((value, key) => {
    state.profile[key] = String(value || "").trim();
  });
  persist();
  renderAll();
  switchPage("character");
}

function importJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = mergeData(structuredClone(defaultData), JSON.parse(String(reader.result || "{}")));
      persist();
      renderAll();
    } catch (_) {
      alert("JSON 格式無法解析");
    }
  };
  reader.readAsText(file, "utf-8");
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "da-go-trpg-data.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
