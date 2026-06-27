import { NextResponse } from "next/server";
import { runSync } from "@/lib/episode-sync";

/**
 * Daily episode sync cron.
 * Triggered by Vercel Cron at the schedule in vercel.json.
 *
 * Auth: Vercel Cron sends an Authorization header with the CRON_SECRET env var.
 * Requests without the correct secret are rejected — this prevents anyone
 * from triggering a sync by hitting the endpoint directly.
 *
 * Logs are visible in the Vercel dashboard under Functions → /api/cron/sync-episodes.
 */

export const dynamic = "force-dynamic";        // Never cache
export const maxDuration = 60;                  // Allow up to 60s (Spotify + GitHub API calls)

export async function GET(request: Request) {
  // 1. Verify the cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET env var is not configured" },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Run the sync
  const startedAt = new Date().toISOString();
  try {
    const result = await runSync();
    const completedAt = new Date().toISOString();

    if (result.noop) {
      console.log(`[cron] ${completedAt} — no new episodes`);
      return NextResponse.json({
        status: "noop",
        startedAt,
        completedAt,
        message: "No new episodes detected. Nothing to sync.",
      });
    }

    console.log(
      `[cron] ${completedAt} — synced ${result.newEpisodeCount} episode(s)` +
        (result.newGuestCount > 0
          ? `, stub-added ${result.newGuestCount} guest(s)`
          : "")
    );
    for (const ep of result.newEpisodes) {
      console.log(
        `[cron]   + ${ep.slug} | guests=[${ep.guests.join(", ")}] topics=[${ep.topics.join(", ")}]`
      );
    }

    return NextResponse.json({
      status: "success",
      startedAt,
      completedAt,
      ...result,
    });
  } catch (error) {
    const completedAt = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[cron] ${completedAt} — FAILED:`, errorMessage);
    return NextResponse.json(
      {
        status: "error",
        startedAt,
        completedAt,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
