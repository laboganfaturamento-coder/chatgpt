const STORAGE_KEY = "devocionalQuestData";
const XP_PER_DEVOTIONAL = 25;

const RANKS = [
  { name: "Bronze", minXp: 0 },
  { name: "Prata", minXp: 100 },
  { name: "Ouro", minXp: 250 },
  { name: "Rubi", minXp: 450 },
  { name: "Diamante", minXp: 700 },
  { name: "Platina", minXp: 1000 },
  { name: "Mestre", minXp: 1400 },
  { name: "Lendário", minXp: 1900 }
];

const defaultState = {
  completedDays: 0,
  streak: 0,
  xp: 0,
  lastDevotionalDate: null,
  profile: {
    name: "",
    bio: ""
  },
  pet: {
    name: "",
    type: "Cordeiro",
    accessory: ""
  }
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

function getRankByXp(xp) {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) currentRank = rank;
  }
  return currentRank;
}

function getNextRank(xp) {
  return RANKS.find((rank) => rank.minXp > xp) ?? null;
}

function updateUI() {
  completedDaysEl.textContent = state.completedDays;
  streakEl.textContent = state.streak;
  xpEl.textContent = state.xp;

  const rank = getRankByXp(state.xp);
  rankEl.textContent = rank.name;

  const nextRank = getNextRank(state.xp);
  if (!nextRank) {
    nextRankEl.textContent = "Você chegou ao rank máximo. Continue firme na Palavra!";
    xpBarEl.style.width = "100%";
  } else {
    const xpWithinLevel = state.xp - rank.minXp;
    const levelRange = nextRank.minXp - rank.minXp;
    const percentage = Math.max(0, Math.min(100, (xpWithinLevel / levelRange) * 100));
    xpBarEl.style.width = `${percentage}%`;
    nextRankEl.textContent = `Faltam ${nextRank.minXp - state.xp} XP para ${nextRank.name}.`;
  }

  profileNameEl.value = state.profile.name;
  profileBioEl.value = state.profile.bio;

  petNameEl.value = state.pet.name;
  petTypeEl.value = state.pet.type;
  petAccessoryEl.value = state.pet.accessory;
  petPreviewEl.textContent = state.pet.name
    ? `${state.pet.name}, seu ${state.pet.type}, está usando: ${state.pet.accessory || "sem acessório"}.`
    : "Dê um nome ao seu pet para começar.";
}

function markDevotionalAsDone() {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (state.lastDevotionalDate === today) {
    dayStatusEl.textContent = "Você já marcou o devocional de hoje. 🙌";
    return;
  }

  state.completedDays += 1;
  state.xp += XP_PER_DEVOTIONAL;

  if (state.lastDevotionalDate === yesterday) {
    state.streak += 1;
  } else {
    state.streak = 1;
  }

  state.lastDevotionalDate = today;
  dayStatusEl.textContent = `Parabéns! +${XP_PER_DEVOTIONAL} XP e fogo aceso por ${state.streak} dia(s)! 🔥`;
  saveState();
  updateUI();
}

function getBiblicalAdvice(question) {
  const text = question.toLowerCase();

  if (text.includes("relacionamento") || text.includes("casamento") || text.includes("namoro")) {
    return "Em relacionamentos, pratique diálogo com amor e perdão. A Bíblia ensina em Efésios 4:2-3 a viver com humildade, mansidão e paciência, preservando a unidade. Ore junto e conversem sem atacar um ao outro.";
  }
  if (text.includes("ansiedade") || text.includes("medo") || text.includes("triste")) {
    return "Quando houver ansiedade, entregue isso em oração. Filipenses 4:6-7 orienta a apresentar tudo a Deus com ações de graças, e a paz dEle guardará seu coração.";
  }
  if (text.includes("pecado") || text.includes("culpa") || text.includes("erro")) {
    return "Deus oferece arrependimento e recomeço. 1 João 1:9 diz que, ao confessarmos nossos pecados, Ele é fiel e justo para perdoar e purificar.";
  }

  return "Busque sabedoria em oração e na Palavra. Provérbios 3:5-6 orienta confiar no Senhor de todo o coração e Ele endireitará seus caminhos. Se quiser, me conte mais detalhes para um conselho mais específico.";
}

const state = loadState();

const completedDaysEl = document.getElementById("completedDays");
const streakEl = document.getElementById("streak");
const xpEl = document.getElementById("xp");
const rankEl = document.getElementById("rank");
const nextRankEl = document.getElementById("nextRank");
const xpBarEl = document.getElementById("xpBar");
const dayStatusEl = document.getElementById("dayStatus");

const completeDevotionalBtn = document.getElementById("completeDevotionalBtn");
const askAiBtn = document.getElementById("askAiBtn");
const userQuestionEl = document.getElementById("userQuestion");
const aiResponseEl = document.getElementById("aiResponse");

const profileNameEl = document.getElementById("profileName");
const profileBioEl = document.getElementById("profileBio");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const petNameEl = document.getElementById("petName");
const petTypeEl = document.getElementById("petType");
const petAccessoryEl = document.getElementById("petAccessory");
const savePetBtn = document.getElementById("savePetBtn");
const petPreviewEl = document.getElementById("petPreview");

completeDevotionalBtn.addEventListener("click", markDevotionalAsDone);

askAiBtn.addEventListener("click", () => {
  const question = userQuestionEl.value.trim();
  if (!question) {
    aiResponseEl.textContent = "Escreva sua pergunta para receber um conselho bíblico.";
    return;
  }
  aiResponseEl.textContent = getBiblicalAdvice(question);
});

saveProfileBtn.addEventListener("click", () => {
  state.profile.name = profileNameEl.value.trim();
  state.profile.bio = profileBioEl.value.trim();
  saveState();
  updateUI();
});

savePetBtn.addEventListener("click", () => {
  state.pet.name = petNameEl.value.trim();
  state.pet.type = petTypeEl.value;
  state.pet.accessory = petAccessoryEl.value.trim();
  saveState();
  updateUI();
});

updateUI();
