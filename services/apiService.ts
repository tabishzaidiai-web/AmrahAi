/**
 * AMRAH API SERVICE (LOCAL MODE)
 * This service is stubbed out to bypass backend dependencies.
 * In production, this would call the /api endpoints.
 */
export class ApiService {
  static async generate(type: 'image' | 'video', params: any) {
    console.log(`Local mode: Bypassing backend ${type} request. Handled by client-side GeminiService.`);
    // In local mode, we return a mock success or rely directly on GeminiService inside components
    return { status: 'success', local: true };
  }
}
