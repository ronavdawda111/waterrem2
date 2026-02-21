/**
 * HydroMe Server v2.0
 * Enhanced for Render.io deployment
 * - Serves the PWA static files
 * - Manages Web Push subscriptions (iOS 16.4+ & Android)
 * - Sends scheduled reminder notifications via cron
 * - Supports 10, 20, 30, 60 minute intervals
 */

const express = require('express');
const webpush  = require('web-push');
const cron     = require('node-cron');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'data', 'subscriptions.json');

// ─── VAPID KEYS ────────────────────────────────────────────────────────────────
// For Render: Set these as Environment Variables in your Render dashboard
let VAPID_PUBLIC, VAPID_PRIVATE;

const KEYS_FILE = path.join(__dirname, 'data', 'vapid.json');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
  VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  console.log('✅ Using VAPID keys from environment variables (Render)');
} else {
  // Local development - generate and save keys
  if (fs.existsSync(KEYS_FILE)) {
    const saved = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    VAPID_PUBLIC  = saved.publicKey;
    VAPID_PRIVATE = saved.privateKey;
    console.log('✅ Loaded existing VAPID keys from file');
  } else {
    const keys = webpush.generateVAPIDKeys();
    VAPID_PUBLIC  = keys.publicKey;
    VAPID_PRIVATE = keys.privateKey;
    fs.mkdirSync(path.dirname(KEYS_FILE), { recursive: true });
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    console.log('🔑 Generated new VAPID keys');
  }
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  📋 COPY THESE TO RENDER ENVIRONMENT VARIABLES:');
  console.log('');
  console.log(`  VAPID_PUBLIC_KEY=${VAPID_PUBLIC}`);
  console.log('');
  console.log(`  VAPID_PRIVATE_KEY=${VAPID_PRIVATE}`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');
}

webpush.setVapidDetails(
  'mailto:hydrome@app.local',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function loadSubs() {
  if (!fs.existsSync(DB)) return {};
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch (e) { 
    console.error('Error loading subscriptions:', e);
    return {}; 
  }
}

function saveSubs(subs) {
  try {
    fs.mkdirSync(path.dirname(DB), { recursive: true });
    fs.writeFileSync(DB, JSON.stringify(subs, null, 2));
  } catch(e) {
    console.error('Error saving subscriptions:', e);
  }
}

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── ROUTES ────────────────────────────────────────────────────────────────────

// Return VAPID public key so the frontend can subscribe
app.get('/vapid-public-key', (req, res) => {
  res.json({ key: VAPID_PUBLIC });
});

// Subscribe / update subscription
app.post('/subscribe', (req, res) => {
  const { subscription, userId, interval, goal } = req.body;
  if (!subscription || !userId) {
    return res.status(400).json({ error: 'Missing subscription or userId' });
  }

  // Validate interval (must be 10, 20, 30, or 60)
  const validIntervals = [10, 20, 30, 60];
  const cleanInterval = validIntervals.includes(interval) ? interval : 30;

  const subs = loadSubs();
  subs[userId] = {
    subscription,
    interval: cleanInterval,
    goal: goal || 2500,
    active: true,
    createdAt: subs[userId]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveSubs(subs);
  console.log(`📲 Subscribed: ${userId} (every ${cleanInterval} min)`);
  res.json({ ok: true, interval: cleanInterval });
});

// Update just the interval/goal without re-subscribing
app.post('/update-prefs', (req, res) => {
  const { userId, interval, goal, active } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  
  const subs = loadSubs();
  if (!subs[userId]) return res.status(404).json({ error: 'User not found' });
  
  // Validate interval
  if (interval !== undefined) {
    const validIntervals = [10, 20, 30, 60];
    subs[userId].interval = validIntervals.includes(interval) ? interval : 30;
  }
  if (goal !== undefined) subs[userId].goal = goal;
  if (active !== undefined) subs[userId].active = active;
  subs[userId].updatedAt = new Date().toISOString();
  
  saveSubs(subs);
  console.log(`⚙️  Updated prefs: ${userId} (interval: ${subs[userId].interval} min)`);
  res.json({ ok: true });
});

// Unsubscribe
app.post('/unsubscribe', (req, res) => {
  const { userId } = req.body;
  const subs = loadSubs();
  if (subs[userId]) { 
    subs[userId].active = false; 
    subs[userId].updatedAt = new Date().toISOString();
    saveSubs(subs); 
    console.log(`🔕 Unsubscribed: ${userId}`);
  }
  res.json({ ok: true });
});

// Manual test push
app.post('/test-push/:userId', async (req, res) => {
  const subs = loadSubs();
  const entry = subs[req.params.userId];
  
  if (!entry) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  try {
    await sendNotification(entry, '💧 HydroMe Test', 'Great! Your notifications are working perfectly! 🎉');
    console.log(`🧪 Test notification sent to ${req.params.userId}`);
    res.json({ ok: true, message: 'Test notification sent!' });
  } catch (err) {
    console.error(`❌ Test push failed for ${req.params.userId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get subscription info (for debugging)
app.get('/subscription/:userId', (req, res) => {
  const subs = loadSubs();
  const entry = subs[req.params.userId];
  if (!entry) return res.status(404).json({ error: 'Not found' });
  
  // Don't send subscription keys, just metadata
  res.json({
    userId: req.params.userId,
    interval: entry.interval,
    goal: entry.goal,
    active: entry.active,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  });
});

// ─── PUSH LOGIC ────────────────────────────────────────────────────────────────
async function sendNotification(entry, title, body) {
  try {
    await webpush.sendNotification(
      entry.subscription,
      JSON.stringify({ 
        title, 
        body, 
        icon: '/icon-192.png', 
        badge: '/icon-96.png',
        timestamp: Date.now()
      })
    );
    return true;
  } catch(err) {
    throw err;
  }
}

// ─── CRON: fires every minute, sends to users whose interval is due ───────────
// Track last-sent time per user
const lastSent = {};

cron.schedule('* * * * *', async () => {
  const subs = loadSubs();
  const now = Date.now();
  let sentCount = 0;

  for (const [userId, entry] of Object.entries(subs)) {
    if (!entry.active) continue;

    const intervalMs = entry.interval * 60 * 1000;
    const last = lastSent[userId] || 0;
    
    // Check if enough time has passed
    if (now - last < intervalMs) continue;

    lastSent[userId] = now;

    const messages = [
      `💧 Time to hydrate! Your goal: ${entry.goal} ml`,
      `🚰 Don't forget to drink water! Goal: ${entry.goal} ml`,
      `💦 Hydration reminder! Stay on track with ${entry.goal} ml today`,
      `🌊 Time for water! Keep going toward ${entry.goal} ml`
    ];
    
    const title = '💧 HydroMe – Time to Drink!';
    const body = messages[Math.floor(Math.random() * messages.length)];

    try {
      await sendNotification(entry, title, body);
      sentCount++;
      console.log(`📨 Sent reminder → ${userId} (${entry.interval} min interval)`);
    } catch (err) {
      console.error(`❌ Push failed for ${userId}:`, err.statusCode || err.message);
      
      // If subscription expired/invalid (410 Gone or 404 Not Found), mark inactive
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`🗑️  Removing expired subscription: ${userId}`);
        subs[userId].active = false;
        saveSubs(subs);
        delete lastSent[userId];
      }
    }
  }

  if (sentCount > 0) {
    console.log(`✅ Cron cycle complete: ${sentCount} notification(s) sent`);
  }
});

// ─── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🚀');
  console.log(`   HydroMe Server v2.0 running on port ${PORT}`);
  console.log(`   📱 iOS 16.4+ & Android supported`);
  console.log(`   ⏰ Intervals: 10, 20, 30, 60 minutes`);
  console.log(`   🌐 Access at: http://localhost:${PORT}`);
  console.log('🚀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🚀');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
