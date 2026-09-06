const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-pro',
  'gemini-3.6-flash',
  'gemini-flash-latest'
];

export const callGemini = async (prompt, apiKey) => {
  if (!apiKey) {
    throw new Error("API Key is undefined. Check your .env.local file.");
  }

  // Pre-set default working model if not cached for instant sub-second response
  let cachedModel = localStorage.getItem('grabit_working_model') || 'gemini-2.5-flash';
  let cachedVersion = localStorage.getItem('grabit_working_version') || 'v1beta';

  const versions = Array.from(new Set([cachedVersion, 'v1beta', 'v1']));
  const models = Array.from(new Set([cachedModel, ...GEMINI_MODELS]));

  let lastError = null;
  const tried = new Set();

  for (const version of versions) {
    for (const model of models) {
      const key = `${version}:${model}`;
      if (tried.has(key)) continue;
      tried.add(key);

      try {
        console.log(`[Gemini FastAPI] Querying ${model} (${version})...`);
        
        // 8-second AbortController timeout per request to avoid hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
          })
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (!response.ok) {
          console.warn(`[Gemini] API Error (${model}):`, data.error?.message || response.statusText);
          lastError = data.error?.message || `Status ${response.status}`;
          continue; 
        }
        
        if (data.candidates && data.candidates[0]) {
          localStorage.setItem('grabit_working_model', model);
          localStorage.setItem('grabit_working_version', version);
          console.log(`[Gemini] SUCCESS: ${model} (${version})`);
          return data;
        }
        
        lastError = data.error?.message || `Model ${model} failed.`;
      } catch (err) {
        lastError = err.name === 'AbortError' ? `Request timed out on ${model}` : err.message;
      }
    }
  }
  
  // Clear cached model if it failed
  localStorage.removeItem('grabit_working_model');
  localStorage.removeItem('grabit_working_version');
  
  // Dynamic model discovery fallback
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();
    if (listData.models && Array.isArray(listData.models)) {
      const availableContentModels = listData.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));

      for (const model of availableContentModels) {
        if (tried.has(`v1beta:${model}`)) continue;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
            })
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          if (res.ok && data.candidates && data.candidates[0]) {
            localStorage.setItem('grabit_working_model', model);
            localStorage.setItem('grabit_working_version', 'v1beta');
            return data;
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  throw new Error(`All attempts failed. Final error: ${lastError}`);
};

/**
 * Safely extracts and parses JSON from a string that might contain markdown backticks or extra text.
 */
export const safeParseJSON = (text) => {
  if (!text) return null;
  try {
    // Attempt direct parse first
    return JSON.parse(text);
  } catch (directError) {
    try {
      // Find the first { and last }
      let firstBrace = text.indexOf('{');
      let lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1) {
        let cleaned = text.substring(firstBrace, lastBrace !== -1 ? lastBrace + 1 : text.length);
        
        // JSON Repair Logic: If it was truncated, try to close it
        if (lastBrace === -1 || cleaned.split('{').length > cleaned.split('}').length) {
          console.warn("[Gemini] Truncated JSON detected, attempting repair...");
          // Simple repair: add closing brackets/braces until valid
          let repaired = cleaned;
          if (!repaired.includes(']')) repaired += ']}';
          else if (repaired.split('{').length > repaired.split('}').length) repaired += '}';
          
          try {
            return JSON.parse(repaired);
          } catch (e) {
            // If simple repair fails, try a more aggressive approach
            if (!repaired.endsWith('"}')) repaired = repaired.replace(/,[^,]*$/, '') + ']}';
            return JSON.parse(repaired);
          }
        }
        
        return JSON.parse(cleaned);
      }
      throw new Error("No JSON object found in response");
    } catch (cleanError) {
      console.error("[Gemini] JSON Parse Failure. Original text:", text);
      throw new Error(`Failed to parse AI response as JSON: ${cleanError.message}`);
    }
  }
};
