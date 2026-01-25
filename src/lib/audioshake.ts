/**
 * AudioShake API Utility
 * 
 * Functions for requesting stem separation and checking task status
 */

const AUDIOSHAKE_API_URL = 'https://api.audioshake.ai/v1';

export interface StemTask {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stems?: {
    vocals?: string;
    drums?: string;
    bass?: string;
    other?: string;
  };
}

/**
 * Request stem separation from AudioShake
 * @param fileUrl - URL of the audio file to separate
 * @param trackId - Unique identifier for the track
 * @returns Task ID for status polling
 */
export async function requestStems(fileUrl: string, trackId: string): Promise<string> {
  const apiKey = process.env.AUDIOSHAKE_API_KEY;
  
  if (!apiKey || apiKey === 'your_audioshake_key') {
    throw new Error('AUDIOSHAKE_API_KEY not configured. Please add AUDIOSHAKE_API_KEY to your .env.local file.');
  }

  try {
    const response = await fetch(`${AUDIOSHAKE_API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sourceUrl: fileUrl,
        trackId,
        stems: ['vocals', 'drums', 'bass', 'other'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.taskId;
  } catch (error) {
    console.error('[AudioShake] Failed to request stems:', error);
    throw error;
  }
}

/**
 * Check status of stem separation task
 * @param taskId - Task ID returned from requestStems
 * @returns Task status and stem URLs when complete
 */
export async function checkStatus(taskId: string): Promise<StemTask> {
  const apiKey = process.env.AUDIOSHAKE_API_KEY;
  
  if (!apiKey || apiKey === 'your_audioshake_key') {
    throw new Error('AUDIOSHAKE_API_KEY not configured. Please add AUDIOSHAKE_API_KEY to your .env.local file.');
  }

  try {
    const response = await fetch(`${AUDIOSHAKE_API_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      taskId: data.taskId,
      status: data.status,
      stems: data.stems ? {
        vocals: data.stems.vocals?.url,
        drums: data.stems.drums?.url,
        bass: data.stems.bass?.url,
        other: data.stems.other?.url,
      } : undefined,
    };
  } catch (error) {
    console.error('[AudioShake] Failed to check status:', error);
    throw error;
  }
}
