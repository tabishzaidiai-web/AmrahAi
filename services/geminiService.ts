
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ProductAnalysis, BrandKit, ShootConfig, ModelPersona, ProductDetails, LuxuryStyle, CameraAngle, CameraMotion, ProductCategory } from "../types";

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
  'watch': 'Horological precision: Emphasis on dial clarity, sapphire glass reflections, and hand positioning.',
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

  static async trainPersonalModel(dataset: string[]): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`personal-${Math.random().toString(36).substring(2, 11)}`);
      }, 3000);
    });
  }

  static async analyzeProduct(imageBase64: string, mimeType: string, brandKit?: BrandKit): Promise<ProductAnalysis> {
    const ai = this.getAi();
    const parts: any[] = [{ inlineData: { data: imageBase64, mimeType } }];
    let brandContext = brandKit ? `Brand: ${brandKit.name}, Tone: ${brandKit.tone}.` : "";
    const prompt = `SYSTEM: PRODUCT-INTELLIGENT AI. TASK: Analyze this product for high-fidelity rendering. IGNORE any people in the image. ${brandContext} OUTPUT: JSON format only.`;
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

  static async suggestCampaignStories(imageBase64: string, brandKit: BrandKit): Promise<{label: string, prompt: string}[]> {
    const ai = this.getAi();
    const prompt = `SYSTEM: LUXURY CAMPAIGN STRATEGIST.
    Analyze the uploaded product image and the brand identity (Maison Name: ${brandKit.name}, Tone: ${brandKit.tone}).
    Provide 4 distinct, high-end campaign narrative suggestions for luxury marketing.
    
    Guidelines:
    1. Modesty: Respect Gulf and international modesty standards.
    2. Luxury: Focus on rich textures, cinematic lighting (Golden Hour, Studio Noir, Dawn), and prestigious environments.
    3. Narrative: Suggestions should vary from "Minimalist Architectural" to "Opulent Heritage".
    
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
      { text: "PRODUCT GROUND TRUTH - IGNORE ALL HUMANS IN THIS IMAGE." }
    ];
    if (brandKit.logoUrl) {
      const logoB64 = brandKit.logoUrl.includes(',') ? brandKit.logoUrl.split(',')[1] : brandKit.logoUrl;
      parts.push({ inlineData: { data: logoB64, mimeType: 'image/png' } }, { text: "MAISON LOGO REFERENCE" });
    }
    
    const scaleClause = `Render the product at realistic scale relative to the human body based on: type = ${productDetails.type}, approx size = ${productDetails.approxSize}, placement = ${productDetails.placement}.`;
    const logoClause = productDetails.addLogo ? `Apply the brand logo at ${productDetails.logoPlacement} in a realistic, proportional way.` : "";
    const styleClause = productDetails.luxuryStyle ? LUXURY_STYLE_PROMPTS[productDetails.luxuryStyle] : "";
    const cameraClause = `Perspective: ${productDetails.cameraAngle || 'Standard'} perspective shot.`;
    const categoryClause = CATEGORY_STYLE_FRAGMENTS[productDetails.category] || "";

    const instruction = `SYSTEM: PRODUCT-INTELLIGENT AI. ZERO ALTERATION MODE. 
    ${MODESTY_SYSTEM_INSTRUCTION}
    Product Fidelity: Preserve product shape and branding from ground truth.
    Scale Realism: ${scaleClause}
    Category Aesthetics: ${categoryClause}
    Style Direction: ${styleClause}
    Camera Angle: ${cameraClause}
    ${logoClause}
    Scene: ${customPrompt}. 
    Maison Style: ${brandKit.tone}.`;
    
    parts.push({ text: instruction });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
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
    
    if (type === 'image') {
      const parts: any[] = [
        { inlineData: { data: config.productImage, mimeType: 'image/png' } },
        { text: "PRODUCT ASSET - IGNORE ALL HUMAN SUBJECTS HERE" }
      ];

      if (config.model) {
        const modelBase64 = await this.urlToBase64(config.model.mainUrl);
        parts.push({ inlineData: { data: modelBase64, mimeType: 'image/png' } }, { text: "LOCKED MODEL IDENTITY SOURCE" });
      }

      const scaleClause = `Render the product at realistic scale: type = ${config.productDetails.type}, placement = ${config.productDetails.placement}.`;
      const logoClause = config.productDetails.addLogo ? `Apply logo at ${config.productDetails.logoPlacement}.` : "";
      const styleClause = config.productDetails.luxuryStyle ? LUXURY_STYLE_PROMPTS[config.productDetails.luxuryStyle] : "";
      const cameraClause = `Perspective: ${config.productDetails.cameraAngle || 'Standard'} perspective shot.`;
      const categoryClause = CATEGORY_STYLE_FRAGMENTS[config.productDetails.category] || "";
      const identityLock = config.model ? `Use a ${config.model.nationality} ${config.model.gender} model. Identity locked to source.` : "";

      const prompt = `SYSTEM: MODEL IDENTITY LOCK & MODESTY PROTOCOL. 
      ${MODESTY_SYSTEM_INSTRUCTION}
      ${identityLock}
      Product: From PRODUCT ASSET only.
      Scale Realism: ${scaleClause}
      Category Aesthetics: ${categoryClause}
      Style Direction: ${styleClause}
      Camera Angle: ${cameraClause}
      ${logoClause}
      Directive: ${config.useCase}. Style: ${brandKit.tone}.`;
      
      parts.push({ text: prompt });

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
      const cameraClause = `Camera style: ${config.productDetails.cameraAngle || 'Standard'}, motion: ${config.productDetails.cameraMotion || 'Static'}. Slow, deliberate, luxury brand film style.`;
      const categoryClause = CATEGORY_STYLE_FRAGMENTS[config.productDetails.category] || "";
      const identityLock = config.model ? `Model: ${config.model.nationality} ${config.model.gender}. Identity locked.` : "";
      const videoPrompt = `Cinematic cinematic sequence. ${MODESTY_SYSTEM_INSTRUCTION} ${identityLock} Category aesthetics: ${categoryClause}. Product type: ${config.productDetails.type}, placement: ${config.productDetails.placement}. ${cameraClause} Directive: ${config.useCase}.`;
      
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

    const scaleClause = `Scale relative to body: type = ${productDetails.type}, placement = ${productDetails.placement}.`;
    const logoClause = productDetails.addLogo ? `Apply logo at ${productDetails.logoPlacement}.` : "";
    const styleClause = productDetails.luxuryStyle ? LUXURY_STYLE_PROMPTS[productDetails.luxuryStyle] : "";
    const cameraClause = `Perspective: ${productDetails.cameraAngle || 'Standard'} perspective shot.`;
    const categoryClause = CATEGORY_STYLE_FRAGMENTS[productDetails.category] || "";

    const instruction = `SYSTEM: CAMPAIGN BUILDER. ZERO DEVIATION MODE.
    ${MODESTY_SYSTEM_INSTRUCTION}
    Product Fidelity: 100% visual fidelity to ALL provided references.
    Scale Realism: ${scaleClause}
    Category Aesthetics: ${categoryClause}
    Style Direction: ${styleClause}
    Camera Angle: ${cameraClause}
    ${logoClause}
    Directive: ${prompt}.
    Maison DNA: ${brandKit.name}.`;
    parts.push({ text: instruction });
    
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
    const cameraClause = `Camera style: ${productDetails.cameraAngle || 'Standard'}, motion: ${productDetails.cameraMotion || 'Static'}.`;
    const categoryClause = CATEGORY_STYLE_FRAGMENTS[productDetails.category] || "";
    const videoPrompt = `${prompt}. ${MODESTY_SYSTEM_INSTRUCTION} Aesthetics: ${categoryClause}. ${cameraClause}`;
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
    const defaultDetails: ProductDetails = { category: 'other', type: 'Other', approxSize: 'Standard', placement: 'Full body', addLogo: false, logoPlacement: 'Chest' };
    return this.generateProductImage(base64, analysis, `REDEFINE: ${editPrompt}`, brandKit, defaultDetails);
  }

  static async generateVideoFromImage(imageBase64: string, prompt: string, onStatus: (m: string) => void): Promise<string> {
    if (!this.validatePrompt(prompt)) throw new Error("AMRAH only supports modest, respectful fashion.");
    const ai = this.getAi();
    const cleanB64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${prompt}. ${MODESTY_SYSTEM_INSTRUCTION}`,
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
