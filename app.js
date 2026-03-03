const STORAGE_KEY = "adorayDevocionalState";
const $ = (id) => document.getElementById(id);

const RANKS = [
  { name: "Divisão Bronze", minXp: 0 }, { name: "Divisão Prata", minXp: 120 }, { name: "Divisão Ouro", minXp: 280 },
  { name: "Divisão Rubi", minXp: 500 }, { name: "Divisão Diamante", minXp: 780 }, { name: "Divisão Platina", minXp: 1120 },
  { name: "Divisão Mestre", minXp: 1520 }, { name: "Divisão Lendário", minXp: 2000 }
];

const ONBOARDING_QUESTIONS = [
  { id: "q1", text: "Quanto tempo você quer dedicar ao devocional por dia?", multi: false, options: ["5 a 10 minutos", "10 a 20 minutos", "20 a 30 minutos", "30+ minutos"] },
  { id: "q2", text: "Qual é seu objetivo neste momento?", multi: true, options: ["Criar o hábito diário", "Aprofundar minha fé", "Encontrar paz / reduzir ansiedade", "Entender melhor a Bíblia", "Outro"] },
  { id: "q3", text: "Com que frequência você quer fazer o devocional?", multi: false, options: ["Todos os dias", "Algumas vezes por semana", "Apenas quando eu precisar"] },
  { id: "q4", text: "Você quer receber lembretes?", multi: false, options: ["Sim (escolher horário)", "Não"] },
  { id: "q5", text: "Como você descreveria sua jornada espiritual?", multi: false, options: ["Estou começando agora", "Já tenho o hábito de ler a Bíblia", "Quero retomar minha caminhada"] },
  { id: "q6", text: "Quais temas te interessam mais?", multi: true, options: ["Fé", "Ansiedade", "Propósito", "Relacionamentos", "Gratidão", "Perdão"] }
];

const DAILY = {
  "Fé": ["Hebreus 11:1", "A fé é a certeza do que esperamos.", "Dê hoje um passo prático de confiança em Deus.", "Onde você precisa confiar mais em Deus hoje?"],
  "Ansiedade": ["Filipenses 4:6-7", "Não andeis ansiosos por coisa alguma.", "Ore por 3 minutos entregando suas preocupações.", "Qual preocupação você vai entregar a Deus agora?"],
  "Propósito": ["Jeremias 29:11", "Eu é que sei os planos que tenho para vocês.", "Escreva um dom que você pode usar para servir.", "Como você pode viver seu propósito hoje?"],
  "Liderança": ["Marcos 10:45", "Quem lidera, sirva.", "Pratique liderança servindo alguém hoje.", "Quem você pode levantar hoje?"],
  "Relacionamento": ["Efésios 4:2", "Com toda humildade e mansidão.", "Tenha uma conversa com empatia e perdão.", "Qual atitude de amor você pode tomar hoje?"]
};

const DEVOTIONALS = [
  { title: "João 1 - A Palavra Viva", emoji: "📖", colors: "#8fd3ff, #4d7dff", verse: "João 1:1 — No princípio era o Verbo...", question: "Quem é chamado de Verbo?", options: ["Moisés", "Jesus", "Davi", "Paulo"], correct: 1, explain: "Jesus é o Verbo." },
  { title: "Salmo 23 - O Bom Pastor", emoji: "🐑", colors: "#8ef3b2, #38b66f", verse: "Salmo 23:1 — O Senhor é o meu pastor...", question: "O que não faltará?", options: ["Riqueza", "Nada", "Tempo", "Força"], correct: 1, explain: "Com Deus, nada faltará." },
  { title: "Mateus 5 - Sermão do Monte", emoji: "⛰️", colors: "#ffe48f, #ffad43", verse: "Mateus 5:9 — Bem-aventurados os pacificadores...", question: "Quem são chamados filhos de Deus?", options: ["Pacificadores", "Juízes", "Ricos", "Guerreiros"], correct: 0, explain: "Os pacificadores." }
];

const BIBLE_DATA = {
  "Gênesis": { 1: ["No princípio criou Deus os céus e a terra.", "A terra era sem forma e vazia.", "Haja luz."] },
  "Salmos": { 23: ["O Senhor é o meu pastor; nada me faltará.", "Deitar-me faz em verdes pastos.", "Não temerei mal algum."] },
  "João": { 1: ["No princípio era o Verbo.", "Ele estava no princípio com Deus.", "Todas as coisas foram feitas por ele."] },
  "Romanos": { 8: ["Nenhuma condenação há em Cristo.", "A lei do Espírito da vida me livrou.", "Todas as coisas cooperam para o bem."] }
};

const defaultState = {
  theme: "light", xp: 0, coins: 120, streak: 0, hearts: 3, freezes: 0, cancelLeft: 5, premium: false,
  lastDevotionalDate: null, devotionalProgress: 0, onboardingDone: false, onboardingAnswers: {},
  profile: { name: "", bio: "", avatar: "🧑", notifyTime: "" },
  pet: { name: "Manna", type: "Cordeiro", accessory: "Coroa de louvor" },
  planDays: 7, planProgress: 0, notes: [], favoriteVerses: [], prayers: [], testimonies: []
};

let state = loadState();
let onboardingIndex = 0;
let lessonIndex = 0;
let selectedLessonOption = null;

init();

function init() {
  applyTheme();
  bindEvents();
  renderAppVisibility();
  renderOnboardingQuestion();
  initBibleSelectors();
  render();
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  $("themeToggleBtn").addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; applyTheme(); saveState(); });
  $("prevQuestionBtn").addEventListener("click", () => { onboardingIndex = Math.max(0, onboardingIndex - 1); renderOnboardingQuestion(); });
  $("nextQuestionBtn").addEventListener("click", onNextOnboarding);

  $("buyPremiumBtn").addEventListener("click", buyPremium);
  $("generateDailyBtn").addEventListener("click", generateDaily);
  $("playDailyAudioBtn").addEventListener("click", () => speak($("dailyDevotional").innerText || "Vamos meditar na Palavra de Deus."));
  $("planSelect").addEventListener("change", () => { state.planDays = Number($("planSelect").value); saveState(); render(); });

  $("completeTodayBtn").addEventListener("click", completeTodayDevotional);
  $("cancelMissedBtn").addEventListener("click", cancelYesterdayMiss);
  $("buyFreezeBtn").addEventListener("click", buyFreeze);

  $("bibleBook").addEventListener("change", onBookChange);
  $("bibleChapter").addEventListener("change", onChapterChange);
  $("bibleVerse").addEventListener("change", renderBibleVerse);
  $("searchBibleBtn").addEventListener("click", searchBible);
  $("favoriteVerseBtn").addEventListener("click", favoriteCurrentVerse);
  $("shareVerseBtn").addEventListener("click", shareVerseImage);

  $("saveNoteBtn").addEventListener("click", saveNote);
  $("sendChatBtn").addEventListener("click", onAskAI);
  $("addPrayerBtn").addEventListener("click", addPrayer);
  $("ambientRainBtn").addEventListener("click", () => speak("Respire fundo. Imagine o som da chuva enquanto você ora."));
  $("ambientPianoBtn").addEventListener("click", () => speak("Piano suave para seu momento com Deus."));
  $("guidedPrayerBtn").addEventListener("click", () => speak("Senhor, entregamos este dia em Tuas mãos. Guia nosso coração e fortalece nossa fé. Amém."));

  $("saveNotifyBtn").addEventListener("click", () => { state.profile.notifyTime = $("notifyTime").value; saveState(); alert("Horário salvo!"); });
  $("saveProfileBtn").addEventListener("click", saveProfile);
  $("savePetBtn").addEventListener("click", savePet);

  $("closeLessonBtn").addEventListener("click", () => $("lessonModal").classList.add("hidden"));
  $("showQuestionBtn").addEventListener("click", () => { $("lessonVerseStage").classList.add("hidden"); $("lessonQuestionWrap").classList.remove("hidden"); $("submitLessonBtn").classList.remove("hidden"); });
  $("submitLessonBtn").addEventListener("click", submitLessonAnswer);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    const p = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...p, profile: { ...defaultState.profile, ...(p.profile || {}) }, pet: { ...defaultState.pet, ...(p.pet || {}) } };
  } catch { return structuredClone(defaultState); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function applyTheme() { document.body.classList.toggle("dark", state.theme === "dark"); }

function renderAppVisibility() {
  $("onboarding").classList.toggle("hidden", state.onboardingDone);
  $("appRoot").classList.toggle("hidden", !state.onboardingDone);
}

function renderOnboardingQuestion() {
  const q = ONBOARDING_QUESTIONS[onboardingIndex];
  const ans = state.onboardingAnswers[q.id] ?? (q.multi ? [] : "");
  $("onboardingStepLabel").textContent = `Pergunta ${onboardingIndex + 1} de ${ONBOARDING_QUESTIONS.length}`;
  $("stepperFill").style.width = `${((onboardingIndex + 1) / ONBOARDING_QUESTIONS.length) * 100}%`;
  $("questionContainer").innerHTML = `<div class="question-card"><h3>${q.text} ${q.multi ? "<small>(pode marcar mais de um)</small>" : ""}</h3>${q.options.map((o)=>`<div class="q-option ${(q.multi?ans.includes(o):ans===o)?"selected":""}" data-opt="${o}">${(q.multi?ans.includes(o):ans===o)?"✅":"⭕"} ${o}</div>`).join("")}</div>`;
  document.querySelectorAll(".q-option").forEach((el) => el.addEventListener("click", () => {
    const v = el.dataset.opt;
    if (q.multi) {
      const set = new Set(state.onboardingAnswers[q.id] || []);
      set.has(v) ? set.delete(v) : set.add(v);
      state.onboardingAnswers[q.id] = Array.from(set);
    } else state.onboardingAnswers[q.id] = v;
    renderOnboardingQuestion();
  }));
}

function onNextOnboarding() {
  const q = ONBOARDING_QUESTIONS[onboardingIndex];
  const a = state.onboardingAnswers[q.id];
  const ok = q.multi ? Array.isArray(a) && a.length > 0 : !!a;
  if (!ok) return $("onboardingStatus").textContent = "Selecione ao menos uma opção.";
  $("onboardingStatus").textContent = "";
  if (onboardingIndex < ONBOARDING_QUESTIONS.length - 1) onboardingIndex += 1;
  else { state.onboardingDone = true; saveState(); renderAppVisibility(); render(); return; }
  renderOnboardingQuestion();
}

function buyPremium() {
  if (state.premium) return;
  if (state.coins < 500) return alert("Moedas insuficientes para Premium.");
  state.coins -= 500;
  state.premium = true;
  saveState(); render();
}

function generateDaily() {
  const theme = $("dailyTheme").value;
  const d = DAILY[theme];
  $("dailyDevotional").innerHTML = `<strong>${d[0]}</strong><br/>${d[1]}<hr/>Aplicação: ${d[2]}<br/><br/><em>Pergunta: ${d[3]}</em>`;
}

function dateStr(date) { return date.toISOString().split("T")[0]; }
function toDate(s) { return new Date(`${s}T00:00:00`); }
function today() { return dateStr(new Date()); }

function applyMissedDaysProtection() {
  if (!state.lastDevotionalDate) return;
  let cur = toDate(state.lastDevotionalDate); cur.setDate(cur.getDate() + 1);
  const td = toDate(today());
  while (cur < td) {
    if (state.freezes > 0) state.freezes -= 1;
    else if (state.cancelLeft > 0) state.cancelLeft -= 1;
    else { state.streak = 0; state.cancelLeft = 5; break; }
    state.lastDevotionalDate = dateStr(cur);
    cur.setDate(cur.getDate() + 1);
  }
}

function monthlyReset() {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const last = state._monthKey || key;
  if (last !== key) {
    if (state.cancelLeft > 0) state.cancelLeft = 5;
    state._monthKey = key;
  }
}

function completeTodayDevotional() {
  monthlyReset();
  applyMissedDaysProtection();
  if (state.lastDevotionalDate === today()) return $("streakStatus").textContent = "Você já concluiu hoje.";
  state.lastDevotionalDate = today();
  state.streak += 1;
  state.xp += 35;
  state.coins += 20;
  state.planProgress = Math.min(state.planDays, state.planProgress + 1);
  if (state.devotionalProgress < DEVOTIONALS.length) state.devotionalProgress += 1;
  saveState(); render();
  $("streakStatus").textContent = "Devocional concluído!";
}

function cancelYesterdayMiss() {
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yStr = dateStr(y);
  if (!state.lastDevotionalDate || state.lastDevotionalDate >= yStr) return $("streakStatus").textContent = "Sem dia perdido ontem.";
  if (state.cancelLeft <= 0) return $("streakStatus").textContent = "Sem cancelamentos.";
  state.cancelLeft -= 1;
  state.lastDevotionalDate = yStr;
  saveState(); render();
}

function buyFreeze() {
  if (state.coins < 100) return $("streakStatus").textContent = "Moedas insuficientes.";
  state.coins -= 100;
  state.freezes += 1;
  saveState(); render();
}

function getRankByXp(xp) { let cur = RANKS[0]; for (const r of RANKS) if (xp >= r.minXp) cur = r; return cur; }
function getNextRank(xp) { return RANKS.find((r) => r.minXp > xp) ?? null; }

function render() {
  const rank = getRankByXp(state.xp);
  const next = getNextRank(state.xp);

  $("homeStreak").textContent = state.streak;
  $("homeXp").textContent = state.xp;
  $("homeCoins").textContent = state.coins;
  $("homeHearts").textContent = state.hearts;
  $("homeFreezes").textContent = state.freezes;
  $("homeRank").textContent = rank.name.replace("Divisão ","");
  $("cancelLeft").textContent = state.cancelLeft;
  $("premiumStatus").textContent = state.premium ? "✅ Premium ativo" : "Plano gratuito ativo";

  $("planSelect").value = String(state.planDays);
  $("planStatus").textContent = `Plano: ${state.planProgress}/${state.planDays} dias`;

  $("rankName").textContent = rank.name;
  $("rankXp").textContent = state.xp;
  if (!next) { $("rankProgress").style.width = "100%"; $("rankHint").textContent = "Rank máximo alcançado"; }
  else {
    const pct = ((state.xp - rank.minXp) / (next.minXp - rank.minXp)) * 100;
    $("rankProgress").style.width = `${Math.max(0, Math.min(100, pct))}%`;
    $("rankHint").textContent = `Faltam ${next.minXp - state.xp} XP para ${next.name}.`;
  }

  const medals = [];
  if (state.streak >= 7) medals.push("🏅 7 dias");
  if (state.streak >= 30) medals.push("👑 30 dias");
  if (state.planProgress >= state.planDays && state.planDays > 0) medals.push("🔥 Plano concluído");
  $("medalsWrap").innerHTML = (medals.length ? medals : ["✨ Continue firme!"]).map((m)=>`<span>${m}</span>`).join("");

  const petLevel = Math.floor(state.xp / 120) + 1;
  $("petDisplay").textContent = `${state.pet.name}, ${state.pet.type} • ${state.pet.accessory || "sem acessório"} • Nível ${petLevel}`;
  $("petProgress").style.width = `${Math.min(100, ((state.xp % 120) / 120) * 100)}%`;

  $("profileName").value = state.profile.name;
  $("profileBio").value = state.profile.bio;
  $("profileAvatarSelect").value = state.profile.avatar;
  $("profileAvatar").textContent = state.profile.avatar;
  $("profileGreeting").textContent = state.profile.name || "Seu Perfil";
  $("notifyTime").value = state.profile.notifyTime || "";

  $("petName").value = state.pet.name;
  $("petType").value = state.pet.type;
  $("petAccessory").value = state.pet.accessory;

  $("statDevocionais").textContent = state.devotionalProgress;
  $("statStreak").textContent = state.streak;
  $("statXp").textContent = state.xp;
  $("statRank").textContent = rank.name.replace("Divisão ","");

  renderTrail();
  renderLeaderboard();
  renderNotes();
  renderFavorites();
  renderPrayers();
}

function renderTrail() {
  $("devotionalTrail").innerHTML = "";
  DEVOTIONALS.forEach((d,i)=>{
    const done = i < state.devotionalProgress;
    const current = i === state.devotionalProgress;
    const el = document.createElement("div");
    el.className = `trail-item ${i%2===0?"left":"right"} ${done?"done":""} ${current?"current":""}`;
    el.innerHTML = `<div class="devotional-illustration" data-emoji="${d.emoji}" style="background-image:linear-gradient(135deg, ${d.colors})"></div><div class="step">Etapa ${i+1}</div><h4>${d.title}</h4>${done?"<button disabled>Concluído ✅</button>":current?`<button data-open-lesson="${i}">Abrir devocional</button>`:"<button disabled>Bloqueado</button>"}`;
    $("devotionalTrail").appendChild(el);
  });
  document.querySelectorAll("button[data-open-lesson]").forEach((b)=>b.addEventListener("click", ()=>openLessonModal(Number(b.dataset.openLesson))));
  $("trailStatus").textContent = state.devotionalProgress >= DEVOTIONALS.length ? "Trilha concluída!" : `Próxima etapa: ${state.devotionalProgress+1}/${DEVOTIONALS.length}`;
}

function openLessonModal(i) {
  lessonIndex = i;
  selectedLessonOption = null;
  const l = DEVOTIONALS[i];
  $("lessonStepLabel").textContent = `Etapa ${i+1}`;
  $("lessonTitle").textContent = l.title;
  $("lessonVerse").textContent = "Leia o versículo:";
  $("lessonVerseText").textContent = l.verse;
  $("lessonQuestion").textContent = l.question;
  $("lessonFeedback").textContent = "";
  $("lessonOptions").innerHTML = l.options.map((o,idx)=>`<div class="lesson-option" data-option="${idx}">${o}</div>`).join("");
  document.querySelectorAll(".lesson-option").forEach((el)=>el.addEventListener("click",()=>{
    selectedLessonOption = Number(el.dataset.option);
    document.querySelectorAll(".lesson-option").forEach((x)=>x.classList.remove("selected"));
    el.classList.add("selected");
  }));
  $("lessonVerseStage").classList.remove("hidden");
  $("lessonQuestionWrap").classList.add("hidden");
  $("submitLessonBtn").classList.add("hidden");
  $("lessonModal").classList.remove("hidden");
}

function submitLessonAnswer() {
  if (selectedLessonOption === null) return $("lessonFeedback").textContent = "Escolha uma resposta.";
  const l = DEVOTIONALS[lessonIndex];
  document.querySelectorAll(".lesson-option").forEach((o,i)=>{
    o.classList.remove("wrong","correct");
    if(i===l.correct) o.classList.add("correct");
    if(i===selectedLessonOption && i!==l.correct) o.classList.add("wrong");
  });
  if (selectedLessonOption === l.correct) {
    $("lessonFeedback").textContent = `✅ ${l.explain}`;
    completeTodayDevotional();
    setTimeout(()=>$("lessonModal").classList.add("hidden"), 900);
  } else {
    if (!state.premium) state.hearts = Math.max(0, state.hearts - 1);
    $("lessonFeedback").textContent = `❌ ${l.explain}`;
    saveState(); render();
  }
}

function initBibleSelectors() {
  $("bibleBook").innerHTML = Object.keys(BIBLE_DATA).map((b)=>`<option>${b}</option>`).join("");
  onBookChange();
}
function onBookChange() {
  const ch = Object.keys(BIBLE_DATA[$("bibleBook").value]);
  $("bibleChapter").innerHTML = ch.map((x)=>`<option>${x}</option>`).join("");
  onChapterChange();
}
function onChapterChange() {
  const arr = BIBLE_DATA[$("bibleBook").value][$("bibleChapter").value];
  $("bibleVerse").innerHTML = arr.map((_,i)=>`<option>${i+1}</option>`).join("");
  renderBibleVerse();
}
function renderBibleVerse() {
  const b = $("bibleBook").value, c = Number($("bibleChapter").value), v = Number($("bibleVerse").value);
  if (!b || !c || !v) return;
  $("bibleText").textContent = `${b} ${c}:${v} — ${BIBLE_DATA[b][c][v-1]}`;
}
function searchBible() {
  const q = $("bibleSearch").value.trim().toLowerCase();
  if (!q) return;
  for (const [book,chs] of Object.entries(BIBLE_DATA)) {
    for (const [ch,vs] of Object.entries(chs)) {
      const idx = vs.findIndex((x)=>x.toLowerCase().includes(q));
      if (idx>=0) { $("bibleBook").value=book; onBookChange(); $("bibleChapter").value=ch; onChapterChange(); $("bibleVerse").value=String(idx+1); renderBibleVerse(); return; }
    }
  }
  $("bibleText").textContent = "Nenhum resultado encontrado.";
}

function currentVerseRef() {
  return `${$("bibleBook").value} ${$("bibleChapter").value}:${$("bibleVerse").value} — ${BIBLE_DATA[$("bibleBook").value][$("bibleChapter").value][Number($("bibleVerse").value)-1]}`;
}
function favoriteCurrentVerse() {
  const ref = currentVerseRef();
  if (!state.favoriteVerses.includes(ref)) state.favoriteVerses.unshift(ref);
  state.favoriteVerses = state.favoriteVerses.slice(0,30);
  saveState(); renderFavorites();
}
function renderFavorites() {
  $("favoriteVerses").innerHTML = (state.favoriteVerses||[]).map(v=>`<div class="note-item paper-blue">⭐ ${v}</div>`).join("") || `<p class="hint">Sem versículos favoritos.</p>`;
}
function shareVerseImage() {
  const text = currentVerseRef();
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1080;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#2f54eb"; ctx.fillRect(0,0,1080,1080);
  ctx.fillStyle = "#fff"; ctx.font = "bold 52px Poppins"; ctx.fillText("Adoray Devocional", 80, 120);
  ctx.font = "36px Poppins";
  wrapText(ctx, text, 80, 240, 920, 52);
  const a = document.createElement("a"); a.download = "versiculo.png"; a.href = c.toDataURL("image/png"); a.click();
}
function wrapText(ctx, text, x, y, maxW, lh){const words=text.split(' ');let line='';for(let n=0;n<words.length;n++){const test=line+words[n]+' ';if(ctx.measureText(test).width>maxW&&n>0){ctx.fillText(line,x,y);line=words[n]+' ';y+=lh;}else line=test;}ctx.fillText(line,x,y);} 

function saveNote() {
  const text = $("noteText").value.trim(); if (!text) return;
  state.notes.unshift({date:today(), text, theme:$("noteTheme").value, sticker:$("noteSticker").value});
  state.notes = state.notes.slice(0,20);
  $("noteText").value = "";
  saveState(); renderNotes();
}
function renderNotes() {
  $("savedNotes").innerHTML = (state.notes||[]).map(n=>`<div class="note-item ${n.theme}"><div>${n.sticker} <strong>${n.date}</strong></div><p>${n.text}</p></div>`).join("") || `<p class="hint">Sem páginas salvas.</p>`;
}

function addPrayer() {
  const text = $("prayerInput").value.trim(); if (!text) return;
  state.prayers.unshift({id: Date.now(), text, answered:false});
  $("prayerInput").value = "";
  saveState(); renderPrayers();
}
function renderPrayers() {
  $("prayerList").innerHTML = (state.prayers||[]).map(p=>`<div class="note-item ${p.answered?"paper-blue":"paper-cream"}">${p.text}<div class="actions-grid"><button class="ghost-btn" data-ans="${p.id}">${p.answered?"Respondida ✅":"Marcar respondida"}</button></div></div>`).join("") || `<p class="hint">Sem pedidos de oração.</p>`;
  document.querySelectorAll("button[data-ans]").forEach((b)=>b.addEventListener("click",()=>markPrayerAnswered(Number(b.dataset.ans))));
  $("testimonyList").innerHTML = (state.testimonies||[]).map(t=>`<div class="note-item paper-rose">🙌 ${t}</div>`).join("") || `<p class="hint">Sem testemunhos ainda.</p>`;
}
function markPrayerAnswered(id) {
  const p = state.prayers.find(x=>x.id===id); if(!p) return;
  p.answered = true;
  state.testimonies.unshift(`Deus respondeu: ${p.text}`);
  state.testimonies = state.testimonies.slice(0,20);
  saveState(); renderPrayers();
}

function onAskAI() {
  const q = $("chatInput").value.trim().toLowerCase();
  if (!q) return $("chatOutput").textContent = "Digite algo sobre seu dia com Deus.";
  if (q.includes("ansioso")) return $("chatOutput").textContent = "Devocional personalizado: Filipenses 4:6-7. Reflexão: troque ansiedade por oração. Aplicação: escreva 3 pedidos e entregue a Deus.";
  if (q.includes("propósito")) return $("chatOutput").textContent = "Devocional personalizado: Jeremias 29:11. Reflexão: Deus tem planos de paz. Aplicação: use um dom hoje para servir alguém.";
  $("chatOutput").textContent = "Devocional personalizado: Provérbios 3:5-6. Reflexão: confie no Senhor em todo tempo.";
}

function speak(text){
  if (!("speechSynthesis" in window)) return alert("Áudio não suportado neste navegador.");
  const u = new SpeechSynthesisUtterance(text); u.lang = "pt-BR"; speechSynthesis.cancel(); speechSynthesis.speak(u);
}

function saveProfile(){ state.profile.name=$("profileName").value.trim(); state.profile.bio=$("profileBio").value.trim(); state.profile.avatar=$("profileAvatarSelect").value; saveState(); render(); }
function savePet(){ state.pet.name=$("petName").value.trim()||"Manna"; state.pet.type=$("petType").value; state.pet.accessory=$("petAccessory").value.trim(); saveState(); render(); }

function renderLeaderboard() {
  const arr=[{name:state.profile.name||"Você",xp:state.xp,me:true},{name:"Jason",xp:597},{name:"Cindy",xp:252},{name:"Ashley",xp:224},{name:"Tiffany",xp:153},{name:"Sergio",xp:156}].sort((a,b)=>b.xp-a.xp);
  $("leaderboardList").innerHTML=arr.map((u,i)=>`<div class="leader-row ${u.me?"me":""}"><span>#${i+1} ${u.name}</span><strong>${u.xp} XP</strong></div>`).join("");
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.id===`tab-${tabName}`));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tabName));
}
