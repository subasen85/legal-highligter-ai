// Cache for definitions
const definitionCache = new Map();

// Enhanced logging utility
function logAPI(term, stage, details = '') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] 🔧 Background | Term: "${term}" | ${stage}${details ? ' | ' + details : ''}`);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDefinition') {
    console.log('\n' + '▼'.repeat(70));
    logAPI(request.term, '📨 REQUEST RECEIVED', 'From content script');
    
    handleDefinitionRequest(request.term, request.localDef)
      .then(response => {
        console.log('▲'.repeat(70) + '\n');
        sendResponse(response);
      })
      .catch(error => {
        console.error('❌ Background error:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

async function handleDefinitionRequest(term, localDefinition) {
  // Check cache first
  const cacheKey = term.toLowerCase();
  if (definitionCache.has(cacheKey)) {
    logAPI(term, '💾 CACHE HIT', 'Returning cached definition');
    return { definition: definitionCache.get(cacheKey), source: 'cache' };
  }

  try {
    // Step 1: If local definition exists, use it
    if (localDefinition) {
      logAPI(term, '✅ Step 1: LOCAL DEFINITION', 'Using built-in database');
      definitionCache.set(cacheKey, localDefinition);
      return { definition: localDefinition, source: 'local' };
    }

    logAPI(term, '⏭️  Step 1: SKIPPED', 'Not in local database');

    // Step 2: Try Dictionary API
    logAPI(term, '🔍 Step 2: DICTIONARY API', 'Querying dictionaryapi.dev...');
    const dictionaryDef = await getDictionaryDefinition(term);
    
    if (dictionaryDef) {
      logAPI(term, '✅ Step 2: DICTIONARY FOUND', `Got ${dictionaryDef.length} definitions`);
      
      // Step 3: Use OpenAI to evaluate and choose best legal definition
      logAPI(term, '🤖 Step 3: OpenAI EVALUATION', 'Analyzing definitions for legal context...');
      const aiDefinition = await getAIEvaluatedDefinition(term, dictionaryDef);
      
      logAPI(term, '✅ Step 3: AI COMPLETE', 'Selected best legal definition');
      definitionCache.set(cacheKey, aiDefinition);
      return { definition: aiDefinition, source: 'dictionary+ai' };
    }

    logAPI(term, '❌ Step 2: NO DICTIONARY RESULT', 'Term not found in dictionary');

    // Step 4: Fallback to Tavily search
    logAPI(term, '🔍 Step 4: TAVILY SEARCH', 'Searching web for legal definition...');
    const searchDef = await getTavilyDefinition(term);
    
    if (searchDef) {
      logAPI(term, '✅ Step 4: TAVILY SUCCESS', 'Definition found via web search');
      definitionCache.set(cacheKey, searchDef);
      return { definition: searchDef, source: 'tavily' };
    }

    logAPI(term, '❌ Step 4: TAVILY FAILED', 'No results from web search');
    logAPI(term, '❌ ALL METHODS EXHAUSTED', 'Definition not available');
    
    return { definition: 'Definition not found', source: 'none' };
  } catch (error) {
    console.error('❌ Error getting definition:', error);
    logAPI(term, '💥 EXCEPTION', error.message);
    return { definition: 'Error loading definition', source: 'error' };
  }
}

async function getDictionaryDefinition(term) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${term}`;
    logAPI(term, '📡 API REQUEST', `GET ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      logAPI(term, '❌ API RESPONSE', `Status ${response.status} - ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    logAPI(term, '✅ API RESPONSE', 'Dictionary data received');
    
    if (!data || !data[0] || !data[0].meanings) {
      logAPI(term, '⚠️  EMPTY DATA', 'No meanings in response');
      return null;
    }

    // Extract all definitions
    const allDefinitions = [];
    data[0].meanings.forEach(meaning => {
      meaning.definitions.forEach(def => {
        allDefinitions.push({
          partOfSpeech: meaning.partOfSpeech,
          definition: def.definition,
          example: def.example || ''
        });
      });
    });

    logAPI(term, '📋 DEFINITIONS EXTRACTED', `Found ${allDefinitions.length} definitions`);
    allDefinitions.forEach((def, idx) => {
      console.log(`   ${idx + 1}. [${def.partOfSpeech}] ${def.definition.substring(0, 80)}...`);
    });

    return allDefinitions;
  } catch (error) {
    console.error('❌ Dictionary API error:', error);
    logAPI(term, '💥 DICTIONARY ERROR', error.message);
    return null;
  }
}

async function getAIEvaluatedDefinition(term, dictionaryDefinitions) {
  try {
    const keys = await chrome.storage.sync.get(['openaiKey']);
    if (!keys.openaiKey) {
      logAPI(term, '⚠️  NO API KEY', 'OpenAI key not configured');
      throw new Error('OpenAI API key not configured');
    }

    logAPI(term, '🔑 API KEY FOUND', 'Preparing OpenAI request');

    const prompt = `You are a legal terminology expert. Given the word "${term}" and the following definitions from a dictionary:

${JSON.stringify(dictionaryDefinitions, null, 2)}

Task: Identify which definition is most relevant for LEGAL context. Return ONLY the most appropriate legal definition in simple, clear language (maximum 2 sentences). If it's primarily a legal term, return the legal definition. If none are legal, return the most formal/official definition.

Your response should be the definition text only, no additional commentary.`;

    logAPI(term, '📤 SENDING TO OpenAI', 'Using GPT-3.5-Turbo');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys.openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a legal terminology expert who provides concise, accurate definitions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logAPI(term, '❌ OpenAI ERROR', `Status ${response.status}: ${errorText.substring(0, 100)}`);
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    logAPI(term, '✅ OpenAI RESPONSE', `${aiResponse.substring(0, 100)}...`);
    
    return aiResponse;
  } catch (error) {
    console.error('❌ OpenAI error:', error);
    logAPI(term, '💥 OpenAI EXCEPTION', error.message);
    
    // Fallback: return first definition from dictionary
    if (dictionaryDefinitions && dictionaryDefinitions.length > 0) {
      logAPI(term, '🔄 FALLBACK', 'Using first dictionary definition');
      return dictionaryDefinitions[0].definition;
    }
    throw error;
  }
}

async function getTavilyDefinition(term) {
  try {
    const keys = await chrome.storage.sync.get(['tavilyKey']);
    if (!keys.tavilyKey) {
      logAPI(term, '⚠️  NO API KEY', 'Tavily key not configured');
      throw new Error('Tavily API key not configured');
    }

    logAPI(term, '🔑 API KEY FOUND', 'Preparing Tavily search');

    const query = `legal definition of ${term}`;
    logAPI(term, '📤 TAVILY QUERY', `"${query}"`);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: keys.tavilyKey,
        query: query,
        search_depth: 'basic',
        max_results: 3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logAPI(term, '❌ TAVILY ERROR', `Status ${response.status}: ${errorText.substring(0, 100)}`);
      throw new Error('Tavily API request failed');
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      logAPI(term, '❌ NO RESULTS', 'Tavily returned empty results');
      return null;
    }

    logAPI(term, '✅ TAVILY RESULTS', `Found ${data.results.length} search results`);
    data.results.forEach((result, idx) => {
      console.log(`   ${idx + 1}. ${result.title}`);
      console.log(`      ${result.content.substring(0, 100)}...`);
    });

    // Use OpenAI to synthesize the search results
    const keys2 = await chrome.storage.sync.get(['openaiKey']);
    if (!keys2.openaiKey) {
      logAPI(term, '⚠️  NO OpenAI KEY', 'Returning first Tavily result');
      // Return first result if no OpenAI key
      return data.results[0].content;
    }

    logAPI(term, '🤖 SYNTHESIZING', 'Using OpenAI to combine search results');

    const synthesisPrompt = `Based on these search results about the legal term "${term}":

${data.results.map((r, i) => `Result ${i + 1}: ${r.content}`).join('\n\n')}

Provide a clear, concise legal definition in 1-2 sentences that captures the essential meaning.`;

    logAPI(term, '📤 SENDING TO OpenAI', 'For synthesis');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys2.openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a legal expert who provides clear, concise definitions.' },
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const synthesizedDef = aiData.choices[0].message.content.trim();
      logAPI(term, '✅ SYNTHESIS COMPLETE', `${synthesizedDef.substring(0, 100)}...`);
      return synthesizedDef;
    }

    logAPI(term, '⚠️  SYNTHESIS FAILED', 'Returning first Tavily result');
    return data.results[0].content;
  } catch (error) {
    console.error('❌ Tavily search error:', error);
    logAPI(term, '💥 TAVILY EXCEPTION', error.message);
    return null;
  }
}