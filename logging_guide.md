# Enhanced Logging Guide

## 📊 Understanding the Console Logs

The extension now provides detailed logging to track exactly which lookup method is being used for each term. Here's how to read and understand the logs:

---

## 🎯 Log Locations

### 1. Content Script Logs (Main Tab)
- Open F12 Developer Tools → **Console** tab
- Shows page scanning, term detection, and tooltip interactions

### 2. Background Service Worker Logs
- Go to `chrome://extensions/`
- Find "Legal Terms Highlighter AI"
- Click **"Inspect views: service worker"**
- Shows detailed API calls, OpenAI interactions, and Tavily searches

---

## 📝 Log Format

All logs follow this format:
```
[HH:MM:SS] 🔍 Term: "word" | Stage: ACTION | Details
```

- **Timestamp**: Current time in HH:MM:SS format
- **Term**: The legal term being looked up
- **Stage**: Current processing stage
- **Details**: Additional context

---

## 🔍 Content Script Log Patterns

### Page Load Sequence
```
═══════════════════════════════════════════════════════════
🚀 LEGAL TERMS HIGHLIGHTER - Starting Page Analysis
═══════════════════════════════════════════════════════════
📄 URL: https://example.com
⏰ Time: 12/29/2024, 3:45:23 PM
───────────────────────────────────────────────────────────
✅ Legal terms database loaded successfully
📊 Total terms in local database: 41
💬 Tooltip element created
🔍 Scanning page for legal terms...
```

### Term Detection
```
⚖️  Found legal term: "judge"
⚖️  Found legal pattern: "IPC420"
```

### Lookup Process Start
```
============================================================
[15:30:45] 🔍 Term: "judge" | Stage: START | Beginning definition lookup
[15:30:45] 🔍 Term: "judge" | Stage: ✅ LOCAL DEFINITION FOUND | Using built-in database
📖 Definition: "A person who presides over court proceedings and makes decisions about legal matters..."
============================================================
```

### Tooltip Interaction
```
👆 Hovering over: "judge"
💾 Using cached definition from element dataset
✅ Tooltip displayed with local definition
```

---

## 🔧 Background Service Worker Log Patterns

### 1️⃣ Local Definition (Fastest)
```
▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
[15:30:45] 🔧 Background | Term: "judge" | 📨 REQUEST RECEIVED | From content script
[15:30:45] 🔧 Background | Term: "judge" | ✅ Step 1: LOCAL DEFINITION | Using built-in database
▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
```
**This means**: Term was found in `legal-terms.json` and returned immediately.

---

### 2️⃣ Dictionary API + OpenAI (Most Common for Standard Words)
```
▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
[15:31:12] 🔧 Background | Term: "arbitration" | 📨 REQUEST RECEIVED
[15:31:12] 🔧 Background | Term: "arbitration" | ⏭️  Step 1: SKIPPED | Not in local database
[15:31:12] 🔧 Background | Term: "arbitration" | 🔍 Step 2: DICTIONARY API | Querying dictionaryapi.dev...
[15:31:12] 🔧 Background | Term: "arbitration" | 📡 API REQUEST | GET https://api.dictionaryapi.dev/api/v2/entries/en/arbitration
[15:31:13] 🔧 Background | Term: "arbitration" | ✅ API RESPONSE | Dictionary data received
[15:31:13] 🔧 Background | Term: "arbitration" | 📋 DEFINITIONS EXTRACTED | Found 3 definitions
   1. [noun] The use of an arbitrator to settle a dispute...
   2. [noun] A process of dispute resolution...
   3. [verb] To refer a dispute to arbitration...
[15:31:13] 🔧 Background | Term: "arbitration" | ✅ Step 2: DICTIONARY FOUND | Got 3 definitions
[15:31:13] 🔧 Background | Term: "arbitration" | 🤖 Step 3: OpenAI EVALUATION | Analyzing definitions for legal context...
[15:31:13] 🔧 Background | Term: "arbitration" | 🔑 API KEY FOUND | Preparing OpenAI request
[15:31:13] 🔧 Background | Term: "arbitration" | 📤 SENDING TO OpenAI | Using GPT-3.5-Turbo
[15:31:15] 🔧 Background | Term: "arbitration" | ✅ OpenAI RESPONSE | A way to resolve disputes outside of court, where a neutral third party...
[15:31:15] 🔧 Background | Term: "arbitration" | ✅ Step 3: AI COMPLETE | Selected best legal definition
▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
```
**This means**: 
- Not in local database
- Found in Dictionary API (dictionaryapi.dev)
- OpenAI analyzed the definitions and selected the most legally-relevant one

---

### 3️⃣ Tavily Web Search (For Legal Codes like IPC420)
```
▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
[15:32:05] 🔧 Background | Term: "ipc420" | 📨 REQUEST RECEIVED
[15:32:05] 🔧 Background | Term: "ipc420" | ⏭️  Step 1: SKIPPED | Not in local database
[15:32:05] 🔧 Background | Term: "ipc420" | 🔍 Step 2: DICTIONARY API | Querying dictionaryapi.dev...
[15:32:05] 🔧 Background | Term: "ipc420" | 📡 API REQUEST | GET https://api.dictionaryapi.dev/api/v2/entries/en/ipc420
[15:32:06] 🔧 Background | Term: "ipc420" | ❌ API RESPONSE | Status 404 - Not Found
[15:32:06] 🔧 Background | Term: "ipc420" | ❌ Step 2: NO DICTIONARY RESULT | Term not found in dictionary
[15:32:06] 🔧 Background | Term: "ipc420" | 🔍 Step 4: TAVILY SEARCH | Searching web for legal definition...
[15:32:06] 🔧 Background | Term: "ipc420" | 🔑 API KEY FOUND | Preparing Tavily search
[15:32:06] 🔧 Background | Term: "ipc420" | 📤 TAVILY QUERY | "legal definition of ipc420"
[15:32:08] 🔧 Background | Term: "ipc420" | ✅ TAVILY RESULTS | Found 3 search results
   1. Section 420 of Indian Penal Code - Legal Service India
      Section 420 in The Indian Penal Code. Cheating and dishonestly inducing delivery of property...
   2. IPC Section 420 - Wikipedia
      Section 420 deals with cheating and dishonestly inducing delivery of property...
   3. What is IPC 420? - Law Insider
      IPC 420 is a provision under Indian Penal Code that deals with cheating...
[15:32:08] 🔧 Background | Term: "ipc420" | 🤖 SYNTHESIZING | Using OpenAI to combine search results
[15:32:08] 🔧 Background | Term: "ipc420" | 📤 SENDING TO OpenAI | For synthesis
[15:32:10] 🔧 Background | Term: "ipc420" | ✅ SYNTHESIS COMPLETE | Section 420 of the Indian Penal Code deals with cheating and dishonestly...
[15:32:10] 🔧 Background | Term: "ipc420" | ✅ Step 4: TAVILY SUCCESS | Definition found via web search
▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
```
**This means**:
- Not in local database
- Not found in Dictionary API (404 error)
- Tavily searched the web and found 3 results
- OpenAI synthesized the web results into a clear definition

---

### 4️⃣ Cached Result (Instant)
```
▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
[15:33:20] 🔧 Background | Term: "arbitration" | 📨 REQUEST RECEIVED
[15:33:20] 🔧 Background | Term: "arbitration" | 💾 CACHE HIT | Returning cached definition
▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
```
**This means**: This term was already looked up in this session, so the cached result is returned instantly.

---

## 🎨 Log Emoji Legend

| Emoji | Meaning |
|-------|---------|
| 🚀 | Extension initialization |
| ✅ | Success / Found |
| ❌ | Not found / Failed |
| ⚠️ | Warning / Missing config |
| 💾 | Cache operation |
| 🔍 | Search / Scanning |
| 🔧 | Background worker |
| 📨 | Message received |
| 📡 | API request sent |
| 📤 | Sending data |
| 🤖 | OpenAI processing |
| 🔑 | API key operation |
| 💬 | Tooltip operation |
| 👆 | User interaction |
| ⚖️ | Legal term detected |
| 📖 | Definition displayed |
| 📊 | Statistics |
| 📄 | Page information |
| ⏰ | Timestamp |
| 💥 | Exception/Error |
| ⏭️ | Step skipped |

---

## 🧪 Testing Each Lookup Method

### Test 1: Local Definition
```html
<!-- Create test.html -->
<p>The judge made a verdict about the defendant</p>
```
**Expected logs**: 
- "Found legal term: judge"
- "LOCAL DEFINITION FOUND"
- Source: 📚 Local Dictionary

### Test 2: Dictionary + AI
```html
<p>The parties chose arbitration over litigation</p>
```
**Expected logs**:
- "Found legal term: arbitration"
- "DICTIONARY API → OpenAI EVALUATION"
- Source: 🤖 AI + Dictionary

### Test 3: Tavily Web Search
```html
<p>He was charged under IPC420 and Section 302</p>
```
**Expected logs**:
- "Found legal pattern: IPC420"
- "NO DICTIONARY RESULT → TAVILY SEARCH"
- Source: 🔍 Web Search

### Test 4: Cached Result
```html
<!-- Hover over the same term twice -->
<p>The judge and the judge</p>
```
**Expected logs**:
- First hover: Full lookup process
- Second hover: "CACHE HIT" or "Using cached definition from element dataset"

---

## 🐛 Troubleshooting with Logs

### Problem: No highlights appearing
**Check for**:
```
❌ Error loading legal terms
```
**Solution**: Verify `legal-terms.json` exists

### Problem: Definitions not loading
**Check for**:
```
⚠️  NO API KEY | OpenAI key not configured
⚠️  NO API KEY | Tavily key not configured
```
**Solution**: Add API keys via extension popup

### Problem: API errors
**Check for**:
```
❌ API RESPONSE | Status 401 - Unauthorized
❌ API RESPONSE | Status 429 - Too Many Requests
```
**Solution**: 
- 401: Check API key is valid
- 429: You've hit rate limits

### Problem: OpenAI synthesis failing
**Check for**:
```
💥 OpenAI EXCEPTION | ...error message...
🔄 FALLBACK | Using first dictionary definition
```
**Solution**: Check OpenAI API credits and key validity

---

## 📈 Performance Monitoring

### Average Lookup Times
- **Local Definition**: < 1ms (instant)
- **Cached**: < 1ms (instant)
- **Dictionary + AI**: 1-3 seconds
- **Tavily + AI**: 3-5 seconds

### API Call Tracking
Count the number of API calls in your session:
```javascript
// Run in console to see API call statistics
console.log('Check the background service worker logs for detailed API usage');
```

---

## 💡 Pro Tips

1. **Keep Background Service Worker Open**: Inspect it to see all API interactions in real-time
2. **Filter Logs**: Use Chrome's console filter: Type "LOCAL", "DICTIONARY", "TAVILY", or "OpenAI"
3. **Export Logs**: Right-click in console → "Save as..." to save logs for debugging
4. **Verbose Mode**: All logs are already verbose by default
5. **Clear Cache**: Reload extension to clear in-memory cache

---

## 📞 Support

If logs show errors:
1. Copy the full error message from console
2. Check the background service worker for more details
3. Verify API keys are correctly entered
4. Check internet connection
5. Ensure you have API credits remaining

---

**Happy Debugging!** 🎉