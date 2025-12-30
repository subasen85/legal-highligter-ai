# Legal Terms Highlighter AI - Chrome Extension

An intelligent Chrome extension that automatically detects and highlights legal terminology on any webpage, providing AI-powered definitions through a smart multi-tier lookup system.

## Features

✅ **Automatic Detection**: Highlights legal terms including common phrases and Indian legal codes (IPC420, Section 302, etc.)

✅ **Multi-Tier Definition Lookup**:
1. **Local Dictionary** - Instant definitions from built-in database
2. **Dictionary API + OpenAI** - Evaluates dictionary definitions for legal context
3. **Tavily Web Search** - Falls back to internet search for obscure terms
4. **AI Synthesis** - OpenAI analyzes and provides the most relevant legal definition

✅ **Interactive Tooltips**: Hover over highlighted terms to see definitions

✅ **Console Logging**: Prints detected terms to F12 console

✅ **Beautiful UI**: Modern, polished interface with smooth animations

## Installation

### Step 1: Get API Keys

You'll need two API keys:

1. **OpenAI API Key**
   - Visit: https://platform.openai.com/api-keys
   - Sign up or log in
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Tavily API Key**
   - Visit: https://tavily.com
   - Sign up for a free account
   - Get your API key (starts with `tvly-`)

### Step 2: Install Extension

1. Download and extract the extension folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `legal-highlighter-ai` folder

### Step 3: Configure API Keys

1. Click the extension icon in Chrome toolbar
2. Enter your OpenAI API key
3. Enter your Tavily API key
4. Click **Save API Keys**

## File Structure

```
legal-highlighter-ai/
├── manifest.json           # Extension configuration
├── content.js             # Main content script
├── background.js          # Service worker for API calls
├── styles.css             # Styling for highlights and tooltips
├── popup.html             # Settings popup interface
├── popup.js               # Settings popup logic
├── legal-terms.json       # Local legal terms database
├── README.md             # This file
└── icons/
    ├── icon16.png        # 16x16 icon
    ├── icon48.png        # 48x48 icon
    └── icon128.png       # 128x128 icon
```

## How It Works

### Definition Lookup Flow

1. **Local Database First**: Checks `legal-terms.json` for instant results
2. **Dictionary API**: If not in local database, queries https://api.dictionaryapi.dev
3. **AI Evaluation**: OpenAI analyzes dictionary results to select the most legally-relevant definition
4. **Web Search Fallback**: For terms not in dictionary (like IPC420 uses Tavily to search the web
5. **AI Synthesis**: OpenAI synthesizes web search results into a clear definition

### Example: "IPC420"

```
Step 1: Not in legal-terms.json ❌
Step 2: Dictionary API returns "No Definitions Found" ❌
Step 3: Tavily searches "legal definition of IPC420 ✅
Step 4: OpenAI synthesizes search results:
Result: "Section 420 of the Indian Penal Code deals with 
cheating and dishonestly inducing delivery of property, 
punishable with imprisonment up to seven years and fine."
```

## Usage

1. **Browse any webpage** - Extension automatically scans for legal terms
2. **View highlights** - Legal terms are highlighted with yellow background and red underline
3. **Hover for definitions** - Move mouse over highlighted term to see tooltip
4. **Check console** - Open F12 Developer Tools to see logged terms

## Customization

### Adding More Terms

Edit `legal-terms.json` to add more terms to the local database:

```json
{
  "terms": {
    "your-term": "Your definition here",
    "another-term": "Another definition"
  }
}
```

### Detecting Custom Patterns

Edit the `legalPatterns` array in `content.js` to detect additional legal term patterns:

```javascript
const legalPatterns = [
  /\bIPC\s*\d+[A-Z]?\b/gi,
  /\bYOUR_PATTERN_HERE\b/gi
];
```

## API Costs

- **OpenAI GPT-3.5-Turbo**: ~$0.0015 per definition (~150 tokens)
- **Tavily Search**: Free tier includes 1,000 searches/month
- **Dictionary API**: Completely free

## Troubleshooting

### Extension not working?
1. Check if API keys are saved (click extension icon)
2. Verify API keys are valid
3. Check Chrome DevTools console (F12) for errors

### Definitions not loading?
1. Check your internet connection
2. Verify API keys have sufficient credits
3. Look for rate limit errors in console

### Terms not being highlighted?
1. Refresh the page after installing
2. Check if terms exist in `legal-terms.json`
3. Verify the term matches legal patterns

## Privacy & Security

- API keys are stored locally in Chrome's secure storage
- Definitions are cached to minimize API calls
- No data is sent to third parties except OpenAI and Tavily APIs
- Extension only reads page content, never modifies or stores it

## Contributing

To add more legal terms:
1. Edit `legal-terms.json`
2. Follow the format: `"term": "simple definition"`
3. Keep definitions under 200 characters
4. Focus on clarity over legal precision

## License

This extension is provided as-is for educational and personal use.

## Credits

- Dictionary API: https://dictionaryapi.dev
- OpenAI: https://openai.com
- Tavily Search: https://tavily.com

---

**Version**: 2.0  
**Last Updated**: December 2024  
**Author**: TechtoGeek.com# legal-highligter-ai
