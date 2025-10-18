import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: Request) {
  try {
    console.log('[CRON] Starting 3 staggered votes');

    const votePromises = [];

    for (let i = 1; i <= 3; i++) {
      const votePromise = (async () => {
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
            return { attempt: i, success: true, data: voteData };
          } else {
            console.error(`[CRON] Vote ${i} failed:`, voteData);
            return { attempt: i, success: false, error: voteData };
          }
        } catch (error) {
          console.error(`[CRON] Vote ${i} error:`, error);
          return { attempt: i, success: false, error: String(error) };
        }
      })();

      votePromises.push(votePromise);

      if (i < 3) {
        await delay(5000);
      }
    }

    const results = await Promise.all(votePromises);
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

