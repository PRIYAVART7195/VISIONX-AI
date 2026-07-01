/* ============================================================
   VISIONIX AI - v4.0 FULL FEATURED
   Groq Vision + Camera + WhatsApp + Graph + Calendar + Dashboard + Soil
   ============================================================ */

/* ============================================================
   VISIONIX AI - v4.0 FULL FEATURED
   Groq Vision + Camera + WhatsApp + Graph + Calendar + Dashboard + Soil
   ============================================================ */

const BACKEND = "https://visionix-backend.onrender.com";
let currentLang = "english", currentDisease = "";
let currentTemp = 0, currentHumidity = 0, hasRainForecast = false;
let detectionHistory = JSON.parse(localStorage.getItem("visionix_history") || "[]");
let cameraStream = null;
let priceChart = null;
let lastAnalysisText = "";

/* ============================================================
   TAB SWITCHING
   ============================================================ */
function switchTab(name, el) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
  if (name === "history") renderHistory();
  if (name === "dashboard") updateDashboard();
}

/* ============================================================
   TRANSLATIONS
   ============================================================ */
const T = {
  english: { headerSub: "AI-Based Smart Resource Allocation for Farmers", weatherTitle: "Weather Prediction", weatherSub: "Get 5-day forecast", detectTitle: "Crop Disease Detection", detectSub: "Camera or upload — Groq Vision AI analyzes", uploadText: "Click to upload crop photo", analyzeBtn: "Analyze Crop", chatTitle: "AI Farmer Assistant", chatSub: "Ask me anything!", chatPH: "Ask about your crop...", mandiTitle: "Mandi Price", historyTitle: "Detection History", welcomeMsg: "Namaste! Use Camera or upload a photo. Groq Vision AI will detect diseases instantly!", footerText: "Empowering Indian Farmers with AI" },
  hindi: { headerSub: "किसानों के लिए AI स्मार्ट प्रणाली", weatherTitle: "मौसम पूर्वानुमान", weatherSub: "5-दिन का मौसम", detectTitle: "फसल रोग पहचान", detectSub: "कैमरा या फोटो — Groq Vision AI जांचेगा", uploadText: "फोटो अपलोड करें", analyzeBtn: "फसल जांचें", chatTitle: "AI किसान सहायक", chatSub: "कुछ भी पूछें!", chatPH: "फसल के बारे में पूछें...", mandiTitle: "मंडी भाव", historyTitle: "जांच इतिहास", welcomeMsg: "नमस्ते! कैमरा या फोटो अपलोड करें। Groq Vision AI तुरंत रोग पहचानेगा!", footerText: "AI से भारतीय किसानों को सशक्त बनाना" },
  bhojpuri: { headerSub: "किसान भाइयन खातिर AI सिस्टम", weatherTitle: "मौसम अनुमान", weatherSub: "5 दिन के मौसम", detectTitle: "फसल रोग पहचान", detectSub: "कैमरा या फोटो डालीं", uploadText: "फोटो डालीं", analyzeBtn: "फसल जांचीं", chatTitle: "AI किसान सहायक", chatSub: "कुछ भी पूछीं!", chatPH: "फसल के बारे में पूछीं...", mandiTitle: "मंडी भाव", historyTitle: "जांच इतिहास", welcomeMsg: "प्रणाम! कैमरा या फोटो डालीं। Groq Vision तुरंत रोग पहचानी!", footerText: "AI से किसानन के मदद" },
  marathi: { headerSub: "शेतकऱ्यांसाठी AI प्रणाली", weatherTitle: "हवामान अंदाज", weatherSub: "5 दिवसांचा अंदाज", detectTitle: "पीक रोग ओळख", detectSub: "कॅमेरा किंवा फोटो — Groq Vision तपासेल", uploadText: "फोटो अपलोड करा", analyzeBtn: "पीक तपासा", chatTitle: "AI शेतकरी सहाय्यक", chatSub: "काहीही विचारा!", chatPH: "पिकाबद्दल विचारा...", mandiTitle: "बाजार भाव", historyTitle: "तपासणी इतिहास", welcomeMsg: "नमस्कार! कॅमेरा किंवा फोटो वापरा. Groq Vision रोग ओळखेल!", footerText: "AI द्वारे शेतकऱ्यांना सक्षम करणे" },
  telugu: { headerSub: "రైతులకు AI వ్యవస్థ", weatherTitle: "వాతావరణ అంచనా", weatherSub: "5 రోజుల అంచనా", detectTitle: "పంట వ్యాధి గుర్తింపు", detectSub: "కెమెరా లేదా ఫోటో — Groq Vision విశ్లేషిస్తుంది", uploadText: "ఫోటో అప్లోడ్ చేయండి", analyzeBtn: "పంట విశ్లేషించండి", chatTitle: "AI రైతు సహాయకుడు", chatSub: "ఏదైనా అడగండి!", chatPH: "పంట గురించి అడగండి...", mandiTitle: "మండి ధర", historyTitle: "గుర్తింపు చరిత్ర", welcomeMsg: "నమస్కారం! కెమెరా లేదా ఫోటో వాడండి. Groq Vision వ్యాధిని గుర్తిస్తుంది!", footerText: "AI తో రైతులను సశక్తం చేయడం" },
  tamil: { headerSub: "விவசாயிகளுக்கான AI அமைப்பு", weatherTitle: "வானிலை கணிப்பு", weatherSub: "5 நாள் கணிப்பு", detectTitle: "பயிர் நோய் கண்டறிதல்", detectSub: "கேமரா அல்லது புகைப்படம் — Groq Vision பகுப்பாய்வு", uploadText: "புகைப்படம் பதிவேற்றவும்", analyzeBtn: "பயிரை ஆய்வு செய்யவும்", chatTitle: "AI விவசாய உதவியாளர்", chatSub: "எதையும் கேளுங்கள்!", chatPH: "பயிரைப் பற்றி கேளுங்கள்...", mandiTitle: "சந்தை விலை", historyTitle: "கண்டறிதல் வரலாறு", welcomeMsg: "வணக்கம்! கேமரா அல்லது புகைப்படம் பயன்படுத்தவும். Groq Vision நோயை கண்டறியும்!", footerText: "AI மூலம் விவசாயிகளை வலுப்படுத்துதல்" }
};

function setLang(lang, btn) {
  currentLang = lang;
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const t = T[lang];
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setPH = (id, val) => { const el = document.getElementById(id); if (el) el.placeholder = val; };
  set("headerSub", t.headerSub); set("weatherTitle", t.weatherTitle);
  set("detectTitle", t.detectTitle); set("detectSub", t.detectSub);
  set("analyzeBtn", t.analyzeBtn); set("chatTitle", t.chatTitle);
  set("chatSub", t.chatSub); set("mandiTitle", t.mandiTitle);
  set("historyTitle", t.historyTitle); set("welcomeMsg", t.welcomeMsg);
  set("footerText", t.footerText);
  setPH("chatInput", t.chatPH);
}

/* ============================================================
   STATUS PILLS
   ============================================================ */
function setPill(id, text, cls) {
  const el = document.getElementById(id);
  if (el) { el.textContent = text; el.className = `pill ${cls}`; }
}

async function checkBackend() {
  try {
    const res = await fetch(`${BACKEND}/`);
    const data = await res.json();
    if (data.status) setPill("backendStatus", "✅ Backend", "ready");
  } catch { setPill("backendStatus", "❌ Offline", "error"); }
}

function loadModel() { setPill("modelStatus", "✅ Groq Vision", "ready"); }

/* ============================================================
   CAMERA CAPTURE
   ============================================================ */
async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    cameraStream = stream;
    const video = document.getElementById("cameraStream");
    video.srcObject = stream;
    video.style.display = "block";
    document.getElementById("captureBtn").style.display = "block";
  } catch (err) {
    alert("Camera not available. Please use Upload instead.");
  }
}

function capturePhoto() {
  const video = document.getElementById("cameraStream");
  const canvas = document.getElementById("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);

  canvas.toBlob(blob => {
    const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById("imageUpload").files = dt.files;

    const preview = document.getElementById("preview");
    preview.src = URL.createObjectURL(blob);
    preview.style.display = "block";
  }, "image/jpeg");

  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  video.style.display = "none";
  document.getElementById("captureBtn").style.display = "none";
}

/* ============================================================
   IMAGE PREVIEW
   ============================================================ */
document.getElementById("imageUpload").addEventListener("change", function () {
  const file = this.files[0]; if (!file) return;
  const preview = document.getElementById("preview");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
});

/* ============================================================
   GROQ VISION — DISEASE DETECTION
   ============================================================ */
async function detectDisease() {
  const file = document.getElementById("imageUpload").files[0];
  if (!file) { alert("Upload or capture a crop image first"); return; }
  const el = document.getElementById("diseaseResult");
  el.innerHTML = "⏳ <strong>Groq Vision AI analyzing...</strong><br><small>Please wait 5-10 seconds</small>";
  document.getElementById("recommendation").innerHTML = "";
  document.getElementById("whatsappBtn").style.display = "none";

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${BACKEND}/detect-disease?language=${currentLang}&temperature=${currentTemp}&humidity=${currentHumidity}&has_rain=${hasRainForecast}`,
      { method: "POST", body: formData }
    );
    const data = await res.json();

    if (!data.success) { el.innerHTML = `❌ Detection failed: ${data.error}`; return; }

    currentDisease = data.disease;
    lastAnalysisText = data.full_analysis;
    const isHealthy = data.disease.toLowerCase().includes("healthy");

    el.innerHTML = isHealthy
      ? `🌿 <strong>Healthy Plant!</strong> ✅<br><small>Analyzed by Groq Vision AI</small>`
      : `🦠 <strong>Disease: ${data.disease}</strong><br><small>Analyzed by Groq Vision AI</small>`;

    document.getElementById("recommendation").innerHTML =
      `<strong>🤖 Groq Vision Full Analysis:</strong><br><br>${data.full_analysis.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}`;

    document.getElementById("whatsappBtn").style.display = "block";

    if (isHealthy) {
      addChatMessage(`✅ Your crop looks <strong>healthy</strong>! Want tips to maintain it?`, false);
    } else {
      addChatMessage(`🦠 Detected <strong>${data.disease}</strong>! Full analysis shown. Ask me for more advice!`, false);
    }

    saveHistory(data.disease, isHealthy ? 1.0 : 0.92);
    updateDashboard();

  } catch (err) {
    el.innerHTML = `❌ Error: ${err.message}`;
  }
}

/* ============================================================
   WHATSAPP SHARE
   ============================================================ */
function shareWhatsApp() {
  const isHealthy = currentDisease.toLowerCase().includes("healthy");
  const msg = isHealthy
    ? `🌾 *Visionix AI Report*\n\n✅ My crop is *Healthy*!\n\nAnalyzed by Groq Vision AI\n🔗 visionix.ai`
    : `🌾 *Visionix AI Report*\n\n🦠 Disease Detected: *${currentDisease}*\n\n${lastAnalysisText.substring(0, 300)}...\n\nAnalyzed by Groq Vision AI`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

/* ============================================================
   WEATHER
   ============================================================ */
async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) { alert("Enter city name"); return; }
  const el = document.getElementById("weatherResult");
  el.innerHTML = "⏳ Loading...";
  try {
    const res = await fetch(`${BACKEND}/weather/${encodeURIComponent(city)}`);
    const data = await res.json();
    if (data.error) { el.innerHTML = "❌ City not found"; return; }
    currentTemp = data.current_temp;
    currentHumidity = data.current_humidity;
    hasRainForecast = data.has_rain_forecast;
    let html = `<strong>🌦️ ${data.city} — 5-Day Forecast</strong><br><br>`;
    for (const [date, slots] of Object.entries(data.forecast)) {
      const day = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
      html += `<strong>${day} (${date})</strong><br>`;
      slots.forEach(s => { html += `• ${s.time} → 🌡 ${s.temp}°C | ${s.weather} | 💧 ${s.humidity}%${s.rain ? " 🌧" : ""}<br>`; });
      html += "<br>";
    }
    if (hasRainForecast) html += "⚠️ Rain expected → Reduce irrigation";
    el.innerHTML = html;
    updateDashboard();
  } catch { el.innerHTML = "❌ Error. Backend running?"; }
}

/* ============================================================
   MANDI PRICE + GRAPH
   ============================================================ */
async function getMandiPrice() {
  const crop = document.getElementById("cropName").value.trim();
  const state = document.getElementById("stateName").value.trim() || "Bihar";
  if (!crop) { alert("Enter crop name"); return; }
  const el = document.getElementById("mandiResult");
  el.innerHTML = "⏳ Fetching prices...";

  try {
    const res = await fetch(`${BACKEND}/mandi/${encodeURIComponent(crop)}?state=${encodeURIComponent(state)}`);
    const data = await res.json();
    if (data.error) { el.innerHTML = "❌ " + data.error; return; }

    if (data.prices && data.prices.length > 0) {
      let html = `<strong>💰 ${crop} — ${state}</strong><br><br>`;
      const labels = [], modalPrices = [], minPrices = [], maxPrices = [];

      data.prices.forEach(p => {
        html += `📍 <strong>${p.market}</strong><br>• Min: ₹${p.min_price} | Max: ₹${p.max_price} | Modal: ₹${p.modal_price}<br>• Date: ${p.date}<br><br>`;
        labels.push(p.market);
        modalPrices.push(parseFloat(p.modal_price) || 0);
        minPrices.push(parseFloat(p.min_price) || 0);
        maxPrices.push(parseFloat(p.max_price) || 0);
      });

      el.innerHTML = html;
      showPriceGraph(labels, modalPrices, minPrices, maxPrices, crop);
    } else if (data.gemini_estimate) {
      el.innerHTML = `<strong>💰 AI Price Estimate — ${crop}:</strong><br>${data.gemini_estimate}`;
      document.getElementById("graphContainer").style.display = "none";
    }
  } catch { el.innerHTML = "❌ Error. Backend running?"; }
}

function showPriceGraph(labels, modal, min, max, crop) {
  document.getElementById("graphContainer").style.display = "block";
  const ctx = document.getElementById("priceChart").getContext("2d");
  if (priceChart) priceChart.destroy();
  priceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Modal Price (₹)", data: modal, backgroundColor: "rgba(34,197,94,0.7)", borderColor: "#22c55e", borderWidth: 2, borderRadius: 8 },
        { label: "Min Price (₹)", data: min, backgroundColor: "rgba(251,191,36,0.5)", borderColor: "#fbbf24", borderWidth: 2, borderRadius: 8 },
        { label: "Max Price (₹)", data: max, backgroundColor: "rgba(99,102,241,0.5)", borderColor: "#6366f1", borderWidth: 2, borderRadius: 8 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#e8f5e9", font: { family: "DM Sans" } } },
        title: { display: true, text: `${crop} — Market Price Comparison (₹/Quintal)`, color: "#86efac", font: { size: 14, family: "Syne" } }
      },
      scales: {
        x: { ticks: { color: "#6b9e78" }, grid: { color: "rgba(34,197,94,0.1)" } },
        y: { ticks: { color: "#6b9e78" }, grid: { color: "rgba(34,197,94,0.1)" } }
      }
    }
  });
}

function quickCrop(crop) {
  document.getElementById("cropName").value = crop;
  getMandiPrice();
}

/* ============================================================
   CROP CALENDAR
   ============================================================ */
async function getCropCalendar() {
  const state = document.getElementById("calendarState").value.trim() || "Bihar";
  const month = document.getElementById("calendarMonth").value;
  const months = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
  const el = document.getElementById("calendarResult");
  el.innerHTML = "⏳ Getting crop calendar...";

  try {
    const res = await fetch(`${BACKEND}/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `What crops should a farmer in ${state}, India plant in ${months[month]}? Give a detailed crop calendar with: 1) Best crops to sow 2) Crops to harvest 3) Soil preparation tips 4) Irrigation schedule 5) Common pests to watch for this month. Format clearly with headings.`,
        language: currentLang, disease: "", temperature: currentTemp, humidity: currentHumidity, has_rain: hasRainForecast
      })
    });
    const data = await res.json();
    el.innerHTML = `<strong>🌱 Crop Calendar — ${state} — ${months[month]}</strong><br><br>${data.reply.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}`;
  } catch { el.innerHTML = "❌ Error. Backend running?"; }
}

/* ============================================================
   FARM DASHBOARD
   ============================================================ */
function updateDashboard() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("dashTemp", currentTemp ? `${currentTemp}°C` : "-- °C");
  set("dashHumidity", currentHumidity ? `${currentHumidity}%` : "-- %");
  set("dashRain", hasRainForecast ? "🌧 Expected" : currentTemp ? "☀️ Clear" : "--");
  set("dashDisease", currentDisease || "None");
  set("dashScans", detectionHistory.length);
  set("dashHealthy", detectionHistory.filter(h => h.healthy).length);

  const activity = detectionHistory.slice(0, 5).map(h =>
    `• ${h.healthy ? "🌿" : "🦠"} ${h.disease} — ${h.time}`
  ).join("<br>");
  const actEl = document.getElementById("dashActivity");
  if (actEl) actEl.innerHTML = activity || "Run weather check and crop analysis to see activity!";
}

/* ============================================================
   SOIL HEALTH
   ============================================================ */
async function getSoilHealth() {
  const city = document.getElementById("soilCity").value.trim() || "Bihar";
  const crop = document.getElementById("soilCrop").value.trim() || "Wheat";
  const soilType = document.getElementById("soilType").value;
  const el = document.getElementById("soilResult");
  el.innerHTML = "⏳ Analyzing soil health...";

  try {
    const res = await fetch(`${BACKEND}/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Analyze soil health for a farmer in ${city}, India growing ${crop} on ${soilType} soil. Current conditions: Temp=${currentTemp}°C, Humidity=${currentHumidity}%, Rain=${hasRainForecast ? "Expected" : "Clear"}. Provide: 1) Soil Health Score (out of 10) 2) pH estimate 3) Nutrient status (N, P, K) 4) Best fertilizers to use 5) Irrigation recommendation 6) Any warnings. Format with clear headings.`,
        language: currentLang, disease: currentDisease, temperature: currentTemp, humidity: currentHumidity, has_rain: hasRainForecast
      })
    });
    const data = await res.json();
    el.innerHTML = `<strong>🎯 Soil Health Report — ${city}</strong><br><br>${data.reply.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}`;
  } catch { el.innerHTML = "❌ Error. Backend running?"; }
}

/* ============================================================
   CHATBOT
   ============================================================ */
function addChatMessage(text, isUser) {
  const box = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = `chat-msg ${isUser ? "user" : "bot"}`;
  div.innerHTML = `<span class="chat-avatar">${isUser ? "👨‍🌾" : "🌾"}</span><div class="chat-bubble">${text.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</div>`;
  box.appendChild(div); box.scrollTop = box.scrollHeight;
}

function addTyping() {
  const box = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "chat-msg bot"; div.id = "typing";
  div.innerHTML = `<span class="chat-avatar">🌾</span><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  box.appendChild(div); box.scrollTop = box.scrollHeight;
}

function removeTyping() { const el = document.getElementById("typing"); if (el) el.remove(); }

async function sendChat() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim(); if (!msg) return;
  addChatMessage(msg, true); input.value = ""; addTyping();
  try {
    const res = await fetch(`${BACKEND}/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, language: currentLang, disease: currentDisease, temperature: currentTemp, humidity: currentHumidity, has_rain: hasRainForecast })
    });
    const data = await res.json();
    removeTyping(); addChatMessage(data.reply || "Sorry, try again.", false);
  } catch { removeTyping(); addChatMessage("❌ Backend offline.", false); }
}

const QUICK = {
  treatment: "What is the treatment for the detected disease?",
  irrigation: "When and how much should I irrigate?",
  fertilizer: "What is the best fertilizer for my crop?",
  prevention: "How can I prevent crop diseases in future?"
};
function quickAsk(key) { document.getElementById("chatInput").value = QUICK[key]; sendChat(); }
document.getElementById("chatInput").addEventListener("keypress", e => { if (e.key === "Enter") sendChat(); });

/* ============================================================
   VOICE INPUT
   ============================================================ */
function startVoice() {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) { alert("Use Chrome!"); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const r = new SR();
  const langMap = { english: "en-IN", hindi: "hi-IN", bhojpuri: "hi-IN", marathi: "mr-IN", telugu: "te-IN", tamil: "ta-IN" };
  r.lang = langMap[currentLang] || "hi-IN";
  const btn = document.getElementById("voiceBtn");
  btn.classList.add("listening"); btn.textContent = "🔴"; r.start();
  r.onresult = e => { document.getElementById("chatInput").value = e.results[0][0].transcript; btn.classList.remove("listening"); btn.textContent = "🎤"; sendChat(); };
  r.onerror = r.onend = () => { btn.classList.remove("listening"); btn.textContent = "🎤"; };
}

/* ============================================================
   HISTORY
   ============================================================ */
function saveHistory(disease, prob) {
  detectionHistory.unshift({ disease, confidence: Math.round(prob * 100), healthy: disease.toLowerCase().includes("healthy"), time: new Date().toLocaleString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) });
  if (detectionHistory.length > 20) detectionHistory = detectionHistory.slice(0, 20);
  localStorage.setItem("visionix_history", JSON.stringify(detectionHistory));
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!detectionHistory.length) { list.innerHTML = `<p class="empty-history">No detections yet.</p>`; return; }
  list.innerHTML = detectionHistory.map(e => `<div class="history-item"><div><span class="disease-tag ${e.healthy ? 'healthy' : ''}">${e.healthy ? "🌿" : "🦠"} ${e.disease}</span><span style="color:var(--text-dim);font-size:12px;margin-left:8px">${e.confidence}% confidence</span></div><span class="time-tag">🕐 ${e.time}</span></div>`).join("");
}

function clearHistory() { detectionHistory = []; localStorage.removeItem("visionix_history"); renderHistory(); updateDashboard(); }

/* ============================================================
   INIT
   ============================================================ */
window.onload = () => { loadModel(); checkBackend(); updateDashboard(); };