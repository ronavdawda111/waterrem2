# 💧 HydroMe Water Tracker v2.0

**Production-ready water tracking PWA with push notifications**

✅ **Works on iOS 16.4+** (requires "Add to Home Screen")  
✅ **Works on Android** (all browsers)  
✅ **Custom intervals:** 10, 20, 30, 60 minutes  
✅ **Test Now button** for instant notification testing  
✅ **Ready for Render.io** deployment  

---

## 🚀 Quick Deploy to Render

### Step 1: Upload to Render

1. Go to [render.com](https://render.com)
2. Click **"New +" → "Web Service"**
3. Connect your GitHub repo OR upload these files
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. Click **"Create Web Service"**

### Step 2: Set Environment Variables

After first deployment, your server logs will show VAPID keys. Copy them!

In Render dashboard:
1. Go to **"Environment"** tab
2. Add these variables:

```
VAPID_PUBLIC_KEY=<your_public_key_from_logs>
VAPID_PRIVATE_KEY=<your_private_key_from_logs>
```

3. Click **"Save Changes"**
4. Render will auto-redeploy

**Done!** Your app is now live! 🎉

---

## 📱 How to Use

### For iOS Users (iPhone/iPad):

1. **Open in Safari** (not Chrome!)
2. Tap the **Share button** (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. Open the app from your home screen
6. Complete onboarding
7. **Allow notifications** when prompted
8. Choose your reminder interval (10, 20, 30, or 60 min)
9. Use **"Test Now"** button to verify notifications work

**Important:** Notifications only work when app is added to home screen on iOS!

### For Android Users:

1. Open in **any browser** (Chrome, Firefox, Samsung Internet, etc.)
2. Complete onboarding
3. **Allow notifications** when prompted
4. Choose your reminder interval
5. Use **"Test Now"** button to verify notifications work

**Note:** Android works directly in browser, no home screen required!

---

## ⚙️ Features

### Core Features:
- 💧 **Water intake tracking** with visual body fill indicator
- 🎯 **Daily goals** based on gender
- 📊 **Progress tracking** with stats
- 🔥 **Streak counter** for motivation
- 📝 **Intake log** with timestamps
- ⚙️ **Customizable settings**

### Notification Features:
- 🔔 **Push notifications** (works offline!)
- ⏰ **4 interval options:** 10, 20, 30, 60 minutes
- 🧪 **Test Now** button for instant testing
- 📱 **Home screen alerts** on iOS
- 🔁 **Repeating notifications** based on your interval
- 🎨 **Rich notifications** with actions (Log 250ml / Dismiss)

### Technical Features:
- 📴 **Offline support** via Service Worker
- 💾 **Local data persistence**
- 🔐 **Secure push subscription**
- 📊 **Server-side scheduling**
- 🎯 **Smart notification management**

---

## 🛠️ Local Development

### Prerequisites:
- Node.js 14+ installed
- npm or yarn

### Setup:

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# 3. Open browser
open http://localhost:3000
```

The server will generate VAPID keys automatically on first run.

### Development Mode:
```bash
npm run dev  # Auto-restarts on file changes
```

---

## 🧪 Testing Notifications

### Test Flow:

1. **Enable notifications** via toggle
2. Click **"Test Now"** button
3. Should see: "✅ Test notification sent!"
4. Check your notification tray
5. Notification should appear within seconds

### Troubleshooting:

**iOS:**
- ❌ **Not working?** → Make sure app is added to home screen
- ❌ **No permission prompt?** → Check Settings → Notifications → Safari
- ❌ **Still not working?** → iOS requires 16.4 or later

**Android:**
- ❌ **Not working?** → Check browser notification settings
- ❌ **Blocked?** → Go to Site Settings → Notifications → Allow

**Both:**
- ✅ Check browser console (F12) for errors
- ✅ Try the `/test-push/YOUR_USER_ID` endpoint manually
- ✅ Verify server is running and VAPID keys are set

---

## 📂 Project Structure

```
hydrome-fixed/
├── public/
│   ├── index.html          # Main app (PWA)
│   ├── manifest.json       # PWA manifest
│   ├── sw.js              # Service Worker
│   ├── icon-96.png        # App icons
│   ├── icon-192.png
│   └── icon-512.png
├── data/                   # Created automatically
│   ├── vapid.json         # VAPID keys (local dev)
│   └── subscriptions.json # User subscriptions
├── server.js              # Express server + push logic
├── package.json           # Dependencies
└── README.md             # This file
```

---

## 🔑 VAPID Keys

**What are they?**  
VAPID keys authenticate your server with push services (Apple/Google).

**Local Development:**  
Keys are generated automatically and saved to `data/vapid.json`

**Production (Render):**  
1. Deploy once → Check logs for keys
2. Add to Environment Variables
3. Redeploy

**Generate new keys:**  
```javascript
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log(keys);
```

---

## 🌐 API Endpoints

### Public:
- `GET /` - Serves the PWA
- `GET /health` - Health check for monitoring
- `GET /vapid-public-key` - Returns VAPID public key

### Subscription Management:
- `POST /subscribe` - Create/update push subscription
- `POST /update-prefs` - Update interval/goal
- `POST /unsubscribe` - Disable notifications
- `POST /test-push/:userId` - Send test notification
- `GET /subscription/:userId` - Get subscription info

---

## 🐛 Common Issues

### 1. Notifications not repeating
**Solution:** Check interval is set (10/20/30/60). Server sends based on cron (every minute).

### 2. iOS notifications not working
**Solutions:**
- Must use Safari
- Must add to home screen
- Must open from home screen (not Safari)
- iOS 16.4+ required
- Check Settings → Notifications → [App Name]

### 3. VAPID key errors
**Solution:** Make sure both keys are set in Render environment variables

### 4. Server not starting on Render
**Solutions:**
- Build Command: `npm install`
- Start Command: `npm start`
- Check logs for errors

### 5. Notifications stop after a while
**Solution:** Check Render server logs. Free tier may sleep after inactivity.

---

## 📊 Supported Intervals

| Interval | Minutes | Use Case |
|----------|---------|----------|
| 10 min   | 10      | Testing / Aggressive hydration |
| 20 min   | 20      | Active hydration |
| 30 min   | 30      | Standard (recommended) |
| 60 min   | 60      | Casual reminders |

---

## 🎯 Browser Support

### iOS:
- ✅ Safari 16.4+ (iOS 16.4+)
- ❌ Chrome (no push support)
- ❌ Firefox (no push support)

### Android:
- ✅ Chrome 42+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Samsung Internet 4+
- ✅ Opera 29+

### Desktop:
- ✅ Chrome 42+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 16+ (macOS Ventura+)

---

## 📝 Notes

- **Cron runs every minute:** Server checks due notifications
- **Interval precision:** Notifications sent when `now - lastSent >= interval`
- **Subscription storage:** Saved to `data/subscriptions.json`
- **Offline support:** PWA works offline after first load
- **Data persistence:** All data stored locally + server subscriptions

---

## 🔒 Privacy

- ✅ All health data stored locally on device
- ✅ Server only stores: userId, subscription, interval, goal
- ✅ No tracking or analytics
- ✅ No external API calls (except push services)
- ✅ Open source - audit the code yourself

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🆘 Support

**Issues?**
1. Check browser console (F12 → Console)
2. Check server logs in Render dashboard
3. Try "Test Now" button
4. Verify VAPID keys are set
5. Confirm iOS 16.4+ / Modern Android browser

**Still stuck?**  
Open an issue with:
- Device/OS version
- Browser name/version
- Error messages (console + server logs)
- Screenshots

---

## ✅ Deployment Checklist

- [ ] Uploaded to Render
- [ ] `npm install` runs successfully
- [ ] Server starts with `npm start`
- [ ] Copied VAPID keys from logs
- [ ] Added VAPID keys to Environment Variables
- [ ] Redeployed after adding keys
- [ ] Opened deployed URL
- [ ] Completed onboarding
- [ ] Enabled notifications
- [ ] Clicked "Test Now" → Notification received
- [ ] Set interval (10/20/30/60 min)
- [ ] Waited for interval → Notification received

**All checked?** Your app is production-ready! 🎉

---

**Made with 💧 by the HydroMe Team**
