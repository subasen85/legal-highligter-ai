// Legal terms database
let legalTermsData = null;
const loadingTerms = new Set();

// Enhanced logging utility
function logDefinitionLookup(term, stage, details = '') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] 🔍 Term: "${term}" | Stage: ${stage}${details ? ' | ' + details : ''}`);
}

// Load legal terms from JSON file
async function loadLegalTerms() {
  try {
    const response = await fetch(chrome.runtime.getURL('legal-terms.json'));
    legalTermsData = await response.json();
    console.log('✅ Legal terms database loaded successfully');
    console.log(`📊 Total terms in local database: ${Object.keys(legalTermsData.terms).length}`);
  } catch (error) {
    console.error('❌ Error loading legal terms:', error);
  }
}

// Check if a word is a legal term
function isLegalTerm(word) {
  if (!legalTermsData) return false;
  const cleanWord = word.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return cleanWord in legalTermsData.terms;
}

// Get definition for a legal term (local or via AI)
async function getDefinition(word, element) {
  const cleanWord = word.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  console.log('\n' + '='.repeat(60));
  logDefinitionLookup(cleanWord, 'START', 'Beginning definition lookup');
  
  // Check if already loading
  if (loadingTerms.has(cleanWord)) {
    logDefinitionLookup(cleanWord, 'SKIP', 'Already loading this term');
    return 'Loading definition...';
  }

  // Get local definition if exists
  const localDef = legalTermsData && legalTermsData.terms[cleanWord];
  
  // If we have local definition, return it immediately
  if (localDef) {
    logDefinitionLookup(cleanWord, '✅ LOCAL DEFINITION FOUND', 'Using built-in database');
    console.log(`📖 Definition: "${localDef.substring(0, 100)}${localDef.length > 100 ? '...' : ''}"`);
    console.log('='.repeat(60) + '\n');
    return localDef;
  }

  logDefinitionLookup(cleanWord, '❌ NOT IN LOCAL DB', 'Proceeding to online lookup');

  // Mark as loading
  loadingTerms.add(cleanWord);
  element.dataset.loading = 'true';

  try {
    // Request definition from background script
    logDefinitionLookup(cleanWord, '🌐 API CALL', 'Sending request to background service');
    
    const response = await chrome.runtime.sendMessage({
      action: 'getDefinition',
      term: cleanWord,
      localDef: localDef
    });

    if (response && response.definition) {
      element.dataset.definition = response.definition;
      element.dataset.source = response.source;
      
      // Log the source of the definition
      const sourceDetails = {
        'dictionary+ai': '✅ DICTIONARY API + OpenAI',
        'tavily': '✅ TAVILY WEB SEARCH',
        'cache': '✅ CACHED RESULT',
        'local': '✅ LOCAL DATABASE'
      };
      
      logDefinitionLookup(cleanWord, sourceDetails[response.source] || 'UNKNOWN SOURCE', '');
      console.log(`📖 Definition: "${response.definition.substring(0, 100)}${response.definition.length > 100 ? '...' : ''}"`);
      console.log('='.repeat(60) + '\n');
      
      return response.definition;
    }

    logDefinitionLookup(cleanWord, '❌ NO DEFINITION', 'All lookup methods failed');
    console.log('='.repeat(60) + '\n');
    return 'Definition not available';
  } catch (error) {
    console.error('❌ Error fetching definition:', error);
    logDefinitionLookup(cleanWord, 'ERROR', error.message);
    console.log('='.repeat(60) + '\n');
    return 'Error loading definition';
  } finally {
    loadingTerms.delete(cleanWord);
    element.dataset.loading = 'false';
  }
}

// Create tooltip element
function createTooltip() {
  const tooltip = document.createElement('div');
  tooltip.id = 'legal-term-tooltip';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);
  console.log('💬 Tooltip element created');
  return tooltip;
}

// Show tooltip
async function showTooltip(element, word) {
  const tooltip = document.getElementById('legal-term-tooltip');
  if (!tooltip) return;

  console.log(`\n👆 Hovering over: "${word}"`);

  // Show loading state
  tooltip.innerHTML = '<div class="tooltip-loading">Loading definition...</div>';
  tooltip.style.display = 'block';

  const rect = element.getBoundingClientRect();
  
  // Position tooltip above the element
  tooltip.style.left = rect.left + window.scrollX + 'px';
  tooltip.style.top = rect.top + window.scrollY - tooltip.offsetHeight - 10 + 'px';

  // Get definition (cached or fetch new)
  let definition;
  if (element.dataset.definition) {
    definition = element.dataset.definition;
    console.log('💾 Using cached definition from element dataset');
  } else {
    definition = await getDefinition(word, element);
  }

  // Update tooltip content
  const source = element.dataset.source || 'local';
  const sourceLabel = {
    'local': '📚 Local Dictionary',
    'dictionary+ai': '🤖 AI + Dictionary',
    'tavily': '🔍 Web Search',
    'cache': '💾 Cached'
  }[source] || '';

  tooltip.innerHTML = `
    <div class="tooltip-word">${word.toUpperCase()}</div>
    <div class="tooltip-definition">${definition}</div>
    ${sourceLabel ? `<div class="tooltip-source">${sourceLabel}</div>` : ''}
  `;

  console.log(`✅ Tooltip displayed with ${source} definition\n`);

  // Reposition after content update
  const newRect = element.getBoundingClientRect();
  tooltip.style.left = newRect.left + window.scrollX + 'px';
  tooltip.style.top = newRect.top + window.scrollY - tooltip.offsetHeight - 10 + 'px';
  
  // Adjust if tooltip goes off-screen
  if (newRect.top < tooltip.offsetHeight + 10) {
    tooltip.style.top = newRect.bottom + window.scrollY + 10 + 'px';
  }
}

// Hide tooltip
function hideTooltip() {
  const tooltip = document.getElementById('legal-term-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// Enhanced legal term detection with common legal patterns
function detectLegalTerms(text) {
  const legalPatterns = [
    /\bIPC\s*\d+[A-Z]?\b/gi,  // IPC420, IPC 420A
    /\bSection\s*\d+[A-Z]?\b/gi,  // Section 420
    /\bArticle\s*\d+[A-Z]?\b/gi,  // Article 21
    /\b\d+\s*USC\s*§?\s*\d+/gi,  // 18 USC 1001
  ];

  const detectedTerms = [];
  
  // Check against patterns
  legalPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => detectedTerms.push(match.trim()));
    }
  });

  return detectedTerms;
}

// Process text nodes and highlight legal terms
function highlightLegalTerms(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    
    // Detect pattern-based legal terms (like IPC420)
    const patternTerms = detectLegalTerms(text);
    
    // Split by words
    const words = text.split(/(\s+)/);
    let foundTerms = false;

    const fragment = document.createDocumentFragment();
    let i = 0;
    
    while (i < words.length) {
      const word = words[i];
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      
      // Check if this position matches a pattern term
      let matchedPattern = null;
      for (const pattern of patternTerms) {
        const remainingText = words.slice(i).join('');
        if (remainingText.toLowerCase().startsWith(pattern.toLowerCase())) {
          matchedPattern = pattern;
          break;
        }
      }
      
      if (matchedPattern) {
        foundTerms = true;
        console.log(`⚖️  Found legal pattern: "${matchedPattern}"`);
        
        const span = document.createElement('span');
        span.className = 'legal-term-highlight';
        span.textContent = matchedPattern;
        span.dataset.term = matchedPattern;
        
        // Add hover events
        span.addEventListener('mouseenter', function() {
          showTooltip(this, this.dataset.term);
        });
        
        span.addEventListener('mouseleave', function() {
          hideTooltip();
        });
        
        fragment.appendChild(span);
        
        // Skip ahead by the length of the matched pattern
        const patternLength = matchedPattern.split(/\s+/).length;
        i += patternLength;
      } else if (cleanWord && isLegalTerm(cleanWord)) {
        foundTerms = true;
        console.log(`⚖️  Found legal term: "${cleanWord}"`);
        
        const span = document.createElement('span');
        span.className = 'legal-term-highlight';
        span.textContent = word;
        span.dataset.term = cleanWord;
        
        // Add hover events
        span.addEventListener('mouseenter', function() {
          showTooltip(this, this.dataset.term);
        });
        
        span.addEventListener('mouseleave', function() {
          hideTooltip();
        });
        
        fragment.appendChild(span);
        i++;
      } else {
        fragment.appendChild(document.createTextNode(word));
        i++;
      }
    }

    if (foundTerms) {
      node.parentNode.replaceChild(fragment, node);
      return true;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Skip script, style, and already processed elements
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE' || 
        node.classList.contains('legal-term-highlight') ||
        node.id === 'legal-term-tooltip') {
      return false;
    }

    let foundInChildren = false;
    const children = Array.from(node.childNodes);
    children.forEach(child => {
      if (highlightLegalTerms(child)) {
        foundInChildren = true;
      }
    });
    return foundInChildren;
  }
  
  return false;
}

// Main function to process the page
async function processPage() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 LEGAL TERMS HIGHLIGHTER - Starting Page Analysis');
  console.log('═'.repeat(70));
  console.log(`📄 URL: ${window.location.href}`);
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log('─'.repeat(70));
  
  await loadLegalTerms();
  
  createTooltip();
  
  console.log('🔍 Scanning page for legal terms...\n');
  
  const bodyFound = highlightLegalTerms(document.body);
  
  console.log('\n' + '─'.repeat(70));
  if (!bodyFound) {
    console.log('❌ No Law related points in the current page');
  } else {
    console.log('✅ Legal terms highlighted on page');
    console.log('💡 Hover over highlighted terms to see definitions');
    console.log('📊 Check logs above for detailed lookup information');
  }
  console.log('═'.repeat(70) + '\n');
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processPage);
} else {
  processPage();
}

// Watch for dynamic content changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.id !== 'legal-term-tooltip') {
        highlightLegalTerms(node);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});