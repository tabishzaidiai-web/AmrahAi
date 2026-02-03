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

export class GeminiService {
  private static getAi() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static cleanBase64(b64: string): string {
    if (!b64) return "";
    return b64.includes(",") ? b64.split(",")[1].trim() : b64.trim();
  }

  private static validatePrompt(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return !SAFETY_BLOCKLIST.some(term => lower.includes(term));
  }

  private static async urlToBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url).catch(() => null);
      if (!response || !response.ok) return null;
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(this.cleanBase64(res));
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Could not convert image to base64, likely CORS:", url);
      return null;
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

  static async analyzeProduct(imageBase64: string, mimeType: string, brandKit?: BrandKit): Promise<ProductAnalysis> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
    const parts: any[] = [{ inlineData: { data: cleanB64, mimeType: mimeType || 'image/png' } }];
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

  static async suggestPhotoshootPrompts(imageBase64: string, brandKit: BrandKit): Promise<{label: string, prompt: string}[]> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
    const prompt = `SYSTEM: LUXURY CREATIVE DIRECTOR AI.
    Analyze the product in the image.
    Maison Name: ${brandKit.name}, Tone: ${brandKit.tone}.
    
    TASK: Generate 4 unique, elite photoshoot narrative prompts.
    Concepts should sound like professional director cues for high-end campaigns.
    Incorporate cinematic lighting (e.g., chiaroscuro, volumetric, Rembrandt), architectural textures (limestone, marble, silk drapes), and specific environments (Dubai Penthouse, Louvre Abu Dhabi, desert dunes at dusk).
    Ensure results are MODEST, LUXURIOUS, and BRAND-SAFE.
    
    CRITICAL PROTECTION: Each prompt must conclude with: "Important: Keep the product 100% identical to the reference asset."
    
    Output JSON format: Array of objects with 'label' (short title) and 'prompt' (detailed cue).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: cleanB64, mimeType: 'image/png' } },
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
      return [];
    }
  }

  static async generatePhotoshoot(
    config: ShootConfig,
    brandKit: BrandKit,
    type: 'image' | 'video' = 'image',
    onStatus: (msg: string) => void
  ): Promise<string> {
    if (!this.validatePrompt(config.useCase)) throw new Error("AMRAH only supports modest, respectful fashion.");

    const cleanProductB64 = this.cleanBase64(config.productImage);
    const analysis = await this.analyzeProduct(cleanProductB64, 'image/png', brandKit);
    
    if (type === 'image') {
      const ai = this.getAi();
      const parts: any[] = [
        { inlineData: { data: cleanProductB64, mimeType: 'image/png' } },
        { text: "PRODUCT ASSET - IGNORE ALL HUMAN SUBJECTS/BACKGROUNDS HERE" }
      ];

      let modelContext = "";
      if (config.model) {
        const modelBase64 = await this.urlToBase64(config.model.mainUrl);
        if (modelBase64) {
          parts.push({ inlineData: { data: modelBase64, mimeType: 'image/png' } }, { text: "LOCKED MODEL IDENTITY SOURCE" });
        }
        modelContext = `Use model_id ${config.model.id}. Identity Locked: ${config.model.defaultPromptFragment}. Features: ${config.model.features}. Nationality: ${config.model.nationality}.`;
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
      const identityLock = config.model && !isProductOnly ? `Model: ${config.model.name}, ${config.model.nationality} ${config.model.gender}. Features: ${config.model.features}. Identity locked.` : "";
      
      const videoPrompt = `
      ${PRODUCT_LOCK_PROTOCOL}
      ${modeInstruction}
      Cinematic luxury film sequence. 
      [SCENE]: ${config.useCase}. ${identityLock} Camera: ${config.productDetails.cameraAngle}, Motion: ${config.productDetails.cameraMotion}.
      [PRESERVE]: Copy product EXACTLY: ${analysis.material}, ${analysis.type}, ${analysis.features.join(', ')}. 
      Focus on hyper-realistic movement and cinematic lighting.
      `;
      
      const ai = this.getAi();
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        image: { imageBytes: cleanProductB64, mimeType: 'image/png' },
        config: { 
          numberOfVideos: 1, 
          resolution: config.productDetails.videoResolution || '720p', 
          aspectRatio: config.productDetails.videoAspectRatio || '16:9' 
        }
      });

      while (!operation.done) {
        onStatus("Synthesizing cinematic frames...");
        await new Promise(r => setTimeout(r, 10000));
        const pollAi = this.getAi();
        operation = await pollAi.operations.getVideosOperation({ operation: operation });
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const link = operation.response.generatedVideos[0].video.uri;
        const separator = link.includes('?') ? '&' : '?';
        const res = await fetch(`${link}${separator}key=${process.env.API_KEY}`);
        if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
      throw new Error("Video synthesis failed.");
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
    const cleanBaseB64 = this.cleanBase64(baseImage);
    const parts: any[] = [
      { inlineData: { data: cleanBaseB64, mimeType: 'image/png' } },
      { text: "PRODUCT GROUND TRUTH - IGNORE ALL HUMANS/BACKGROUNDS IN THIS IMAGE." }
    ];
    
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
        const cleanB64 = this.cleanBase64(b64);
        const role = idx === 0 ? "PRIMARY FRONT VIEW" : idx === 1 ? "BACK SIDE VIEW" : "DETAIL MACRO REFERENCE";
        parts.push({ inlineData: { data: cleanB64, mimeType: 'image/png' } }, { text: `MASTER PRODUCT ${role}` });
      }
    });

    const firstProductB64 = this.cleanBase64(productB64s[0]!);
    const analysis = await this.analyzeProduct(firstProductB64, 'image/png', brandKit);
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
    const cleanB64 = this.cleanBase64(base64);
    const isProductOnly = productDetails.renderMode === 'product-only';
    const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;

    const videoPrompt = `
    ${PRODUCT_LOCK_PROTOCOL}
    ${modeInstruction}
    ${prompt}. 
    [PRESERVE]: Absolute fidelity to reference. Material: ${analysis.material}. Features: ${analysis.features.join(', ')}. 
    Cinematic luxury camera motion, professional film lighting.
    `;

    const ai = this.getAi();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      image: { imageBytes: cleanB64, mimeType: 'image/png' },
      config: { 
        numberOfVideos: 1, 
        resolution: productDetails.videoResolution || '720p', 
        aspectRatio: productDetails.videoAspectRatio || '16:9' 
      }
    });

    while (!operation.done) {
      onStatus("Synthesizing cinematic motion...");
      await new Promise(r => setTimeout(r, 10000));
      const pollAi = this.getAi();
      operation = await pollAi.operations.getVideosOperation({ operation: operation });
    }

    if (operation.response?.generatedVideos?.[0]?.video?.uri) {
      const link = operation.response.generatedVideos[0].video.uri;
      const separator = link.includes('?') ? '&' : '?';
      const res = await fetch(`${link}${separator}key=${process.env.API_KEY}`);
      if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
    throw new Error("Video synthesis failed.");
  }

  static async editProductImage(
    currentImageUrl: string,
    analysis: ProductAnalysis,
    editPrompt: string,
    brandKit: BrandKit
  ): Promise<string> {
    if (!this.validatePrompt(editPrompt)) throw new Error("AMRAH only supports modest, respectful fashion.");
    let base64: string | null = "";
    if (currentImageUrl.includes('base64,')) {
      base64 = this.cleanBase64(currentImageUrl);
    } else {
      base64 = await this.urlToBase64(currentImageUrl);
    }
    if (!base64) throw new Error("Failed to process current image for editing.");

    const defaultDetails: ProductDetails = { category: 'other', type: 'Other', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest', renderMode: 'product-only' };
    return this.generateProductImage(base64, analysis, `REDEFINE: ${editPrompt}. Important: Keep the core product structure locked.`, brandKit, defaultDetails);
  }

  static async suggestCampaignStories(imageBase64: string, brandKit: BrandKit): Promise<{label: string, prompt: string}[]> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
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
          { inlineData: { data: cleanB64, mimeType: 'image/png' } },
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
      return [];
    }
  }

  static async trainPersonalModel(dataset: string[]): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`twin-${Math.random().toString(36).substring(2, 9)}`);
      }, 3000);
    });
  }

  static async generatePhotoshootBrief(
    base64: string,
    mimeType: string,
    userBrief: string,
    brandKit: BrandKit,
    selectedModel: ModelPersona | null
  ): Promise<string> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(base64);
    const modelContext = selectedModel ? `Model: ${selectedModel.name}, Features: ${selectedModel.features}.` : "No specific model.";
    
    const prompt = `SYSTEM: LUXURY PHOTOSHOOT PLANNER.
    Brand: ${brandKit.name}, Tone: ${brandKit.tone}.
    User Directive: ${userBrief}
    ${modelContext}
    
    TASK: Provide a professional photoshoot plan (human-readable) AND a specific AI prompt.
    Format your response as follows:
    [Human readable plan with headings for Lighting, Background, and Styling]
    ...
    GENERATION BRIEF:
    [A single, dense, high-fidelity AI prompt for generating the image]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: cleanB64, mimeType: mimeType || 'image/png' } },
          { text: prompt }
        ]
      }
    });
    return response.text || "";
  }

  static async generateAmazonListingSuitePrompts(activeImages: { b64: string, mimeType: string, role: string }[]): Promise<AmazonListingSuite> {
    const ai = this.getAi();
    const parts: any[] = activeImages.map(img => ({
      inlineData: { data: this.cleanBase64(img.b64), mimeType: img.mimeType || 'image/png' }
    }));
    
    parts.push({ text: `SYSTEM: AMAZON E-COMMERCE STRATEGIST.
    Analyze the uploaded product images. 
    Create a 9-slot cohesive listing suite following Amazon best practices.
    
    Output JSON format only.` });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
      throw new Error("Failed to parse Amazon Suite JSON.");
    }
  }
}