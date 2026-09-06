import { supabase } from './supabaseClient';

const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getUserKey = (prefix) => {
  try {
    const demoUserStr = localStorage.getItem('grabit_demo_user');
    if (demoUserStr) {
      const demoUser = JSON.parse(demoUserStr);
      if (demoUser?.id) return `${prefix}_${demoUser.id}`;
    }
  } catch (e) {}

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const sessionObj = JSON.parse(localStorage.getItem(k) || '{}');
        if (sessionObj?.user?.id) {
          return `${prefix}_${sessionObj.user.id}`;
        }
      }
    }
  } catch (e) {}

  return `${prefix}_guest`;
};

export const grabitApi = {
  // --- INTERVIEWS ---
  async saveInterview(interviewData) {
    const storageKey = getUserKey('grabit_history');
    let localHistory = [];
    try {
      localHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (e) {}

    const localId = interviewData.id || generateUUID();
    
    // Strip large Base64 video strings from LocalStorage item to prevent 5MB QuotaExceededError
    let safeVideoUrl = interviewData.video_url;
    if (safeVideoUrl && safeVideoUrl.length > 500000) {
      safeVideoUrl = null;
    }

    const formattedItem = {
      id: localId,
      role: interviewData.role || 'Practice Session',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      score: interviewData.score || 0,
      status: 'Completed',
      questions: interviewData.questions || 1,
      summary: interviewData.summary || {},
      video_url: safeVideoUrl,
      analytics: {
        tech: interviewData.tech_score || 0,
        behavioral: interviewData.behavioral_score || 0,
        stability: interviewData.stability_score || 0,
        bodyLanguage: interviewData.body_language_score || 0
      }
    };
    
    localHistory.unshift(formattedItem);

    // Save with QuotaExceededError safety
    try {
      localStorage.setItem(storageKey, JSON.stringify(localHistory));
    } catch (quotaErr) {
      console.warn("[grabitApi] LocalStorage quota exceeded, storing metadata only:", quotaErr);
      const lightHistory = localHistory.map(item => ({
        ...item,
        video_url: (item.video_url && item.video_url.length > 1000) ? null : item.video_url
      }));
      try {
        localStorage.setItem(storageKey, JSON.stringify(lightHistory));
      } catch (e) {}
    }

    // 2. Cloud Sync (If Supabase table exists)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('interviews')
          .insert([{
            user_id: user.id,
            role: interviewData.role,
            score: interviewData.score,
            tech_score: interviewData.tech_score,
            behavioral_score: interviewData.behavioral_score,
            stability_score: interviewData.stability_score,
            body_language_score: interviewData.body_language_score,
            summary: typeof interviewData.summary === 'string' ? interviewData.summary : interviewData.summary?.summary || '',
            report_json: interviewData.summary,
            video_url: interviewData.video_url && interviewData.video_url.length < 500000 ? interviewData.video_url : null
          }])
          .select();

        if (!error && data?.[0]) {
          formattedItem.id = data[0].id;
          return data[0];
        } else if (error) {
          console.warn("[grabitApi] Cloud interview save skipped:", error.message);
        }
      }
    } catch (e) {
      console.warn("[grabitApi] Cloud interview save skipped:", e.message);
    }

    return formattedItem;
  },

  async getInterviews() {
    const storageKey = getUserKey('grabit_history');
    let localHistory = [];

    // 1. Gather history items across ALL grabit_history* keys in localStorage (guest, scoped, legacy)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('grabit_history')) {
          const items = JSON.parse(localStorage.getItem(k) || '[]');
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (!localHistory.some(l => l.id === item.id || (l.role === item.role && l.score === item.score && (l.created_at === item.created_at || l.date === item.date)))) {
                localHistory.push(item);
              }
            });
          }
        }
      }
    } catch (e) {}

    // Save consolidated local history to current active storageKey
    try {
      localStorage.setItem(storageKey, JSON.stringify(localHistory));
    } catch (e) {}

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const combined = [...data];
          localHistory.forEach(local => {
            const isDup = combined.some(c => c.id === local.id || (c.role === local.role && c.score === local.score && (c.created_at === local.created_at || c.date === local.date)));
            if (!isDup) combined.push(local);
          });
          return combined;
        }
      }
    } catch (e) {}

    return localHistory;
  },

  async deleteInterview(sessionId) {
    // 1. Local Storage delete (both scoped and legacy keys)
    try {
      const storageKey = getUserKey('grabit_history');
      const localHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const filteredLocal = localHistory.filter(s => s.id !== sessionId);
      localStorage.setItem(storageKey, JSON.stringify(filteredLocal));

      const legacyHistory = JSON.parse(localStorage.getItem('grabit_history') || '[]');
      const filteredLegacy = legacyHistory.filter(s => s.id !== sessionId);
      localStorage.setItem('grabit_history', JSON.stringify(filteredLegacy));
    } catch (e) {}

    // 2. Cloud Delete if available
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('interviews')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', user.id);
      }
    } catch (e) {}

    return true;
  },

  // --- CHATBOT SESSIONS ---
  getLocalChatSessions(persona = null) {
    try {
      const storageKey = getUserKey('grabit_chat_sessions');
      const all = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (persona) {
        return all.filter(s => s.persona === persona);
      }
      return all;
    } catch (e) {
      return [];
    }
  },

  saveLocalChatSession(session) {
    try {
      const storageKey = getUserKey('grabit_chat_sessions');
      const all = this.getLocalChatSessions();
      const existingIdx = all.findIndex(s => s.id === session.id);
      if (existingIdx >= 0) {
        all[existingIdx] = { ...all[existingIdx], ...session, updated_at: new Date().toISOString() };
      } else {
        all.unshift(session);
      }
      localStorage.setItem(storageKey, JSON.stringify(all));
    } catch (e) {
      console.warn("Failed to save local chat session:", e);
    }
  },

  async createChatSession(persona, messages = []) {
    const userMsg = messages.find(m => m.role === 'user');
    const title = userMsg ? (userMsg.text.substring(0, 30) + (userMsg.text.length > 30 ? "..." : "")) : "New Conversation";
    
    const newSession = {
      id: generateUUID(),
      persona: persona,
      title: title,
      messages: messages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save locally first (Always works!)
    this.saveLocalChatSession(newSession);

    // Sync to Supabase if available
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('chatbot_sessions')
          .insert([{
            id: newSession.id,
            user_id: user.id,
            persona: persona,
            messages: messages,
            title: title
          }])
          .select();
        if (!error && data?.[0]) {
          return data[0];
        }
      }
    } catch (e) {
      console.warn("[grabitApi] Cloud chat save skipped:", e.message);
    }

    return newSession;
  },

  async updateChatSession(sessionId, messages) {
    const userMsg = messages.find(m => m.role === 'user');
    const title = userMsg ? (userMsg.text.substring(0, 30) + (userMsg.text.length > 30 ? "..." : "")) : "New Conversation";

    // Save locally first
    try {
      const storageKey = getUserKey('grabit_chat_sessions');
      const all = this.getLocalChatSessions();
      const idx = all.findIndex(s => s.id === sessionId);
      if (idx >= 0) {
        all[idx].messages = messages;
        all[idx].title = title;
        all[idx].updated_at = new Date().toISOString();
        localStorage.setItem(storageKey, JSON.stringify(all));
      }
    } catch (e) {}

    // Try cloud sync ONLY if sessionId is a valid UUID
    if (isValidUUID(sessionId)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('chatbot_sessions')
            .update({
              messages: messages,
              title: title,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', user.id);
        }
      } catch (e) {}
    }

    return { id: sessionId, messages, title };
  },

  async getChatSessions(persona = null) {
    const local = this.getLocalChatSessions(persona);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let query = supabase
          .from('chatbot_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (persona) {
          query = query.eq('persona', persona);
        }

        const { data, error } = await query;
        if (!error && data) {
          const combined = [...data];
          local.forEach(l => {
            if (!combined.some(c => c.id === l.id)) {
              combined.push(l);
            }
          });
          combined.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
          return combined;
        }
      }
    } catch (e) {
      console.warn("[grabitApi] Cloud chat fetch skipped:", e.message);
    }

    return local;
  },

  async deleteChatSession(sessionId) {
    // Delete from Local Storage first
    try {
      const storageKey = getUserKey('grabit_chat_sessions');
      const all = this.getLocalChatSessions();
      const filtered = all.filter(s => s.id !== sessionId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch (e) {}

    // Try cloud delete ONLY if sessionId is a valid UUID
    if (isValidUUID(sessionId)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('chatbot_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', user.id);
        }
      } catch (e) {}
    }

    return true;
  },

  // --- ROADMAPS ---
  async saveRoadmap(title, roadmapJson) {
    try {
      const storageKey = getUserKey('grabit_roadmap');
      localStorage.setItem(storageKey, JSON.stringify({ title, roadmap_json: roadmapJson, created_at: new Date().toISOString() }));
    } catch (e) {}

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('roadmaps')
          .insert([{
            user_id: user.id,
            title: title,
            roadmap_json: roadmapJson
          }])
          .select();

        if (!error && data?.[0]) return data[0];
      }
    } catch (e) {}

    return { title, roadmap_json: roadmapJson };
  },

  async getLatestRoadmap() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data?.[0]) return data[0];
      }
    } catch (e) {}

    try {
      const storageKey = getUserKey('grabit_roadmap');
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return null;
  },

  // --- DOCUMENTS / RESUMES ---
  async saveDocument(fileName, extractedText, storagePath = null) {
    try {
      const storageKey = getUserKey('grabit_resume_text');
      localStorage.setItem(storageKey, extractedText);
    } catch (e) {}

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_documents')
          .insert([{
            user_id: user.id,
            file_name: fileName,
            storage_path: storagePath,
            extracted_text: extractedText
          }])
          .select();

        if (!error && data?.[0]) return data[0];
      }
    } catch (e) {}

    return { file_name: fileName, extracted_text: extractedText };
  },

  // --- STORAGE / RECORDINGS ---
  async uploadRecording(blob, fileName) {
    if (!blob || blob.size === 0) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const filePath = `${user.id}/${Date.now()}_${fileName}`;
        const { data, error } = await supabase.storage
          .from('interview-recordings')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: blob.type || 'video/webm'
          });

        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('interview-recordings')
            .getPublicUrl(filePath);

          if (publicUrl) return publicUrl;
        } else if (error) {
          console.warn("[grabitApi] Supabase Storage upload skipped:", error.message);
        }
      }
    } catch (e) {
      console.warn("[grabitApi] Supabase Storage upload exception:", e.message);
    }

    // Fallback for local playback: Use Blob Object URL for active tab session or Base64 for tiny clips
    try {
      if (blob.size < 500000) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (dataUrl) return dataUrl;
      }
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn("Video URL fallback warning:", e);
    }

    return null;
  }
};
