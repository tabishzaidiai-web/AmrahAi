
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ProductAnalysis, BrandKit, ShootConfig, ModelPersona, ProductDetails, LuxuryStyle, CameraAngle, CameraMotion, ProductCategory, LuxuryPhotoshootConfig, AmazonListingSuite } from "../types";

const SAFETY_BLOCKLIST = [
  'naked', 'nude', 'lingerie', 'underwear', 'bikini', 'swimsuit', 'explicit', 
  'erotic', 'sexual', 'porn', 'see-through', 'nsfw', 'reveal', 'chest', 'groin',
  'short skirt', 'mini skirt', 'crop top', 'strapless', 'backless'
];

const MODESTY_SYSTEM_INSTRUCTION = `
MODESTY & REFINEMENT STANDARD:
Always render human models as attractive, well-presented, and modest. 
Clothing must be respectful, with covered shoulders and legs, no transparent or skin-tight garments, and no explicit or suggestive styling.
For Emirati and Gulf female models, use abayas and headscarves with contemporary but modest silhouettes. 
For Emirati and Gulf male models, use traditional Gulf attire such as kandura/thobe and appropriate headwear (Ghutra/Egal).
Ensure diversity across regions, skin tones, and body types while keeping every look within a refined, luxury and modest fashion standard. 
Avoid sexualized poses, exaggerated body features, or provocative expressions.
`;

const PRODUCT_LOCK_PROTOCOL = `
[SYSTEM PROMPT - PRODUCT FIDELITY LOCK]:
Use the uploaded product image as the ABSOLUTE SINGLE SOURCE OF TRUTH. 
DO NOT ALTER, REDESIGN, OR SIMPLIFY ANY PRODUCT DETAILS. 
Preserve exact colors (hex/RGB), fabric textures, material weight, prints, embroidery patterns, beadwork, lace details, logos, and silhouette. 
If a human is visible in the reference image, IGNORE them completely. Treat the upload as a PRODUCT-ONLY reference.

[NEGATIVE PROMPT - HARD CONSTRAINTS]:
DO NOT change garment design, prints, embroidery, or logos. 
DO NOT add or remove patterns, trims, or motifs. 
DO NOT modify color, silhouette, or fabric type. 
NO redesigning, NO artistic liberties, NO simplification of the product.
`;

const PRODUCT_ONLY_CONSTRAINT = `
STRICT PRODUCT-ONLY MODE: 
- Do NOT generate human models, people, hands, faces, or any human presence.
- The product must exist purely as a standalone object in the environment.
- Focus entirely on the background, lighting, and product details.
`;

const PHOTOSHOOT_PLANNER_INSTRUCTION = `
You are the “AMRAH Photoshoot Director” inside AMRAH by Arabian AI.
Your job is to:
1. Plan a complete photoshoot for fashion or products.
2. Convert that plan into a clean, generation-ready brief that another AI will use to create the final assets.

# MODEL REGISTRY PROTOCOL
You manage a catalog of fictional AI models. When a model_id is selected:
- Treat that model’s description as a LOCKED IDENTITY belonging exclusively to AMRAH.
- Repeat the exact fixed identity details in the brief to ensure consistency across poses and lighting.
- Do NOT change ethnicity, age range, or core facial structure.

# RESPONSE FORMAT (MANDATORY)

PART 1 – HUMAN-FRIENDLY PLAN
- Title: short name for the shoot.
- Concept & Mood: 3–6 sentences.
- Location & Background: 3–5 ideas.
- Lighting: 3–5 practical lighting tips.
- Styling / Outfit Notes: key wardrobe, colors, and textures.
- Shot List: at least 6 shots with camera angle, framing, and pose.
- Props & Checklist: bullet list of what to prepare.

PART 2 – GENERATION BRIEF (FOR AI)
Structure this as a single continuous paragraph using this exact template:
“Ultra‑realistic fashion photoshoot of [model_id] – [fixed identity description from model catalog] – wearing [product description], in [location], [lighting style], [camera angle & framing], [mood]. Keep the model’s identity exactly the same as defined for [model_id]. Preserve the real product color, shape, logo and branding.”

Rules:
- Simple, practical language.
- No JSON or code.
- No mention of "Brand DNA" or "Brand identity".
- If the user is vague, ask 1-3 short clarification questions.
- Start PART 2 with the heading: “GENERATION BRIEF:”
`;

const LUXURY_STYLE_PROMPTS: Record<LuxuryStyle, string> = {
  'Standard': '',
  'Signature Jewel Close-Up': 'Intimate close-up of a single fine-jewelry piece on a soft, dark backdrop. Gentle, directional light reveals metal curves and stone facets. Background stays quiet and out of focus so the piece feels like a gallery highlight.',
  'Editorial Portrait With Jewel': 'Refined portrait of a model with calm styling and neutral make-up. The jewel is the focal point, framed near the face or hands. Depth of field is shallow, background soft, overall mood polished and understated.',
  'Curated Display Board': 'Careful arrangement of a small set of pieces on stone, lacquer, or fabric. Side light adds gentle reflections and shadows. Composition feels like a boutique window or gallery tray, minimal props and clear negative space.',
  'Precision Timepiece Focus': 'Close framing on a watch dial and case at realistic size. Glass reflections are clean, details on the face are sharp, background is a smooth gradient or subtle texture. Looks like a high-end catalog image for collectors.'
};

const CATEGORY_STYLE_FRAGMENTS: Record<ProductCategory, string> = {
  'electronics': 'Crisp product shot with realistic proportions and reflections. Clean gradient or desk background, subtle highlights on edges, and clear separation from the background. Do not invent brand logos or user interfaces; keep branding to the uploaded logo or text only.',
  'fragrance': 'Hero shot of the bottle and packaging. Glass and liquid color rendered accurately, labels readable, soft edge lighting, minimal props like stone, fabric, or petals. Background calm and luxurious, so the bottle design stands out.',
  'wellness': 'Clean packshot of the product with clear label and dosage information. Neutral studio background, soft box lighting, gentle shadows. Overall mood trustworthy and professional, avoiding fear, or exaggerated medical effects.',
  'jewelry': 'High-jewelry standard: Emphasis on facet brilliance, metal luster, and pinpoint lighting.',
  'fashion': 'Fashion-first lighting: Accurate fabric drape, color fidelity, and textile texture rendering.',
  'watch': 'Horological precision: Emphasis on dial clarity, person positioning, and light reflections on the crystal.',
  'other': 'Balanced product-first shot on a simple background, with clear shape, material, and branding. Lighting soft and controlled so the product is easy to understand.'
};

export class GeminiService {
  private static getAi() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static validatePrompt(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return !SAFETY_BLOCKLIST.some(term => lower.includes(term));
  }

  private static async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Failed to convert image to base64", e);
      return "";
    }
  }

  private static buildFidelityPrompt(userPrompt: string, analysis: ProductAnalysis, productDetails: ProductDetails, brandKit: BrandKit, modelContext: string = ""): string {
    const isProductOnly = productDetails.renderMode === 'product-only';
    const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;
    const analysisKeys = `PRESERVE KEYS: Type: ${analysis.type}, Material: ${analysis.material}, Color Palette: ${analysis.colorPalette.join(', ')}, Key Features: ${analysis.features.join(', ')}.`;

    return `
${PRODUCT_LOCK_PROTOCOL}
${modeInstruction}

[SCENE PROMPT]:
${userPrompt}. 
Adjust only environment, lighting, and ${isProductOnly ? 'background' : 'model pose'}. 
${modelContext}
Maison Visual Tone: ${brandKit.tone}.

[PRODUCT PRESERVE PROMPT]:
Copy the product EXACTLY from the reference image. 
${analysisKeys}
Preserve exact fabric weave, stitch patterns, 3D floral/lace details, and metallic reflections. 
No hallucinated design elements. 
Branding: ${productDetails.addLogo ? `Apply Maison logo exactly at ${productDetails.logoPlacement}.` : 'Preserve existing branding from reference.'}
`;
  }

  static async trainPersonalModel(images: string[]): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`pm-${Math.random().toString(36).substr(2, 9)}`);
      }, 3000);
    });
  }

  static async generatePhotoshootBrief(
    imageBase64: string,
    mimeType: string,
    userBrief: string,
    brandKit: BrandKit,
    selectedModel: ModelPersona | null
  ): Promise<string> {
    const ai = this.getAi();
    const modelContext = selectedModel 
      ? `TALENT IDENTITY LOCKED: model_id ${selectedModel.id}. Fixed Description: ${selectedModel.defaultPromptFragment}. Facial Features: ${selectedModel.features}. Beauty/Style: ${selectedModel.beautyNotes}.`
      : "No specific model selected yet. Focus on the standalone product and environment.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: `USER BRIEF: ${userBrief}` },
          { text: modelContext },
          { text: PHOTOSHOOT_PLANNER_INSTRUCTION }
        ]
      }
    });
    return response.text || "Failed to orchestrate brief.";
  }

  static async analyzeProduct(imageBase64: string, mimeType: string, brandKit?: BrandKit): Promise<ProductAnalysis> {
    const ai = this.getAi();
    const parts: any[] = [{ inlineData: { data: imageBase64, mimeType } }];
    let brandContext = brandKit ? `Brand Context: ${brandKit.name}. Tone: ${brandKit.tone}.` : "";
    const prompt = `SYSTEM: PRODUCT-INTELLIGENT AI. TASK: Analyze this product for high-fidelity rendering. IGNORE any people or backgrounds in the image—isolate the product mentally. OUTPUT: JSON format only.`;
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            brand: { type: Type.STRING },
            material: { type: Type.STRING },
            colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
            features: { type: Type.ARRAY, items: { type: Type.STRING } },
            visualFidelityKeys: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["type", "brand", "material", "colorPalette", "features", "visualFidelityKeys"]
        }
      }
    });
    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { type: 'Product', brand: 'Unknown', material: 'Standard', colorPalette: [], features: [], visualFidelityKeys: [] };
    }
  }

  static async generateAmazonListingSuitePrompts(
    images: { b64: string, mimeType: string, role: string }[]
  ): Promise<AmazonListingSuite> {
    const ai = this.getAi();
    const parts: any[] = [];
    
    images.forEach(img => {
      parts.push({ inlineData: { data: img.b64, mimeType: img.mimeType } });
      parts.push({ text: `IMAGE ROLE: ${img.role}` });
    });

    const systemInstruction = `
    You are a specialized Amazon Listing Architect. Analyze the provided images to understand the product's 3D volume, texture, and branding. 
    Your goal is to generate 9 distinct Image Generation Prompts that form a cohesive Amazon listing suite.
    Ensure consistent branding and visual fidelity across all 9 slots.
    
    SEQUENCE REQUIREMENTS:
    Slot 1 (Main): Pure white background (RGB 255,255,255), 85% fill, Front View. Meet all Amazon technical requirements.
    Slot 2 (Dimensions): Front View with clean technical measurement overlays and scale cues.
    Slot 3 (Angle): 45-degree isometric view showing depth (inferred from available images).
    Slot 4 (Back): Clean render of the back of the product, focused on labels/text/details.
    Slot 5 (Detail): Extreme macro close-up of the most premium material or unique feature identified.
    Slot 6 (Lifestyle 1): Product in a high-end context (Kitchen/Office/Studio) based on its category.
    Slot 7 (Lifestyle 2): Product in use, showing 'Problem/Solution' or aspirational context.
    Slot 8 (Infographic): Focus on 3 key features identified from the visual analysis.
    Slot 9 (Packaging/Trust): Product displayed with its premium box or a 'Quality Guarantee' badge.

    Force JSON response matching the provided schema. No markdown headers.
    `;
    parts.push({ text: systemInstruction });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            listing_metadata: {
              type: Type.OBJECT,
              properties: {
                product_identified: { type: Type.STRING },
                primary_materials: { type: Type.STRING },
                brand_color_palette: { type: Type.STRING }
              },
              required: ["product_identified", "primary_materials", "brand_color_palette"]
            },
            amazon_suite: {
              type: Type.OBJECT,
              properties: {
                slot_1_main: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] },
                slot_2_dimensions: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] },
                slot_3_isometric: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] },
                slot_4_back_view: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] },
                slot_5_material_detail: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] },
                slot_6_lifestyle_1: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] },
                slot_7_lifestyle_2: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] },
                slot_8_infographic: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] },
                slot_9_brand_trust: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["prompt", "type"] }
              },
              required: [
                "slot_1_main", "slot_2_dimensions", "slot_3_isometric", "slot_4_back_view", 
                "slot_5_material_detail", "slot_6_lifestyle_1", "slot_7_lifestyle_2", 
                "slot_8_infographic", "slot_9_brand_trust"
              ]
            }
          },
          required: ["listing_metadata", "amazon_suite"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Failed to parse Amazon Listing prompts", e);
      throw new Error("Failed to generate Amazon studio suite JSON.");
    }
  }

  static async suggestCampaignStories(imageBase64: string, brandKit: BrandKit): Promise<{label: string, prompt: string}[]> {
    const ai = this.getAi();
    const prompt = `SYSTEM: LUXURY CAMPAIGN STRATEGIST.
    Analyze the uploaded product image and the brand profile (Maison Name: ${brandKit.name}, Tone: ${brandKit.tone}).
    Provide 4 distinct, high-end campaign narrative suggestions for luxury marketing.
    
    Guidelines:
    1. Modesty: Respect Gulf and international modesty standards.
    2. Luxury: Focus on rich textures, cinematic lighting (Golden Hour, Studio Noir, Dawn), and prestigious environments.
    3. Narrative: Suggestions should vary from "Minimalist Architectural" to "Opulent Heritage".
    4. FIDELITY: Always append a protection line: "Important: Keep the product identical to the reference photo. Do not alter any design details or colors."
    
    Output JSON format only: an array of objects with 'label' and 'prompt'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/png' } },
          { text: prompt }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              prompt: { type: Type.STRING }
            },
            required: ["label", "prompt"]
          }
        }
      }
    });
    
    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Failed to parse campaign suggestions", e);
      return [];
    }
  }

  static async generateProductImage(
    baseImage: string, 
    analysis: ProductAnalysis, 
    customPrompt: string,
    brandKit: BrandKit,
    productDetails: ProductDetails,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"
  ): Promise<string> {
    if (!this.validatePrompt(customPrompt)) throw new Error("AMRAH only supports modest, respectful fashion.");

    const ai = this.getAi();
    const parts: any[] = [
      { inlineData: { data: baseImage, mimeType: 'image/png' } },
      { text: "PRODUCT GROUND TRUTH - IGNORE ALL HUMANS/BACKGROUNDS IN THIS IMAGE." }
    ];
    if (brandKit.logoUrl) {
      const logoB64 = brandKit.logoUrl.includes(',') ? brandKit.logoUrl.split(',')[1] : brandKit.logoUrl;
      parts.push({ inlineData: { data: logoB64, mimeType: 'image/png' } }, { text: "MAISON LOGO REFERENCE" });
    }
    
    const finalStructuredPrompt = this.buildFidelityPrompt(customPrompt, analysis, productDetails, brandKit);
    parts.push({ text: finalStructuredPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio } }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Render failed.");
  }

  static async generatePhotoshoot(
    config: ShootConfig,
    brandKit: BrandKit,
    type: 'image' | 'video' = 'image',
    onStatus: (msg: string) => void
  ): Promise<string> {
    if (!this.validatePrompt(config.useCase)) throw new Error("AMRAH only supports modest, respectful fashion.");

    const ai = this.getAi();
    const analysis = await this.analyzeProduct(config.productImage, 'image/png', brandKit);
    
    if (type === 'image') {
      const parts: any[] = [
        { inlineData: { data: config.productImage, mimeType: 'image/png' } },
        { text: "PRODUCT ASSET - IGNORE ALL HUMAN SUBJECTS/BACKGROUNDS HERE" }
      ];

      let modelContext = "";
      if (config.model) {
        const modelBase64 = await this.urlToBase64(config.model.mainUrl);
        parts.push({ inlineData: { data: modelBase64, mimeType: 'image/png' } }, { text: "LOCKED MODEL IDENTITY SOURCE" });
        modelContext = `Use model_id ${config.model.id}. Identity Locked: ${config.model.defaultPromptFragment}. Features: ${config.model.features}.`;
      }

      const finalStructuredPrompt = this.buildFidelityPrompt(config.useCase, analysis, config.productDetails, brandKit, modelContext);
      parts.push({ text: finalStructuredPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: { imageConfig: { aspectRatio: '3:4' } }
      });
      
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Shoot generation failed.");
    } else {
      onStatus("Initializing Motion Flow...");
      const isProductOnly = config.productDetails.renderMode === 'product-only';
      const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;
      const identityLock = config.model && !isProductOnly ? `Model: ${config.model.nationality} ${config.model.gender}. Identity locked.` : "";
      
      const videoPrompt = `
      ${PRODUCT_LOCK_PROTOCOL}
      ${modeInstruction}
      Cinematic cinematic sequence. 
      [SCENE]: ${config.useCase}. ${identityLock} Camera: ${config.productDetails.cameraAngle}, Motion: ${config.productDetails.cameraMotion}.
      [PRESERVE]: Copy product EXACTLY: ${analysis.material}, ${analysis.type}, ${analysis.features.join(', ')}. 
      Never morph fabric or details during movement.
      `;
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        image: { imageBytes: config.productImage, mimeType: 'image/png' },
        config: { 
          numberOfVideos: 1, 
          resolution: config.productDetails.videoResolution || '720p', 
          aspectRatio: config.productDetails.videoAspectRatio || '16:9' 
        }
      });
      while (!operation.done) {
        onStatus("Orchestrating physics...");
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      const link = operation.response?.generatedVideos?.[0]?.video?.uri;
      const res = await fetch(`${link}&key=${process.env.API_KEY}`);
      return URL.createObjectURL(await res.blob());
    }
  }

  static async generateCampaignAsset(
    prompt: string,
    productB64s: (string | null)[],
    brandKit: BrandKit,
    productDetails: ProductDetails,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "16:9",
    imageSize: "1K" | "2K" | "4K" = "1K"
  ): Promise<string> {
    if (!this.validatePrompt(prompt)) throw new Error("AMRAH only supports modest, respectful fashion.");
    const ai = this.getAi();
    const parts: any[] = [];
    
    productB64s.forEach((b64, idx) => {
      if (b64) {
        const cleanB64 = b64.includes(',') ? b64.split(',')[1] : b64;
        const role = idx === 0 ? "PRIMARY FRONT VIEW" : idx === 1 ? "BACK SIDE VIEW" : "DETAIL MACRO REFERENCE";
        parts.push({ inlineData: { data: cleanB64, mimeType: 'image/png' } }, { text: `MASTER PRODUCT ${role}` });
      }
    });

    const analysis = await this.analyzeProduct(productB64s[0]!.split(',')[1], 'image/png', brandKit);
    const finalStructuredPrompt = this.buildFidelityPrompt(prompt, analysis, productDetails, brandKit);
    parts.push({ text: finalStructuredPrompt });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize } }
    });
    
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Campaign failed.");
  }

  static async generateProductVideo(
    base64: string, 
    analysis: ProductAnalysis, 
    prompt: string, 
    brandKit: BrandKit, 
    productDetails: ProductDetails,
    onStatus: (msg: string) => void
  ): Promise<string> {
    if (!this.validatePrompt(prompt)) throw new Error("AMRAH only supports modest, respectful fashion.");
    const ai = this.getAi();
    const isProductOnly = productDetails.renderMode === 'product-only';
    const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;

    const videoPrompt = `
    ${PRODUCT_LOCK_PROTOCOL}
    ${modeInstruction}
    ${prompt}. 
    [PRESERVE]: Absolute fidelity to reference. Material: ${analysis.material}. Features: ${analysis.features.join(', ')}. 
    Movement must be slow luxury pan, no warping of product structure.
    `;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      image: { imageBytes: base64, mimeType: 'image/png' },
      config: { 
        numberOfVideos: 1, 
        resolution: productDetails.videoResolution || '720p', 
        aspectRatio: productDetails.videoAspectRatio || '16:9' 
      }
    });
    while (!operation.done) {
      onStatus("Synthesizing motion...");
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const link = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${link}&key=${process.env.API_KEY}`);
    return URL.createObjectURL(await res.blob());
  }

  static async editProductImage(
    currentImageUrl: string,
    analysis: ProductAnalysis,
    editPrompt: string,
    brandKit: BrandKit
  ): Promise<string> {
    if (!this.validatePrompt(editPrompt)) throw new Error("AMRAH only supports modest, respectful fashion.");
    const base64 = currentImageUrl.includes('base64,') ? currentImageUrl.split(',')[1] : await this.urlToBase64(currentImageUrl);
    const defaultDetails: ProductDetails = { category: 'other', type: 'Other', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest', renderMode: 'product-only' };
    return this.generateProductImage(base64, analysis, `REDEFINE: ${editPrompt}. Important: Keep the core product structure locked.`, brandKit, defaultDetails);
  }

  static async generateVideoFromImage(imageBase64: string, prompt: string, onStatus: (m: string) => void): Promise<string> {
    if (!this.validatePrompt(prompt)) throw new Error("AMRAH only supports modest, respectful fashion.");
    const ai = this.getAi();
    const cleanB64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    // We don't have full analysis here, but we can still enforce the lock
    const videoPrompt = `
    ${PRODUCT_LOCK_PROTOCOL}
    ${MODESTY_SYSTEM_INSTRUCTION}
    ${prompt}. 
    Maintain absolute product fidelity during motion. No morphing or melting of fabric details.
    `;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      image: { imageBytes: cleanB64, mimeType: 'image/png' },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      onStatus("Processing Cinematic Movement...");
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const link = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${link}&key=${process.env.API_KEY}`);
    return URL.createObjectURL(await res.blob());
  }
}
