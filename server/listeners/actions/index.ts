import type { App } from "@slack/bolt";
import { RUN_CHECKIN_ACTION } from "~/lib/slack/home";

const register = (app: App) => {
  app.action(RUN_CHECKIN_ACTION, async ({ ack, body, client, logger }) => {
    await ack();
    // Step 3 replaces this with the real focus check.
    try {
      const { channel } = await client.conversations.open({ users: body.user.id });
      if (channel?.id) {
        await client.chat.postMessage({
          channel: channel.id,
          text: "Your weekly check-in is almost ready 🧭 Give me a few minutes.",
        });
      }
    } catch (error) {
      logger.error("run_weekly_checkin failed:", error);
    }
  });
};

export default { register };
