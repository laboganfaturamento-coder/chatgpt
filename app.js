const STORAGE_KEY = "adorayDevocionalState";

const RANKS = [
  { name: "Bronze", minXp: 0 },
  { name: "Prata", minXp: 120 },
  { name: "Ouro", minXp: 280 },
  { name: "Rubi", minXp: 500 },
  { name: "Diamante", minXp: 780 },
  { name: "Platina", minXp: 1120 },
  { name: "Mestre", minXp: 1520 },
  { name: "Lendário", minXp: 2000 }
];

const DEVOTIONALS = [
  { title: "João 1 - A Palavra Viva", emoji: "📖", colors: "#8fd3ff, #4d7dff" },
  { title: "Salmo 23 - O Bom Pastor", emoji: "🐑", colors: "#8ef3b2, #38b66f" },
  { title: "Mateus 5 - Sermão do Monte", emoji: "⛰️", colors: "#ffe48f, #ffad43" },
  { title: "Filipenses 4 - Paz no coração", emoji: "🕊️", colors: "#b7f2ff, #5bc6f6" },
  { title: "Romanos 8 - Vida no Espírito", emoji: "🔥", colors: "#ffc1a6, #ff7f50" },
  { title: "Tiago 1 - Fé prática", emoji: "💡", colors: "#e6d2ff, #a16bf3" },
  { title: "Efésios 6 - Armadura de Deus", emoji: "🛡️", colors: "#c1d2ff, #6a8bff" },
  { title: "1 Coríntios 13 - Amor verdadeiro", emoji: "❤️", colors: "#ffc1df, #ff6da9" }
];

const defaultState = {
  theme: "light",
  xp: 0,
  streak: 0,
  lastCheckin: null,
  devotionalProgress: 0,
  bibleVersion: "ARA",
  onboardingDone: false,
  onboardingAnswers: {},
  profile: { name: "", bio: "" },
  pet: { name: "Manna", type: "Cordeiro", accessory: "Coroa de louvor" }
};

const state = loadState();
applyTheme();

const onboardingEl = document.getElementById("onboarding");
const appRootEl = document.getElementById("appRoot");
const onboardingStatusEl = document.getElementById("onboardingStatus");

const tabs = document.querySelectorAll(".tab");
const navButtons = document.querySelectorAll(".nav-btn");

const homeStreak = document.getElementById("homeStreak");
const homeXp = document.getElementById("homeXp");
const homeRank = document.getElementById("homeRank");
const petDisplay = document.getElementById("petDisplay");
const petProgress = document.getElementById("petProgress");
const devotionalTrail = document.getElementById("devotionalTrail");
const trailStatus = document.getElementById("trailStatus");

const rankXp = document.getElementById("rankXp");
const rankName = document.getElementById("rankName");
const rankProgress = document.getElementById("rankProgress");
const rankHint = document.getElementById("rankHint");

const bibleVersion = document.getElementById("bibleVersion");
const selectedVersion = document.getElementById("selectedVersion");
const chatInput = document.getElementById("chatInput");
const chatOutput = document.getElementById("chatOutput");

const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");
const petName = document.getElementById("petName");
const petType = document.getElementById("petType");
const petAccessory = document.getElementById("petAccessory");

initEvents();
renderAppVisibility();
render();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      profile: { ...defaultState.profile, ...(parsed.profile || {}) },
      pet: { ...defaultState.pet, ...(parsed.pet || {}) }
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initEvents() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  document.getElementById("themeToggleBtn").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    saveState();
  });

  document.getElementById("saveOnboardingBtn").addEventListener("click", submitOnboarding);

  bibleVersion.addEventListener("change", () => {
    state.bibleVersion = bibleVersion.value;
    saveState();
    render();
  });

  document.getElementById("sendChatBtn").addEventListener("click", () => {
    const q = chatInput.value.trim();
    if (!q) {
      chatOutput.textContent = "Digite sua pergunta para conversar com a IA bíblica.";
      return;
    }
    chatOutput.textContent = getBiblicalAdvice(q);
  });

  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    state.profile.name = profileName.value.trim();
    state.profile.bio = profileBio.value.trim();
    saveState();
    render();
  });

  document.getElementById("savePetBtn").addEventListener("click", () => {
    state.pet.name = petName.value.trim() || "Manna";
    state.pet.type = petType.value;
    state.pet.accessory = petAccessory.value.trim();
    saveState();
    render();
  });
}

function renderAppVisibility() {
  onboardingEl.classList.toggle("hidden", state.onboardingDone);
  appRootEl.classList.toggle("hidden", !state.onboardingDone);
}

function submitOnboarding() {
  const q1 = getSingle("q1");
  const q2 = getMultiple("q2");
  const q3 = getSingle("q3");
  const q4 = getSingle("q4");
  const q5 = getSingle("q5");
  const q6 = getMultiple("q6");

  if (!q1 || q2.length === 0 || !q3 || !q4 || !q5 || q6.length === 0) {
    onboardingStatusEl.textContent = "Responda todas as perguntas para começar.";
    return;
  }

  state.onboardingAnswers = { q1, q2, q3, q4, q5, q6 };
  state.onboardingDone = true;
  saveState();
  renderAppVisibility();
  render();
}

function getSingle(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function getMultiple(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

function switchTab(tabName) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.id === `tab-${tabName}`));
  navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
}

function render() {
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);

  homeStreak.textContent = state.streak;
  homeXp.textContent = state.xp;
  homeRank.textContent = rank.name;

  rankXp.textContent = state.xp;
  rankName.textContent = rank.name;
  if (!nextRank) {
    rankProgress.style.width = "100%";
    rankHint.textContent = "Você chegou no rank máximo.";
  } else {
    const pct = ((state.xp - rank.minXp) / (nextRank.minXp - rank.minXp)) * 100;
    rankProgress.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    rankHint.textContent = `Faltam ${nextRank.minXp - state.xp} XP para ${nextRank.name}.`;
  }

  const petLevel = Math.floor(state.xp / 120) + 1;
  const petPct = Math.min(100, ((state.xp % 120) / 120) * 100);
  petDisplay.textContent = `${state.pet.name}, ${state.pet.type} • ${state.pet.accessory || "sem acessório"} • Nível ${petLevel}`;
  petProgress.style.width = `${petPct}%`;

  selectedVersion.textContent = state.bibleVersion;
  bibleVersion.value = state.bibleVersion;

  profileName.value = state.profile.name;
  profileBio.value = state.profile.bio;
  petName.value = state.pet.name;
  petType.value = state.pet.type;
  petAccessory.value = state.pet.accessory;

  renderTrail();
}

function renderTrail() {
  devotionalTrail.innerHTML = "";
  DEVOTIONALS.forEach((devotional, index) => {
    const item = document.createElement("div");
    const sideClass = index % 2 === 0 ? "left" : "right";
    const done = index < state.devotionalProgress;
    const current = index === state.devotionalProgress;

    item.className = `trail-item ${sideClass} ${done ? "done" : ""} ${current ? "current" : ""}`;
    item.innerHTML = `
      <div class="devotional-illustration" data-emoji="${devotional.emoji}" style="background-image: linear-gradient(135deg, ${devotional.colors})"></div>
      <div class="step">Etapa ${index + 1}</div>
      <h4>${devotional.title}</h4>
      <p class="hint">+35 XP ao concluir</p>
      ${done ? "<button disabled>Concluído ✅</button>" : current ? '<button data-devotional="current">Iniciar devocional</button>' : "<button disabled>Bloqueado</button>"}
    `;
    devotionalTrail.appendChild(item);
  });

  devotionalTrail.querySelectorAll('button[data-devotional="current"]').forEach((btn) => {
    btn.addEventListener("click", completeCurrentDevotional);
  });

  if (state.devotionalProgress >= DEVOTIONALS.length) {
    trailStatus.textContent = "Parabéns! Você concluiu toda a trilha. Reinicie para ganhar mais XP.";
  } else {
    trailStatus.textContent = `Próxima etapa: ${state.devotionalProgress + 1} de ${DEVOTIONALS.length}.`;
  }
}

function completeCurrentDevotional() {
  const today = getToday();
  const yesterday = getYesterday();

  if (state.lastCheckin === today) {
    trailStatus.textContent = "Você já concluiu um devocional hoje. Volte amanhã para manter o streak!";
    return;
  }

  if (state.devotionalProgress >= DEVOTIONALS.length) {
    state.devotionalProgress = 0;
  }

  state.devotionalProgress += 1;
  state.xp += 35;
  state.streak = state.lastCheckin === yesterday ? state.streak + 1 : 1;
  state.lastCheckin = today;

  saveState();
  render();
}

function getRankByXp(xp) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) current = rank;
  }
  return current;
}

function getNextRank(xp) {
  return RANKS.find((r) => r.minXp > xp) ?? null;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
}

function getBiblicalAdvice(question) {
  const text = question.toLowerCase();
  if (text.includes("relacionamento") || text.includes("namoro") || text.includes("casamento")) {
    return "Converse com amor e verdade. Efésios 4:2-3 ensina humildade e paciência. Ore antes de conversar e escute de verdade o outro lado.";
  }
  if (text.includes("ansiedade") || text.includes("medo")) {
    return "Filipenses 4:6-7: apresente tudo a Deus em oração. Respire, entregue sua preocupação e caminhe um dia de cada vez.";
  }
  if (text.includes("propósito") || text.includes("chamado")) {
    return "Seu propósito começa em conhecer e obedecer a Deus. Leia Provérbios 3:5-6 e Jeremias 29:11 para direção.";
  }
  return "Busque sabedoria em oração e na Palavra. Se quiser, me conte mais detalhes para uma resposta mais específica.";
}
