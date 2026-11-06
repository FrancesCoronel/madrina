import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { publishHome } from "~/lib/slack/home";

const appHomeOpenedCallback = async ({
  client,
  event,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"app_home_opened">) => {
  if (event.tab !== "home") return;
  try {
    await publishHome(client, event.user);
  } catch (error) {
    logger.error("app_home_opened handler failed:", error);
  }
};

export default appHomeOpenedCallback;
