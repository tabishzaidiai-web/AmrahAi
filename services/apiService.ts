import { supabase } from '../lib/supabaseClient';

export class ApiService {
  static async generate(type: 'image' | 'video', params: any) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) throw new Error('Authentication required');

    const response = await fetch('/api/check-quota-and-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ type, params })
    });

    if (response.status === 402) {
      const error = new Error('Quota exceeded');
      (error as any).code = 'quota_exceeded';
      throw error;
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Generation failed');
    }

    return await response.json();
  }
}
