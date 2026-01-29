
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

const PRODUCT_ONLY_CONSTRAINT = `
STRICT PRODUCT-ONLY MODE: 
- Do NOT generate human models, people, hands, faces, or any human presence.
- The product must exist purely as a standalone object in the environment.
- Focus entirely on the background, lighting, and product details.
`;

const PHOTOSHOOT_PLANNER_INSTRUCTION = `
You are “AMRAH Photoshoot Director” inside the AMRAH by Arabian AI app.
Your job is to plan a complete photoshoot for fashion or products and convert that plan into a clean, generation-ready brief.

Always respond in TWO parts:

PART 1 – HUMAN-FRIENDLY PLAN
- Title: a short name for the shoot.
- Concept & Mood: 3–6 sentences.
- Location & Background: 3–5 ideas.
- Lighting: 3–5 practical lighting tips.
- Styling / Outfit Notes: key wardrobe, colors, and textures.
- Shot List: at least 6 shots with camera angle, framing, and pose.
- Props & Checklist: bullet list of what to prepare.

PART 2 – GENERATION BRIEF (FOR AI)
Write a single, compact prompt that another AI image/video model can use to generate the shoot.
Include: model description (age range, gender, ethnicity), environment, mood, camera angle, framing, lighting, and styling.
Explicitly mention that the AI must keep the product’s real color, shape, logo, and branding.
Remove all internal notes, keep it as one continuous prompt paragraph.
Start this section with the heading: “GENERATION BRIEF:”

Rules:
1. Don’t show JSON or code.
2. Ask 1–3 short clarification questions if the user is too vague.
3. Keep language simple and practical for beginners.
4. Ensure 100% visual fidelity for the product.
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
    brandKit: BrandKit
  ): Promise<string> {
    const ai = this.getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: `MAISON IDENTITY: ${brandKit.name}, Tone: ${brandKit.tone}.` },
          { text: `USER BRIEF: ${userBrief}` },
          { text: PHOTOSHOOT_PLANNER_INSTRUCTION }
        ]
      }
    });
    return response.text || "Failed to orchestrate brief.";
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
    
    const isProductOnly = productDetails.renderMode === 'product-only';
    const scaleClause = `Render the product at realistic scale relative to the human body based on: type = ${productDetails.type}, approx size = ${productDetails.approxSize}, placement = ${productDetails.placement}.`;
    const logoClause = productDetails.addLogo ? `[LOGO PROTOCOL]: realistically apply the provided Maison brand logo at the ${productDetails.logoPlacement} placement. Preserve exact logo shape, color, and design fidelity. Assume all ownership rights for this logo application.` : "";
    const styleClause = productDetails.luxuryStyle ? LUXURY_STYLE_PROMPTS[productDetails.luxuryStyle] : "";
    const cameraClause = `Perspective: ${productDetails.cameraAngle || 'Standard'} perspective shot.`;
    const categoryClause = CATEGORY_STYLE_FRAGMENTS[productDetails.category] || "";
    const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;

    const isAmazonMain = customPrompt.includes("RGB 255,255,255");
    const techConstraint = isAmazonMain ? "CRITICAL: The background must be PURE WHITE (RGB 255, 255, 255) with NO shadows stretching to edges." : "";

    const instruction = `SYSTEM: PRODUCT-INTELLIGENT AI. ZERO ALTERATION MODE. 
    ${modeInstruction}
    ${techConstraint}
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
    
    if (type === 'image') {
      const parts: any[] = [
        { inlineData: { data: config.productImage, mimeType: 'image/png' } },
        { text: "PRODUCT ASSET - IGNORE ALL HUMAN SUBJECTS HERE" }
      ];

      if (config.model) {
        const modelBase64 = await this.urlToBase64(config.model.mainUrl);
        parts.push({ inlineData: { data: modelBase64, mimeType: 'image/png' } }, { text: "LOCKED MODEL IDENTITY SOURCE" });
      }

      const isProductOnly = config.productDetails.renderMode === 'product-only';
      const scaleClause = `Render the product at realistic scale: type = ${config.productDetails.type}, placement = ${config.productDetails.placement}.`;
      const logoClause = config.productDetails.addLogo ? `[LOGO PROTOCOL]: realistically apply the provided Maison brand logo at ${config.productDetails.logoPlacement}. Preserve exact shape, color, and design. Assume all ownership rights.` : "";
      const styleClause = config.productDetails.luxuryStyle ? LUXURY_STYLE_PROMPTS[config.productDetails.luxuryStyle] : "";
      const cameraClause = `Perspective: ${config.productDetails.cameraAngle || 'Standard'} perspective shot.`;
      const categoryClause = CATEGORY_STYLE_FRAGMENTS[config.productDetails.category] || "";
      const identityLock = config.model && !isProductOnly ? `Use a ${config.model.nationality} ${config.model.gender} model. Identity locked to source.` : "";
      const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;

      const prompt = `SYSTEM: MODEL IDENTITY LOCK & MODESTY PROTOCOL. 
      ${modeInstruction}
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
      const isProductOnly = config.productDetails.renderMode === 'product-only';
      const cameraClause = `Camera style: ${config.productDetails.cameraAngle || 'Standard'}, motion: ${config.productDetails.cameraMotion || 'Static'}. Slow, deliberate, luxury brand film style.`;
      const categoryClause = CATEGORY_STYLE_FRAGMENTS[config.productDetails.category] || "";
      const identityLock = config.model && !isProductOnly ? `Model: ${config.model.nationality} ${config.model.gender}. Identity locked.` : "";
      const logoClause = config.productDetails.addLogo ? `Realistic brand logo at ${config.productDetails.logoPlacement}, preserving shape and color.` : "";
      const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;
      
      const videoPrompt = `Cinematic cinematic sequence. ${modeInstruction} ${identityLock} Category aesthetics: ${categoryClause}. Product type: ${config.productDetails.type}, placement: ${config.productDetails.placement}. ${cameraClause} ${logoClause} Directive: ${config.useCase}.`;
      
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

    const isProductOnly = productDetails.renderMode === 'product-only';
    const scaleClause = `Scale relative to body: type = ${productDetails.type}, placement = ${productDetails.placement}.`;
    const logoClause = productDetails.addLogo ? `[LOGO PROTOCOL]: apply Maison brand logo at ${productDetails.logoPlacement}, exact shape and color preservation. Assume ownership rights.` : "";
    const styleClause = productDetails.luxuryStyle ? LUXURY_STYLE_PROMPTS[productDetails.luxuryStyle] : "";
    const cameraClause = `Perspective: ${productDetails.cameraAngle || 'Standard'} perspective shot.`;
    const categoryClause = CATEGORY_STYLE_FRAGMENTS[productDetails.category] || "";
    const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;

    const instruction = `SYSTEM: CAMPAIGN BUILDER. ZERO DEVIATION MODE.
    ${modeInstruction}
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
    const isProductOnly = productDetails.renderMode === 'product-only';
    const cameraClause = `Camera style: ${productDetails.cameraAngle || 'Standard'}, motion: ${productDetails.cameraMotion || 'Static'}.`;
    const categoryClause = CATEGORY_STYLE_FRAGMENTS[productDetails.category] || "";
    const logoClause = productDetails.addLogo ? `Apply Maison brand logo at ${productDetails.logoPlacement}, preserving shape and color.` : "";
    const modeInstruction = isProductOnly ? PRODUCT_ONLY_CONSTRAINT : MODESTY_SYSTEM_INSTRUCTION;

    const videoPrompt = `${prompt}. ${modeInstruction} Aesthetics: ${categoryClause}. ${cameraClause} ${logoClause}`;
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
