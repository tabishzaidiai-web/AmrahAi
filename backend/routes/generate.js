const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/check-quota-and-generate', async (req, res) => {
  const { type, params } = req.body;
  const userId = req.user.id;

  // 1. Check user quota
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return res.status(500).json({ message: 'Profile error' });

  if (profile.plan === 'Free') {
    const used = type === 'image' ? profile.images_used : profile.videos_used;
    if (used >= 3) return res.status(402).json({ code: 'quota_exceeded' });
  }

  // 2. Perform Generation
  try {
    let result;
    if (type === 'image') {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: params.contents,
        config: params.config
      });
      result = response.text; // Simplification
    } else {
      // Video generation logic
    }

    // 3. Increment usage
    const updateField = type === 'image' ? 'images_used' : 'videos_used';
    await supabase.from('users').update({
      [updateField]: profile[updateField] + 1
    }).eq('id', userId);

    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
