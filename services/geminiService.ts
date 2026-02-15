import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ProductAnalysis, BrandKit, ShootConfig, ModelPersona, ProductDetails, LuxuryStyle, CameraAngle, CameraMotion, ProductCategory, AmazonListingSuite } from "../types";

const SAFETY_BLOCKLIST = [
  'naked', 'nude', 'lingerie', 'underwear', 'bikini', 'swimsuit', 'explicit', 
  'erotic', 'sexual', 'porn', 'see-through', 'nsfw', 'reveal', 'chest', 'groin',
  'short skirt', 'mini skirt', 'crop top', 'strapless', 'backless'
];

const MODESTY_SYSTEM_INSTRUCTION = `
MODESTY & REFINEMENT STANDARD:
Always render human models as attractive, well-presented, and modest. 
Clothing must be respectful, with covered shoulders and legs, no transparent or skin-tight garments, and no explicit or suggestive styling.
Ensure diversity across regions, skin tones, and body types while keeping every look within a refined, luxury and modest fashion standard. 
Avoid sexualized poses, exaggerated body features, or provocative expressions.
`;

const PRODUCT_LOCK_PROTOCOL = `
[SYSTEM PROMPT - PRODUCT FIDELITY LOCK]:
Use the uploaded product image as the ABSOLUTE SINGLE SOURCE OF TRUTH. 
DO NOT ALTER, REDESIGN, OR SIMPLIFY ANY PRODUCT DETAILS. 
Preserve exact colors (hex/RGB), fabric textures, material weight, prints, embroidery patterns, beadwork, lace details, logos, and silhouette. 
IGNORE any human or background in the original reference—extract the product only.
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
      return null;
    }
  }

  private static buildFidelityPrompt(userPrompt: string, analysis: ProductAnalysis, productDetails: ProductDetails, brandKit: BrandKit, modelContext: string = ""): string {
    const isProductOnly = productDetails.renderMode === 'product-only';
    const analysisKeys = `PRESERVE KEYS: Type: ${analysis.type}, Material: ${analysis.material}, Color Palette: ${analysis.colorPalette.join(', ')}, Key Features: ${analysis.features.join(', ')}.`;
    const cameraContext = productDetails.cameraAngle ? `Camera Perspective: ${productDetails.cameraAngle}.` : "";

    return `
${PRODUCT_LOCK_PROTOCOL}
${isProductOnly ? 'MODE: PRODUCT ONLY. NO HUMANS.' : MODESTY_SYSTEM_INSTRUCTION}

[SCENE PROMPT]:
${userPrompt}. 
${cameraContext}
Adjust only environment and lighting. 
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
    const prompt = `SYSTEM: PRODUCT-INTELLIGENT AI. Analyze this product for high-fidelity rendering. Output JSON format only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: cleanB64, mimeType: mimeType || 'image/png' } },
          { text: prompt }
        ] 
      },
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
    return JSON.parse(response.text || '{}');
  }

  static async suggestPhotoshootPrompts(imageBase64: string, brandKit: BrandKit, analysis?: ProductAnalysis): Promise<{label: string, prompt: string}[]> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
    
    const contextStr = analysis ? `
      PRODUCT CONTEXT:
      Type: ${analysis.type}
      Material: ${analysis.material}
      Colors: ${analysis.colorPalette.join(', ')}
      Features: ${analysis.features.join(', ')}
    ` : "";

    const prompt = `
      SYSTEM: LUXURY CREATIVE DIRECTOR AI. 
      Analyze the product DNA (texture, material, shape) and any provided product analysis.
      ${contextStr}
      Generate 10 distinct photoshoot concepts in a JSON array. 
      Ensure coverage of these specific aesthetics:
      1. Minimalist (Clean, white-space, high-key)
      2. Opulent Arabian (Rich textures, heritage patterns, warm gold lighting)
      3. Desert Cinematic (Golden hour, soft dunes, orange/purple sky)
      4. Modern GCC Urban (Sleek architecture, Dubai skyline, glass/steel)
      5. Heritage Atelier (Dark wood, oil paintings, vintage luxury)
      6. Soft Editorial (Pastel tones, natural window light, floral hints)
      7. High Jewelry Macro (Black velvet, dramatic spotlight, precision focus)
      8. Evening Noir (High contrast, deep shadows, cinematic spotlights)
      9. Coastal Breezy (Soft blue tones, sea salt lighting, Mediterranean vibe)
      10. Royal Portrait (Regal posture, silk backdrops, museum lighting)
      
      Maison Brand Tone: ${brandKit.tone}. 
      Each concept must focus on highlighting the product's specific materials and colors.
      Ensure the prompt specifically mentions how the background lighting interacts with the ${analysis?.material || 'product materials'}.
    `;

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
              label: { type: Type.STRING, description: "The aesthetic name (e.g., 'Opulent Arabian')" },
              prompt: { type: Type.STRING, description: "The full technical AI generation prompt" }
            },
            required: ["label", "prompt"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  }

  static async generatePhotoshoot(
    config: ShootConfig,
    brandKit: BrandKit,
    type: 'image' | 'video' = 'image',
    onStatus: (msg: string) => void
  ): Promise<string> {
    const cleanProductB64 = this.cleanBase64(config.productImage);
    const analysis = await this.analyzeProduct(cleanProductB64, 'image/png', brandKit);
    
    if (type === 'image') {
      const ai = this.getAi();
      const parts: any[] = [
        { inlineData: { data: cleanProductB64, mimeType: 'image/png' } },
        { text: "REFERENCE" }
      ];

      let modelContext = "";
      if (config.model) {
        const modelBase64 = await this.urlToBase64(config.model.mainUrl);
        if (modelBase64) {
          parts.push({ inlineData: { data: modelBase64, mimeType: 'image/png' } }, { text: "MODEL" });
        }
        modelContext = `Model Identity: ${config.model.name}.`;
      }

      const finalStructuredPrompt = this.buildFidelityPrompt(config.useCase, analysis, config.productDetails, brandKit, modelContext);
      parts.push({ text: finalStructuredPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: { imageConfig: { aspectRatio: '3:4' } }
      });
      
      const part = response.candidates[0].content.parts.find(p => p.inlineData);
      if (part) return `data:image/png;base64,${part.inlineData.data}`;
      throw new Error("Generation failed.");
    } else {
      onStatus("Initializing Motion...");
      const ai = this.getAi();
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: config.useCase,
        image: { imageBytes: cleanProductB64, mimeType: 'image/png' },
        config: { 
          numberOfVideos: 1, 
          resolution: config.productDetails.videoResolution || '720p', 
          aspectRatio: config.productDetails.videoAspectRatio || '16:9' 
        }
      });

      while (!operation.done) {
        onStatus("Synthesizing frames...");
        await new Promise(r => setTimeout(r, 10000));
        operation = await this.getAi().operations.getVideosOperation({ operation: operation });
      }

      const link = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (link) {
        const res = await fetch(`${link}&key=${process.env.API_KEY}`);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
      throw new Error("Video failed.");
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
    const ai = this.getAi();
    const cleanBaseB64 = this.cleanBase64(baseImage);
    const finalStructuredPrompt = this.buildFidelityPrompt(customPrompt, analysis, productDetails, brandKit);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [
          { inlineData: { data: cleanBaseB64, mimeType: 'image/png' } },
          { text: finalStructuredPrompt }
        ] 
      },
      config: { imageConfig: { aspectRatio } }
    });

    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
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
    const ai = this.getAi();
    const firstProductB64 = this.cleanBase64(productB64s[0]!);
    const analysis = await this.analyzeProduct(firstProductB64, 'image/png', brandKit);
    const finalStructuredPrompt = this.buildFidelityPrompt(prompt, analysis, productDetails, brandKit);
    
    // Explicitly type parts as any[] to allow pushing mixed text and image parts
    const parts: any[] = productB64s.filter(b => b).map(b => ({ inlineData: { data: this.cleanBase64(b!), mimeType: 'image/png' } }));
    parts.push({ text: finalStructuredPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize } }
    });
    
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
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
    const cleanB64 = this.cleanBase64(base64);
    const ai = this.getAi();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: { imageBytes: cleanB64, mimeType: 'image/png' },
      config: { 
        numberOfVideos: 1, 
        resolution: productDetails.videoResolution || '720p', 
        aspectRatio: productDetails.videoAspectRatio || '16:9' 
      }
    });

    while (!operation.done) {
      onStatus("Synthesizing motion...");
      await new Promise(r => setTimeout(r, 10000));
      operation = await this.getAi().operations.getVideosOperation({ operation: operation });
    }

    const link = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (link) {
      const res = await fetch(`${link}&key=${process.env.API_KEY}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
    throw new Error("Video synthesis failed.");
  }

  static async generateAmazonListingSuitePrompts(activeImages: { b64: string, mimeType: string, role: string }[]): Promise<AmazonListingSuite> {
    const ai = this.getAi();
    // Explicitly type parts as any[] to allow pushing mixed text and image parts
    const parts: any[] = activeImages.map(img => ({ inlineData: { data: this.cleanBase64(img.b64), mimeType: img.mimeType || 'image/png' } }));
    parts.push({ text: `SYSTEM: AMAZON STRATEGIST. Analyze product and create 9 listing prompts. JSON output.` });

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
              }
            },
            amazon_suite: {
              type: Type.OBJECT,
              properties: {
                slot_1_main: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_2_dimensions: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_3_isometric: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_4_back_view: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_5_material_detail: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_6_lifestyle_1: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_7_lifestyle_2: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_8_infographic: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_9_brand_trust: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }

  // Added suggestCampaignStories for campaign orchestrator logic
  static async suggestCampaignStories(imageBase64: string, brandKit: BrandKit): Promise<{label: string, prompt: string}[]> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
    const prompt = `SYSTEM: CAMPAIGN STRATEGIST AI. Analyze product for campaign narratives. Maison Tone: ${brandKit.tone}. Generate 4 campaign concepts. JSON array output.`;

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
    return JSON.parse(response.text || '[]');
  }

  // Added editProductImage for neural redefinition and AI refining
  static async editProductImage(imageSource: string, analysis: ProductAnalysis, prompt: string, brandKit: BrandKit): Promise<string> {
    const ai = this.getAi();
    let cleanB64 = "";
    if (imageSource.startsWith('data:')) {
      cleanB64 = this.cleanBase64(imageSource);
    } else if (imageSource.startsWith('http')) {
      cleanB64 = await this.urlToBase64(imageSource) || "";
    } else {
      cleanB64 = this.cleanBase64(imageSource);
    }

    const finalStructuredPrompt = `
${PRODUCT_LOCK_PROTOCOL}
${MODESTY_SYSTEM_INSTRUCTION}

[NEURAL REFINEMENT DIRECTIVE]:
${prompt}.

[PRODUCT FIDELITY PRESERVATION]:
Maison Product DNA: ${analysis.type}, ${analysis.material}. 
Visual Keys: ${analysis.visualFidelityKeys.join(', ')}.
DO NOT change the core structure of the product. ONLY add requested embellishments or background transformations.
`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanB64, mimeType: 'image/png' } },
          { text: finalStructuredPrompt }
        ]
      }
    });
    
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Neural edit failed.");
  }

  // Added trainPersonalModel to simulate user identity calibration
  static async trainPersonalModel(dataset: string[]): Promise<string> {
    // Conceptual identity training for high-fidelity Maison twins
    return "identity-" + Math.random().toString(36).substr(2, 9);
  }

  // Added generatePhotoshootBrief for the Photoshoot Planner component
  static async generatePhotoshootBrief(imageBase64: string, mimeType: string, userBrief: string, brandKit: BrandKit, model?: ModelPersona | null): Promise<string> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
    const modelContext = model ? `Selected Model identity: ${model.name}, features: ${model.features}.` : "No specific model casting.";
    const prompt = `SYSTEM: LUXURY PHOTOSHOOT PLANNER. Analyze product and user vision. Maison Tone: ${brandKit.tone}. ${modelContext} User Vision: ${userBrief}. Generate a professional production plan and a detailed technical AI GENERATION BRIEF.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: cleanB64, mimeType: mimeType || 'image/png' } },
          { text: prompt }
        ] 
      }
    });
    return response.text || "Assistant brief synthesis failed.";
  }
}
