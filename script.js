let model;
let currentTemp = 0;
let currentHumidity = 0;
let detectedDisease = "";
let hasRainForecast = false;
const GEMINI_API_KEY = "AIzaSyBqLq2drFolEnQCLi0fenx15WR0kDG8u84";   // ←←← CHANGE THIS

/* ================= GEMINI API CALL ================= */
/* ================= GEMINI API CALL (Fixed for 2026) ================= */
/* ================= GEMINI API CALL (Fixed for April 2026) ================= */
async function getGeminiTreatment(diseaseName, temp, humidity, hasRain) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    return "⚠️ Gemini API key not configured. Showing basic treatment only.";
  }

  // Updated stable model name (recommended in 2026)
  const model = "gemini-2.5-flash";   

  const prompt = `You are a helpful Indian agricultural expert speaking in simple language to farmers.
Detected disease: ${diseaseName}
Temperature: ${Math.round(temp)}°C
Humidity: ${humidity}%
Rain forecast in next days: ${hasRain ? "Yes" : "No"}

Provide short practical treatment advice:
- Immediate steps
- Natural remedies (neem etc.)
- Chemical options if needed
- Irrigation tips according to weather

Use bullet points. Keep it under 5 lines.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      console.error("Gemini API Error:", response.status);
      return "Basic treatment: Remove infected leaves • Apply neem oil • Improve air flow • Avoid overhead watering.";
    }

    const data = await response.json();
    let geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                     "Detailed advice not available right now.";

    return geminiText.trim();
  } catch (err) {
    console.error("Gemini error:", err);
    return "Using basic treatment (Gemini service temporarily unavailable).";
  }
}
/* ================= WEATHER - HOURLY BY TIME ================= */
async function getWeather() {
  let city = document.getElementById("city").value.trim();

  if (!city) {
    alert("Enter city name");
    return;
  }

  let apiKey = "fd05534bd6a8934f2f1402c6fdc2fa6e";
  let url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  try {
    let response = await fetch(url);
    let data = await response.json();

    if (data.cod !== "200") {
      document.getElementById("weatherResult").innerText = "City not found ❌";
      return;
    }

    let forecastHTML = "<strong>🌦️ 5-Day Weather Forecast (Every 3 Hours)</strong><br><br>";
    hasRainForecast = false;

    let groupedByDay = {};

    data.list.forEach(item => {
      let dt = new Date(item.dt * 1000);
      let dateKey = dt.toISOString().split('T')[0];
      let time = dt.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

      if (!groupedByDay[dateKey]) groupedByDay[dateKey] = [];

      let hasRain = item.weather[0].main.toLowerCase().includes("rain") || 
                    item.weather[0].main.toLowerCase().includes("thunder");

      if (hasRain) hasRainForecast = true;

      groupedByDay[dateKey].push({
        time: time,
        temp: Math.round(item.main.temp),
        weather: item.weather[0].main,
        humidity: item.main.humidity,
        hasRain: hasRain
      });
    });

    let dayCount = 0;
    for (let date in groupedByDay) {
      if (dayCount >= 5) break;
      let dayName = new Date(date).toLocaleDateString('en-US', {weekday: 'short'});
      forecastHTML += `<strong>${dayName} (${date})</strong><br>`;

      groupedByDay[date].forEach(slot => {
        let rainText = slot.hasRain ? " 🌧 Rain expected" : "";
        forecastHTML += `• ${slot.time} → 🌡 ${slot.temp}°C | ${slot.weather} | 💧 ${slot.humidity}%${rainText}<br>`;
      });

      forecastHTML += "<br>";
      dayCount++;
    }

    if (hasRainForecast) {
      forecastHTML += "⚠️ Rain predicted → Reduce irrigation on rainy days<br>";
    }

    document.getElementById("weatherResult").innerHTML = forecastHTML;

    currentTemp = data.list[0].main.temp;
    currentHumidity = data.list[0].main.humidity;

    generateRecommendation();

  } catch (error) {
    document.getElementById("weatherResult").innerText = "Error fetching weather ❌";
  }
}

/* ================= LOAD MODEL ================= */
async function loadModel() {
  const URL = "https://teachablemachine.withgoogle.com/models/67Vf2YTSL/";

  try {
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    document.getElementById("diseaseResult").innerText = "✅ Model Ready";
  } catch (err) {
    document.getElementById("diseaseResult").innerText = "❌ Model load failed";
  }
}

/* ================= IMAGE PREVIEW ================= */
document.getElementById("imageUpload").addEventListener("change", function () {
  let file = this.files[0];
  if (!file) return;

  let preview = document.getElementById("preview");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
});

/* ================= DETECTION ================= */
async function detectDisease() {
  let file = document.getElementById("imageUpload").files[0];

  if (!file) {
    alert("Upload image first");
    return;
  }

  if (!model) {
    document.getElementById("diseaseResult").innerText = "⏳ Model loading...";
    return;
  }

  document.getElementById("diseaseResult").innerText = "⏳ Analyzing...";

  let img = document.createElement("img");
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    const predictions = await model.predict(img);

    let best = predictions.reduce((a, b) =>
      a.probability > b.probability ? a : b
    );

    detectedDisease = best.className;

    if (best.probability < 0.6) {
      document.getElementById("diseaseResult").innerText = "⚠️ Try clearer image";
    } else if (best.className.toLowerCase().includes("healthy")) {
      document.getElementById("diseaseResult").innerText = "🌿 Healthy Plant";
    } else {
      document.getElementById("diseaseResult").innerText = "🦠 Disease: " + best.className;
    }

    generateRecommendation();
  };
}

/* ================= RECOMMENDATION (with Gemini) ================= */
async function generateRecommendation() {
  let suggestion = "";

  if (currentTemp > 35) {
    suggestion += "💧 Increase irrigation<br>";
  } else {
    suggestion += "💧 Normal irrigation<br>";
  }

  if (currentHumidity > 80) {
    suggestion += "⚠️ High disease risk<br>";
  }

  if (hasRainForecast) {
    suggestion += "🌧 Rain forecast detected → Reduce irrigation on rainy days<br>";
  }

  if (detectedDisease && !detectedDisease.toLowerCase().includes("healthy")) {
    suggestion += "💊 Apply treatment immediately<br>";

    // Original basic treatment
    let diseaseLower = detectedDisease.toLowerCase();
    let basicTreatment = "";

    if (diseaseLower.includes("leaf spot")) {
      basicTreatment = "→ Leaf Spot: Remove infected leaves, apply neem oil or copper-based fungicide.<br>";
    } else if (diseaseLower.includes("rust") || diseaseLower.includes("rust leaf")) {
      basicTreatment = "→ Rust Leaf: Remove affected leaves, improve air circulation.<br>";
    } else if (diseaseLower.includes("leaf blight") || diseaseLower.includes("blight")) {
      basicTreatment = "→ Leaf Blight: Apply fungicide early. Avoid overhead watering.<br>";
    } else if (diseaseLower.includes("powdery mildew") || diseaseLower.includes("mildew")) {
      basicTreatment = "→ Powdery Mildew: Use neem oil or baking soda spray. Improve airflow.<br>";
    }

    suggestion += basicTreatment;

    // Enhanced treatment using Gemini
    document.getElementById("recommendation").innerHTML = suggestion + "<br>⏳ Getting smart advice from Gemini...";
    
    const geminiAdvice = await getGeminiTreatment(detectedDisease, currentTemp, currentHumidity, hasRainForecast);
    suggestion += "<br><strong>Gemini Smart Advice:</strong><br>" + geminiAdvice.replace(/\n/g, "<br>");

  } else {
    suggestion += "🌿 Crop is healthy<br>";
  }

  document.getElementById("recommendation").innerHTML = suggestion;
}

/* ================= INIT ================= */
window.onload = loadModel;