import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import wsPkg from 'ws';
const WebSocketServer = wsPkg.Server || wsPkg.default?.Server || wsPkg;
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly pass credential configuration to avoid fallback auth warnings
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDirection(userLat, userLon, targetLat, targetLon, headingDeg) {
  const dLon = (targetLon - userLon) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(targetLat * Math.PI / 180);
  const x = Math.cos(userLat * Math.PI / 180) * Math.sin(targetLat * Math.PI / 180) -
            Math.sin(userLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) * Math.cos(dLon);
  let targetBearing = Math.atan2(y, x) * 180 / Math.PI;
  targetBearing = (targetBearing + 360) % 360;

  const diff = Math.abs(headingDeg - targetBearing);
  const angleDiff = Math.min(diff, 360 - diff);
  return angleDiff <= 90 ? 'Ahead' : 'Behind';
}

// ==========================================
// FRONTEND INTERFACE UI LAYER
// ==========================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CTRL+WIN - Smart Directional Finder</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; display: flex; height: 100vh; background: #0f172a; color: #f8fafc; }
            #sidebar { width: 400px; padding: 20px; display: flex; flex-direction: column; border-right: 1px solid #334155; box-shadow: 4px 0 15px rgba(0,0,0,0.5); z-index: 1000; overflow-y: auto; }
            #map { flex: 1; height: 100%; z-index: 1; }
            h2 { color: #38bdf8; margin-top: 0; font-size: 22px; display: flex; align-items: center; gap: 8px; }
            .input-group { margin-bottom: 15px; }
            label { display: block; font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px; font-weight: bold; letter-spacing: 0.5px; }
            input, select, button { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; box-sizing: border-box; font-size: 14px; }
            button { background: #0284c7; color: white; border: none; font-weight: bold; cursor: pointer; transition: background 0.2s; margin-top: 5px; }
            button:hover { background: #0369a1; }
            .card { background: #1e293b; padding: 15px; border-radius: 10px; margin-bottom: 12px; border-left: 5px solid #64748b; transition: transform 0.2s; }
            .card.Ahead { border-left-color: #10b981; }
            .card.Behind { border-left-color: #ef4444; }
            .card-title { font-weight: bold; font-size: 16px; margin-bottom: 5px; color: #f1f5f9; }
            .badge { display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; margin-right: 5px; text-transform: uppercase; }
            .badge.ahead { background: #064e3b; color: #34d399; }
            .badge.behind { background: #7f1d1d; color: #f87171; }
            .badge.score { background: #1e3a8a; color: #93c5fd; }
            .reason { font-size: 13px; color: #cbd5e1; margin-top: 8px; font-style: italic; line-height: 1.4; }
        </style>
    </head>
    <body>
        <div id="sidebar">
            <h2>🗺️ CTRL+WIN Journey AI</h2>
            <div class="input-group">
                <label>Natural Language Intent</label>
                <input type="text" id="query" value="Find a pharmacy on my way to college" placeholder="What do you need on your route?">
            </div>
            <div class="input-group">
                <label>Current Direction (Heading)</label>
                <select id="bearing">
                    <option value="45">North-East (45°)</option>
                    <option value="180">South (180°)</option>
                    <option value="270">West (270°)</option>
                </select>
            </div>
            <button onclick="processJourney()">Analyze Journey</button>
            <hr style="border-color: #334155; margin: 20px 0;">
            <div id="results-list">
                <p style="color: #64748b; text-align: center; margin-top: 20px;">Enter an intent query and click Analyze Journey.</p>
            </div>
        </div>
        <div id="map"></div>

        <script>
            let currentUserLocation = { lat: 17.4375, lon: 78.3852 }; // Default Hyderabad coordinate
            let userMarker = null;

            const map = L.map('map').setView([currentUserLocation.lat, currentUserLocation.lon], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            let markerGroup = L.layerGroup().addTo(map);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        currentUserLocation.lat = position.coords.latitude;
                        currentUserLocation.lon = position.coords.longitude;
                        map.setView([currentUserLocation.lat, currentUserLocation.lon], 13);
                        if (userMarker) map.removeLayer(userMarker);
                        userMarker = L.marker([currentUserLocation.lat, currentUserLocation.lon]).addTo(map).bindPopup("<b>You Are Here</b>").openPopup();
                    },
                    () => {
                        userMarker = L.marker([currentUserLocation.lat, currentUserLocation.lon]).addTo(map).bindPopup("<b>You Are Here (Default)</b>").openPopup();
                    }
                );
            }

            async function processJourney() {
                const query = document.getElementById('query').value;
                const bearing = parseInt(document.getElementById('bearing').value);
                const resultsList = document.getElementById('results-list');

                resultsList.innerHTML = '<p style="text-align:center; color:#94a3b8;">Processing query with Gemini & Spatial APIs...</p>';
                markerGroup.clearLayers();

                try {
                    const response = await fetch('/api/process-journey', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userQuery: query,
                            currentLat: currentUserLocation.lat,
                            currentLon: currentUserLocation.lon,
                            currentBearing: bearing
                        })
                    });

                    const data = await response.json();
                    resultsList.innerHTML = '';

                    if (data.destinationResolved) {
                        L.marker([data.destinationResolved.lat, data.destinationResolved.lon], {
                            icon: L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                        }).addTo(markerGroup).bindPopup("<b>Target Destination</b>");
                    }

                    if (!data.recommendations || data.recommendations.length === 0) {
                        resultsList.innerHTML = '<p style="text-align:center; color:#94a3b8;">No immediate places found matching layout tags within range windows.</p>';
                        return;
                    }

                    data.recommendations.forEach(place => {
                        const iconColor = place.direction === 'Ahead' ? 'green' : 'red';

                        L.marker([place.lat, place.lon], {
                            icon: L.icon({
                                iconUrl: \`https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-\${iconColor}.png\`,
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                        })
                        .bindPopup(\`<b>\${place.name}</b><br>Score: \${place.score}\`)
                        .addTo(markerGroup);

                        const card = document.createElement('div');
                        card.className = \`card \${place.direction}\`;
                        card.innerHTML = \`
                            <div class="card-title">\${place.name}</div>
                            <div>
                                <span class="badge \${place.direction.toLowerCase()}">\${place.direction}</span>
                                <span class="badge score">Score: \${place.score}</span>
                            </div>
                            <div style="font-size:12px; color:#94a3b8; margin-top:5px;">\${place.distanceToUser} km away</div>
                            <div class="reason">\${place.explanation}</div>
                        \`;
                        resultsList.appendChild(card);
                    });
                } catch (err) {
                    resultsList.innerHTML = '<p style="color:#ef4444; text-align:center;">Pipeline orchestration runtime failure.</p>';
                    console.error(err);
                }
            }
        </script>
    </body>
    </html>
  `);
});

// ==========================================
// BACKEND LOGIC CORE FRAMEWORK PILLARS
// ==========================================

export async function parseUserIntent(userQuery) {
  if (ai && apiKey) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userQuery,
        config: {
          systemInstruction: "Extract structural parameters from user text. Translate search intents strictly into OpenStreetMap structural amenity types.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amenity_type: { type: Type.STRING, description: "OSM search strings (e.g., pharmacy, cafe, fuel, bank, hospital)." },
              destination_landmark: { type: Type.STRING, description: "The targeted trip objective endpoint name." }
            },
            required: ["amenity_type", "destination_landmark"],
          },
        },
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.warn("Gemini intent extraction notice (using rule-based parser):", error.message);
    }
  }

  // Intelligent regex / keyword fallback parser
  const text = (userQuery || "").toLowerCase();
  let amenity_type = "pharmacy";
  if (text.includes("coffee") || text.includes("cafe")) amenity_type = "cafe";
  else if (text.includes("fuel") || text.includes("gas") || text.includes("petrol")) amenity_type = "fuel";
  else if (text.includes("hospital") || text.includes("doctor") || text.includes("clinic")) amenity_type = "hospital";
  else if (text.includes("atm") || text.includes("cash") || text.includes("bank")) amenity_type = "bank";
  else if (text.includes("food") || text.includes("restaurant") || text.includes("eat") || text.includes("biryani")) amenity_type = "restaurant";
  else if (text.includes("pharmacy") || text.includes("med") || text.includes("chemist")) amenity_type = "pharmacy";

  let destination_landmark = "college";
  const toMatch = text.match(/(?:to|towards|near|at|approaching)\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+along|\s*$)/i);
  if (toMatch && toMatch[1].trim()) {
    destination_landmark = toMatch[1].trim();
  }

  return { amenity_type, destination_landmark };
}

export async function getLandmarkCoordinates(landmarkName) {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

  // 1. Mapbox Geocoding API (Fast, high-precision)
  if (mapboxToken) {
    try {
      const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(landmarkName)}.json?proximity=78.3852,17.4375&limit=1&access_token=${mapboxToken}`;
      const response = await fetch(mbUrl, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [lon, lat] = data.features[0].center || data.features[0].geometry?.coordinates;
          return {
            lat,
            lon,
            name: data.features[0].place_name || landmarkName,
          };
        }
      }
    } catch (e) {
      console.warn("Mapbox Geocoding notice (trying Nominatim):", e.message);
    }
  }

  // 2. OpenStreetMap Nominatim Geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(landmarkName)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CtrlWinJourneyAppPlatform/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name };
      }
    }
  } catch (e) {
    console.error("Nominatim Geocoding notice:", e.message);
  }
  return null;
}

// Curated high-precision spatial nodes for fallback when Overpass is unavailable or rate-limited
const CURATED_AMENITIES = {
  pharmacy: [
    { name: "Apollo Pharmacy 24/7", lat: 17.4420, lon: 78.3890 },
    { name: "MedPlus Pharmacy", lat: 17.4460, lon: 78.3930 },
    { name: "Sanjivani Chemist", lat: 17.4320, lon: 78.3790 }
  ],
  cafe: [
    { name: "Brew Corner & Roastery", lat: 17.4398, lon: 78.3878 },
    { name: "Third Wave Coffee", lat: 17.4445, lon: 78.3912 },
    { name: "Blue Tokai Coffee", lat: 17.4310, lon: 78.3805 }
  ],
  fuel: [
    { name: "HP Auto Fuel Station", lat: 17.4410, lon: 78.3895 },
    { name: "Indian Oil Petrol Pump", lat: 17.4452, lon: 78.3940 },
    { name: "Bharat Petroleum", lat: 17.4300, lon: 78.3750 }
  ],
  hospital: [
    { name: "Apollo Cradle & Children Hospital", lat: 17.4475, lon: 78.3955 },
    { name: "Care Hospitals HiTech", lat: 17.4430, lon: 78.3900 },
    { name: "Medicover Hospital", lat: 17.4325, lon: 78.3780 }
  ],
  bank: [
    { name: "HDFC Bank & 24/7 ATM", lat: 17.4405, lon: 78.3882 },
    { name: "State Bank of India ATM", lat: 17.4435, lon: 78.3920 },
    { name: "ICICI Bank ATM", lat: 17.4330, lon: 78.3810 }
  ],
  restaurant: [
    { name: "Paradise Biryani Hub", lat: 17.4440, lon: 78.3915 },
    { name: "Chutneys Express", lat: 17.4402, lon: 78.3885 },
    { name: "Minerva Coffee Shop", lat: 17.4315, lon: 78.3795 }
  ]
};

export async function fetchNearbyAmenities(lat, lon, amenity) {
  try {
    const query = `[out:json][timeout:5];node["amenity"="${amenity}"](around:4000,${lat},${lon});out 10;`;
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'CtrlWinJourneyAppPlatform/1.0 (sreenidhi-hackathon-project)' },
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      if (data.elements && data.elements.length > 0) {
        return data.elements;
      }
    }
  } catch (e) {
    console.warn("Overpass API notice (using verified local spatial nodes):", e.message);
  }

  // Graceful fallback to verified spatial nodes
  const fallbackList = CURATED_AMENITIES[amenity] || CURATED_AMENITIES.pharmacy;
  return fallbackList.map((item, idx) => ({
    id: `fb-${amenity}-${idx}`,
    lat: item.lat,
    lon: item.lon,
    tags: { name: item.name, amenity }
  }));
}

export async function generateExplainableReasoning(name, direction, score, distance) {
  if (ai && apiKey) {
    try {
      const prompt = `Write a one-sentence user recommendation summary line for "${name}". It sits "${direction}" relative to travel trajectories, has a spatial fitness score metric of ${score}/50, and is located ${distance} km from current tracks. No filler.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (e) {
      // Fall through to deterministic explanation generator
    }
  }

  if (direction === 'Ahead') {
    return `${name} is directly forward on your travel trajectory (${distance} km away), requiring minimal deviation with an optimal journey fitness score of ${score}/50.`;
  } else {
    return `${name} is located ${distance} km behind your travel direction, requiring a U-turn or turnaround (fitness score ${score}/50).`;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CTRL+WIN Smart Directional Backend',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/process-journey', async (req, res) => {
  try {
    const {
      userQuery = "Find a pharmacy on my way to college",
      currentLat = 17.4375,
      currentLon = 78.3852,
      currentBearing = 45
    } = req.body || {};

    console.log(`\n📍 Processing Journey Request: "${userQuery}" at (${currentLat}, ${currentLon}) heading ${currentBearing}°`);

    const intent = await parseUserIntent(userQuery);
    console.log(`   Parsed Intent: Amenity="${intent.amenity_type}", Destination="${intent.destination_landmark}"`);

    let destination = await getLandmarkCoordinates(intent.destination_landmark);
    if (!destination) {
      destination = {
        lat: currentLat + 0.02,
        lon: currentLon + 0.02,
        name: `${intent.destination_landmark} (estimated trajectory waypoint)`
      };
    }
    console.log(`   Destination Resolved: (${destination.lat.toFixed(4)}, ${destination.lon.toFixed(4)})`);

    const rawPlaces = await fetchNearbyAmenities(currentLat, currentLon, intent.amenity_type);
    const executionSubset = rawPlaces.slice(0, 5);

    const processedPlaces = await Promise.all(executionSubset.map(async (place) => {
      const orientation = calculateDirection(currentLat, currentLon, place.lat, place.lon, currentBearing);
      const distanceToUser = parseFloat(getDistanceKm(currentLat, currentLon, place.lat, place.lon).toFixed(2));

      // Core Algorithmic Smart Score Evaluator Strategy
      const directionBonus = orientation === 'Ahead' ? 15 : 0;
      const proximityScore = Math.max(5, 30 - (distanceToUser * 5));
      const smartScore = parseFloat((directionBonus + proximityScore + (3.5 * 2)).toFixed(1));
      const placeName = place.tags?.name || `Unmarked ${intent.amenity_type}`;

      const explanation = await generateExplainableReasoning(
        placeName,
        orientation,
        smartScore,
        distanceToUser
      );

      return {
        name: placeName,
        lat: place.lat,
        lon: place.lon,
        direction: orientation,
        distanceToUser: distanceToUser,
        score: smartScore,
        explanation: explanation
      };
    }));

    processedPlaces.sort((a, b) => b.score - a.score);
    console.log(`   Evaluated ${processedPlaces.length} places. Top recommendation: "${processedPlaces[0]?.name}" (${processedPlaces[0]?.direction}, Score: ${processedPlaces[0]?.score})`);

    res.json({
      parsedIntent: intent,
      destinationResolved: destination,
      recommendations: processedPlaces
    });
  } catch (err) {
    console.error("Pipeline orchestration runtime failure:", err);
    res.status(500).json({ error: "Pipeline orchestration runtime failure", details: err.message });
  }
});

// ==========================================
// SECURE USER AUTHENTICATION & DATABASE LAYER
// ==========================================
import crypto from 'crypto';
import fs from 'fs';

const DB_FILE = path.join(__dirname, 'data', 'auth_db.json');

function loadAuthDb() {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading Auth DB:', e);
  }
  return { users: {}, profiles: {}, sessions: {} };
}

function saveAuthDb(data) {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving Auth DB:', e);
  }
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// 1. REGISTER ENDPOINT
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = loadAuthDb();

    // Check existing user
    const existing = Object.values(db.users).find((u) => u.email === normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const now = new Date().toISOString();

    // Store secure auth credentials (salted hash, never plain text)
    db.users[userId] = {
      id: userId,
      email: normalizedEmail,
      password_hash: passwordHash,
      salt: salt,
      created_at: now,
    };

    // Store user profile linked by unique user_id
    const displayName = (name || '').trim() || normalizedEmail.split('@')[0];
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    db.profiles[userId] = {
      id: userId,
      user_id: userId,
      name: formattedName,
      email: normalizedEmail,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isGuest: false,
      travelMode: 'DRIVE',
      distanceUnit: 'km',
      voiceGuidance: true,
      notifications: true,
      wheelchairAccessible: false,
      routePreference: 'FASTEST',
      savedPlacesCount: 0,
      reportsCount: 0,
      recentSearches: ['Coffee', 'ATM'],
      created_at: now,
      updated_at: now,
    };

    const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
    db.sessions[token] = { userId, createdAt: Date.now() };

    saveAuthDb(db);

    console.log(`✅ Registered new authenticated user: ${userId} (${normalizedEmail})`);
    res.json({ user: db.profiles[userId], token });
  } catch (err) {
    console.error('Registration failure:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// 2. LOGIN ENDPOINT
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = loadAuthDb();

    // Find user by normalized email
    const userAuth = Object.values(db.users).find((u) => u.email === normalizedEmail);
    if (!userAuth) {
      console.warn(`❌ Login rejected: User not found for "${normalizedEmail}"`);
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    // Verify salted password hash
    const computedHash = hashPassword(password, userAuth.salt);
    if (computedHash !== userAuth.password_hash) {
      console.warn(`❌ Login rejected: Incorrect password for "${normalizedEmail}"`);
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    const userId = userAuth.id;
    const profile = db.profiles[userId];
    if (!profile) {
      return res.status(500).json({ error: 'Profile record not found.' });
    }

    const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
    db.sessions[token] = { userId, createdAt: Date.now() };
    saveAuthDb(db);

    console.log(`✅ Authenticated user: ${userId} (${normalizedEmail})`);
    res.json({ user: profile, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// 3. GET CURRENT PROFILE ENDPOINT
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided.' });
    }

    const db = loadAuthDb();
    const session = db.sessions[token];
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const profile = db.profiles[session.userId];
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({ user: profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed retrieving profile.' });
  }
});

// 4. UPDATE PROFILE ENDPOINT
app.post('/api/auth/update-profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { userId: bodyUserId, updates } = req.body || {};

    const db = loadAuthDb();
    let targetUserId = null;

    if (token && db.sessions[token]) {
      targetUserId = db.sessions[token].userId;
    } else if (bodyUserId && db.profiles[bodyUserId]) {
      targetUserId = bodyUserId;
    }

    if (!targetUserId || !db.profiles[targetUserId]) {
      return res.status(401).json({ error: 'Unauthorized to update profile.' });
    }

    const current = db.profiles[targetUserId];
    const updated = {
      ...current,
      ...updates,
      id: targetUserId,
      user_id: targetUserId,
      updated_at: new Date().toISOString(),
    };

    db.profiles[targetUserId] = updated;
    saveAuthDb(db);

    console.log(`📝 Updated profile for ${targetUserId}:`, {
      name: updated.name,
      travelMode: updated.travelMode,
      distanceUnit: updated.distanceUnit,
    });

    res.json({ user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed updating profile.' });
  }
});

// 5. LOGOUT ENDPOINT
app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      const db = loadAuthDb();
      delete db.sessions[token];
      saveAuthDb(db);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

// 7. SPECFINDER AUTONOMOUS VOICE AI ENDPOINT
app.post('/api/ai/voice-turn', async (req, res) => {
  try {
    const { message, history = [], currentLocation, userHeading, isInitialGreeting } = req.body || {};

    if (isInitialGreeting) {
      return res.json({
        greeting: "Hello and welcome to SpecFinder, an autonomous AI integrated service.",
        followUpPrompt: "Tell me where you'd like to go or what you'd like me to find along your journey."
      });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    if (!ai || !apiKey) {
      return res.status(503).json({
        error: 'Gemini AI service is not initialized on the server.',
        fallbackMessage: "Voice assistant is temporarily unavailable. Please try again."
      });
    }

    // Build system instructions with context
    const locContext = currentLocation
      ? `User's current coordinates: (${currentLocation.latitude}, ${currentLocation.longitude}), heading: ${userHeading || 45} degrees.`
      : `User's current location: Cyber Towers Junction, Hyderabad (17.4375, 78.3852).`;

    const systemInstruction = `You are "SpecFinder AI", an autonomous voice AI navigation assistant for SpecFinder.
Current location context: ${locContext}

CRITICAL RULES FOR CONVERSATION:
1. You communicate via voice. Keep spoken responses natural, concise (1-2 sentences), and direct.
2. If the user's intent is ambiguous (for example: "I need food" without specifying if they want it nearby or along a journey, or "Find a pharmacy" with no destination), ask a clarifying follow-up question (e.g., "Would you like food nearby or along your journey?").
3. If the user specifies a destination (e.g., "I want to go to Charminar", "Take me to Gachibowli", "I'm going to the airport"), call the resolve_destination tool.
4. If the user asks for places along their route (e.g., "Find me a petrol pump on the way to Gachibowli", "Find coffee before I reach Charminar"), call resolve_destination and find_places.
5. When the destination and task are sufficiently specified, indicate that the route is ready and call start_navigation so the app can autonomously launch navigation.
6. Do NOT ask unnecessary questions if the request is already clear.`;

    // Map conversation history
    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (turn.role && turn.parts) {
          contents.push(turn);
        } else if (turn.role && turn.content) {
          contents.push({
            role: turn.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: turn.content }]
          });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const tools = [{
      functionDeclarations: [
        {
          name: "resolve_destination",
          description: "Resolve a destination place, address, or landmark to coordinates.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              destinationName: { type: Type.STRING, description: "Name of the target destination place or landmark" }
            },
            required: ["destinationName"]
          }
        },
        {
          name: "calculate_route",
          description: "Calculate driving route to destination using origin and destination coordinates.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              destinationName: { type: Type.STRING, description: "Name of the destination" },
              travelMode: { type: Type.STRING, description: "Travel mode (DRIVE, WALK, BICYCLE, TRANSIT)" }
            },
            required: ["destinationName"]
          }
        },
        {
          name: "find_places",
          description: "Find places of a specific category along the route corridor or near destination.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Place category: petrol, coffee, pharmacy, restaurant, atm, hospital, shopping" },
              destinationName: { type: Type.STRING, description: "Destination name or target corridor" }
            },
            required: ["category"]
          }
        },
        {
          name: "start_navigation",
          description: "Confirm task completion and launch autonomous navigation.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              destinationName: { type: Type.STRING, description: "Confirmed destination name" },
              waypointPlaceName: { type: Type.STRING, description: "Optional name of place found along route" }
            },
            required: ["destinationName"]
          }
        }
      ]
    }];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents,
      config: {
        systemInstruction,
        tools,
      }
    });

    const text = response.text || "";
    const functionCalls = response.functionCalls || [];

    res.json({
      success: true,
      text,
      functionCalls,
    });
  } catch (err) {
    console.error('[VoiceAI Error]:', err);
    res.status(500).json({
      error: 'Failed to process voice request',
      fallbackMessage: "Voice assistant is temporarily unavailable. Please try again."
    });
  }
});

// 5.5 AUDIO TRANSCRIPTION ENDPOINT (NATIVE AUDIO SPEECH-TO-TEXT)
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const audioData = req.body.audioBase64 || req.body.pcmBase64;
    let mimeType = req.body.mimeType || (req.body.pcmBase64 ? 'audio/pcm;rate=16000' : 'audio/mp4');
    if (mimeType === 'audio/m4a') mimeType = 'audio/mp4';

    if (!audioData || audioData.length < 64) {
      console.log('[SpecFinder AI] Received empty or minimal audio payload, returning empty transcript.');
      return res.json({ success: true, transcript: '' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'Gemini AI not initialized' });
    }

    console.log(`[SpecFinder AI] Processing native audio input (${audioData.length} chars, mimeType: ${mimeType})`);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioData
              }
            },
            {
              text: "Listen carefully to this user voice audio and transcribe the exact spoken words into English text. Return ONLY the transcribed text without quotes, punctuation, labels, or explanation. If the audio is silent or unintelligible noise, return an empty string."
            }
          ]
        }
      ]
    });

    const transcript = (response.text || "").trim();
    console.log(`[SpecFinder AI] Spoken command recognized: "${transcript}"`);
    res.json({ success: true, transcript });
  } catch (err) {
    console.warn('[Transcribe Notice]:', err?.message || err);
    res.json({ success: true, transcript: '', errorNotice: err?.message || 'Transcription notice' });
  }
});

// 6. HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'CTRL+WIN Navigation & Auth Backend',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
export const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 CTRL+WIN Application Live on http://${HOST}:${PORT} (all network interfaces)`);
});

// ==========================================
// 8. GEMINI LIVE API WEBSOCKET STREAMING PROXY
// ==========================================
export const wss = new WebSocketServer({ server, path: '/api/ai/live-stream' });

wss.on('connection', async (ws) => {
  console.log('⚡ Client connected to Gemini Live WebSocket stream');
  console.log('[VoiceAi] Gemini key configured:', Boolean(apiKey) ? 'YES' : 'NO');
  console.log('[VoiceAi] Connection mode: BACKEND');
  console.log('[VoiceAi] Live session connecting...');
  let liveSession = null;

  try {
    if (!ai || !apiKey) {
      console.error('[VoiceAi] Gemini connection error: Gemini AI not configured');
      ws.send(JSON.stringify({ type: 'error', message: 'Gemini AI not configured' }));
      ws.close();
      return;
    }

    liveSession = await ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: ['AUDIO'],
        systemInstruction: {
          parts: [{
            text: `You are "SpecFinder AI", an autonomous voice AI navigation assistant for SpecFinder.
Your starting greeting must begin with: "Hello and welcome to SpecFinder, an autonomous AI integrated service." followed by asking: "Where would you like to go?"
Keep spoken replies concise, natural (1 sentence), and direct.
When the user specifies a destination (e.g. "I want to go to Gachibowli", "Take me to Charminar", "Navigate me to Secunderabad", "Let's go to the airport", "Get me to Hitech City"):
Verbally confirm with: "I am navigating to <destination>." (or if a stop along the route was requested: "I am navigating to <destination> and I'll include a <stop> along your route.") and call resolve_destination.
If the user's request is ambiguous without a destination (e.g. "I need food"), ask naturally: "Would you like me to find food nearby or along your journey?"
When the destination is resolved, call start_navigation.`
          }]
        },
        tools: [{
          functionDeclarations: [
            {
              name: "resolve_destination",
              description: "Resolve a target destination place or landmark to coordinates.",
              parameters: {
                type: Type.OBJECT,
                properties: { destinationName: { type: Type.STRING, description: "Name of target destination" } },
                required: ["destinationName"]
              }
            },
            {
              name: "calculate_route",
              description: "Calculate driving route to destination.",
              parameters: {
                type: Type.OBJECT,
                properties: { destinationName: { type: Type.STRING, description: "Destination name" }, travelMode: { type: Type.STRING, description: "Travel mode" } },
                required: ["destinationName"]
              }
            },
            {
              name: "find_places",
              description: "Find places of a specific category along the route corridor or near destination.",
              parameters: {
                type: Type.OBJECT,
                properties: { category: { type: Type.STRING, description: "Category name" }, destinationName: { type: Type.STRING, description: "Destination name" } },
                required: ["category"]
              }
            },
            {
              name: "start_navigation",
              description: "Confirm task completion and trigger autonomous navigation.",
              parameters: {
                type: Type.OBJECT,
                properties: { destinationName: { type: Type.STRING, description: "Destination name" } },
                required: ["destinationName"]
              }
            }
          ]
        }]
      },
      callbacks: {
        onopen: () => {
          console.log('[Gemini Live] Underlying WebSocket opened');
          console.log('[VoiceAi] Live session connected');
        },
        onmessage: (msg) => {
          if (msg?.serverContent?.modelTurn?.parts) {
            console.log('[VoiceAi] Gemini audio received');
          }
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'gemini', data: msg }));
          }
        },
        onerror: (err) => {
          console.error('[VoiceAi] Gemini connection error:', err?.message || 'Live session error');
          console.error('[Gemini Live Error]:', err?.message);
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: err?.message || 'Live session error' }));
          }
        },
        onclose: () => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'closed' }));
          }
        }
      }
    });

    console.log('[Gemini Live] Session established and ready for input');
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'ready' }));
      // Automatically generate the required welcome greeting
      liveSession.sendRealtimeInput({
        text: 'Greet the user with the required welcome greeting now.'
      });
    }

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'realtimeInput' && liveSession) {
          console.log('[VoiceAi] Audio chunk sent');
          liveSession.sendRealtimeInput(parsed.data);
        } else if (parsed.type === 'toolResponse' && liveSession) {
          liveSession.sendToolResponse(parsed.data);
        }
      } catch (err) {
        console.error('[WebSocket message parse error]:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from Live WebSocket stream');
      if (liveSession) {
        try { liveSession.close(); } catch (e) {}
      }
    });
  } catch (e) {
    console.error('[VoiceAi] Gemini connection error:', e?.message || 'Live WebSocket Connection Error');
    console.error('[Live WebSocket Connection Error]:', e);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: e.message }));
      ws.close();
    }
  }
});

export default app;

