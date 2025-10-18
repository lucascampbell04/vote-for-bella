import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('[CRON] Starting 3 sequential votes');

    const results = [];

    for (let i = 1; i <= 3; i++) {
      try {
        const voteResponse = await fetch(`https://vote-for-bella.vercel.app/api/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const voteData = await voteResponse.json();

        if (voteResponse.ok) {
          console.log(`[CRON] Vote ${i} successful:`, voteData);
          results.push({ attempt: i, success: true, data: voteData });
        } else {
          console.error(`[CRON] Vote ${i} failed:`, voteData);
          results.push({ attempt: i, success: false, error: voteData });
        }
      } catch (error) {
        console.error(`[CRON] Vote ${i} error:`, error);
        results.push({ attempt: i, success: false, error: String(error) });
      }

      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Completed 3 vote attempts - ${successCount} successful`,
      results,
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error },
      { status: 500 }
    );
  }
}

