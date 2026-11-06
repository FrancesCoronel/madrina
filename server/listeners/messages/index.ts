import type { App } from "@slack/bolt";
import { askClaude } from "~/lib/ai/claude";

const register = (app: App) => {
  // Plain DMs to Madrina (Messages tab).
  app.message(async ({ message, say, logger }) => {
    if (message.channel_type !== "im") return;
    if (message.subtype || !("text" in message) || !message.text) return;
    if ("bot_id" in message && message.bot_id) return;

    try {
      const reply = await askClaude({ prompt: message.text });
      const thread_ts = "thread_ts" in message ? message.thread_ts : undefined;
      await say({ text: reply, thread_ts });
    } catch (error) {
      logger.error("DM handler failed:", error);
      await say("Sorry, I hit a snag. Try me again in a moment?");
    }
  });
};

export default { register };
