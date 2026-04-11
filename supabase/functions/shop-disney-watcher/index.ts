/**
 * shop-disney-watcher — SCAFFOLD ONLY (Milestone 10 v2)
 * 
 * This function would scrape shopDisney new releases and update
 * the merchandise table with new items.
 * 
 * TODO:
 * - Implement shopDisney new releases page scraping
 * - Parse product names, prices, images, categories
 * - Match to park_id and land based on product tags
 * - Insert new rows into merchandise table
 * - Send digest notification to ops team
 * - Wire to a daily pg_cron schedule
 * 
 * NOT DEPLOYED — do not wire to any schedule.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "shop-disney-watcher is not yet implemented. This is a scaffold for v2." }),
    { status: 501, headers: { "Content-Type": "application/json" } }
  );
});
