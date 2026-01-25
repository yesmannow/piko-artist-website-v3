import { NextRequest, NextResponse } from 'next/server';

/**
 * Cyanite.ai Recommendations API Route
 * 
 * Accepts BPM and energy, returns track recommendations from Cyanite.ai
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bpm, energy } = body;

    // Validate input
    if (typeof bpm !== 'number' || bpm <= 0 || bpm > 300) {
      return NextResponse.json(
        { error: 'Invalid BPM. Must be a number between 0 and 300.' },
        { status: 400 }
      );
    }

    if (typeof energy !== 'number' || energy < 0 || energy > 1) {
      return NextResponse.json(
        { error: 'Invalid energy. Must be a number between 0 and 1.' },
        { status: 400 }
      );
    }

    const apiToken = process.env.CYANITE_API_TOKEN;
    if (!apiToken || apiToken === 'your_cyanite_token') {
      console.warn('[Cyanite API] CYANITE_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Cyanite.ai API token not configured. Please add CYANITE_API_TOKEN to your .env.local file.' },
        { status: 503 }
      );
    }

    // GraphQL query for Cyanite.ai
    const query = `
      query SuggestTracks($bpmMin: Float, $bpmMax: Float) {
        libraryTracks(
          filter: {
            audioAnalysis: {
              bpm: { min: $bpmMin, max: $bpmMax }
            }
          }
          first: 5
        ) {
          edges {
            node {
              id
              title
              artist
              audioAnalysisV6 {
                bpm
                key
                mood {
                  aggressive
                  chill
                }
              }
            }
          }
        }
      }
    `;

    // Calculate BPM range (±10)
    const bpmMin = Math.max(60, bpm - 10);
    const bpmMax = Math.min(200, bpm + 10);

    // Make GraphQL request to Cyanite.ai
    const response = await fetch('https://api.cyanite.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          bpmMin,
          bpmMax,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cyanite API] Request failed:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error('[Cyanite API] GraphQL errors:', data.errors);
      return NextResponse.json(
        { error: 'GraphQL query failed', details: data.errors },
        { status: 500 }
      );
    }

    // Format recommendations
    interface CyaniteEdge {
      node: {
        id: string;
        title?: string;
        artist?: string;
        audioAnalysisV6?: {
          bpm?: number;
          key?: string;
          mood?: {
            aggressive?: number;
            chill?: number;
          };
        };
      };
    }
    const recommendations = (data.data?.libraryTracks?.edges as CyaniteEdge[] | undefined)?.map((edge) => ({
      id: edge.node.id,
      title: edge.node.title || 'Unknown',
      artist: edge.node.artist || 'Unknown',
      bpm: edge.node.audioAnalysisV6?.bpm || bpm,
      key: edge.node.audioAnalysisV6?.key || '',
      mood: {
        aggressive: edge.node.audioAnalysisV6?.mood?.aggressive || 0,
        chill: edge.node.audioAnalysisV6?.mood?.chill || 0,
      },
    })) || [];

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('[Cyanite API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
