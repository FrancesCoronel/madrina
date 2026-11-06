import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";

const appHomeOpenedCallback = async ({
  client,
  event,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"app_home_opened">) => {
  if (event.tab !== "home") return;
  try {
    await client.views.publish({
      user_id: event.user,
      view: {
        type: "home",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Hi, I'm Madrina* 🌱\nYour dashboard is on its way. For now, DM me a question about your path to Staff.",
            },
          },
        ],
      },
    });
  } catch (error) {
    logger.error("app_home_opened handler failed:", error);
  }
};

export default appHomeOpenedCallback;
