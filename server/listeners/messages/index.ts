import type { App } from "@slack/bolt";
import { askCoach } from "~/lib/ai/coach";
import { rewriteWin } from "~/lib/ai/wins";
import { DEMO_PROFILE_ID } from "~/lib/madrina/data";
import { addWin, getLastCheckin, listWins, rememberDemoUser } from "~/lib/madrina/store";
import { markdownToBlocks } from "~/lib/slack/format";
import { publishHome } from "~/lib/slack/home";

const register = (app: App) => {
  // Plain DMs to Madrina (Messages tab).
  app.message(async ({ message, say, logger, client }) => {
    if (message.channel_type !== "im") return;
    if (message.subtype || !("text" in message) || !message.text) return;
    if ("bot_id" in message && message.bot_id) return;

    const thread_ts = "thread_ts" in message ? message.thread_ts : undefined;
    const user = "user" in message ? message.user : undefined;
    if (user) rememberDemoUser(user);

    try {
      // Log a win: a reply in the check-in thread, or a one-line DM that reads like a win.
      const checkin = user ? getLastCheckin(user) : undefined;
      const inCheckinThread = !!thread_ts && checkin?.ts === thread_ts;
      const looksShort = message.text.length <= 280 && !message.text.trim().endsWith("?");
      if (inCheckinThread || looksShort) {
        const win = await rewriteWin(message.text, { assumeWin: inCheckinThread });
        if (win.is_win) {
          addWin(DEMO_PROFILE_ID, {
            raw: message.text,
            bullet: win.bullet,
            competency: win.competency,
            at: new Date().toISOString(),
          });
          const count = listWins(DEMO_PROFILE_ID).length;
          const text = `🏆 Logged. Here's your promo-ready bullet:\n> ${win.bullet}\n*${win.competency}*  ·  ${win.coach_note}`;
          await say({
            text,
            thread_ts,
            blocks: [
              { type: "section", text: { type: "mrkdwn", text: `🏆 *Logged. Here's your promo-ready bullet:*\n>${win.bullet}` } },
              {
                type: "context",
                elements: [
                  { type: "mrkdwn", text: `*${win.competency}*  ·  ${win.coach_note}` },
                  { type: "mrkdwn", text: `${count} ${count === 1 ? "win" : "wins"} logged. Your Home tab is updated.` },
                ],
              },
            ],
          });
          if (user) await publishHome(client, user).catch((e) => logger.warn("Home refresh failed", e));
          return;
        }
      }

      const reply = await askCoach(message.text);
      await say({ text: reply, blocks: markdownToBlocks(reply), thread_ts });
    } catch (error) {
      logger.error("DM handler failed:", error);
      await say("Sorry, I hit a snag. Try me again in a moment?");
    }
  });
};

export default { register };
