document.addEventListener('DOMContentLoaded', function() {
  const openaiKeyInput = document.getElementById('openai-key');
  const tavilyKeyInput = document.getElementById('tavily-key');
  const saveBtn = document.getElementById('save-btn');
  const status = document.getElementById('status');

  // Load saved keys
  chrome.storage.sync.get(['openaiKey', 'tavilyKey'], function(result) {
    if (result.openaiKey) {
      openaiKeyInput.value = result.openaiKey;
    }
    if (result.tavilyKey) {
      tavilyKeyInput.value = result.tavilyKey;
    }
  });

  // Save keys
  saveBtn.addEventListener('click', function() {
    const openaiKey = openaiKeyInput.value.trim();
    const tavilyKey = tavilyKeyInput.value.trim();

    if (!openaiKey || !tavilyKey) {
      showStatus('Please enter both API keys', 'error');
      return;
    }

    chrome.storage.sync.set({
      openaiKey: openaiKey,
      tavilyKey: tavilyKey
    }, function() {
      showStatus('API keys saved successfully!', 'success');
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    });
  });

  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
    status.style.display = 'block';
  }
});