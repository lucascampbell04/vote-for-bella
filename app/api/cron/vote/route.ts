import { NextResponse } from "next/server";

/**
 * GET /api/cron/vote
 * Cron job that runs every 5 minutes
 * Has a 1 in 10 chance of triggering a vote
 */
export async function GET(request: Request) {
  try {

    // 1 in 10 chance (10%)
    const randomNumber = Math.floor(Math.random() * 3);
    const shouldVote = randomNumber === 0;

    console.log(`[CRON] Random number: ${randomNumber}, Should vote: ${shouldVote}`);

    if (!shouldVote) {
      return NextResponse.json({
        success: true,
        message: 'Skipped - not triggered this time',
        randomNumber,
      });
    }

    console.log('[CRON] Triggering vote...');
    const voteResponse = await fetch(`https://vote-for-bella.vercel.app/api/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const voteData = await voteResponse.json();

    if (voteResponse.ok) {
      console.log('[CRON] Vote successful:', voteData);
      return NextResponse.json({
        success: true,
        message: 'Vote triggered successfully',
        randomNumber,
        voteResult: voteData,
      });
    } else {
      console.error('[CRON] Vote failed:', voteData);
      return NextResponse.json({
        success: false,
        message: 'Vote failed',
        randomNumber,
        error: voteData,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error },
      { status: 500 }
    );
  }
}

