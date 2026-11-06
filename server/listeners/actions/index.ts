import type { App, BlockAction } from "@slack/bolt";
import { ACTIONS, confirmOnPurpose, draftManagerNote, planNextWeek, runFocusCheck } from "~/lib/slack/checkin";
import { RUN_CHECKIN_ACTION } from "~/lib/slack/home";
import { rememberDemoUser } from "~/lib/madrina/store";

type Handler = (client: Parameters<typeof draftManagerNote>[0], channel: string, ts: string) => Promise<void>;

const threadHandler = (fn: Handler) =>
  (async ({ ack, body, client, logger }) => {
    await ack();
    const b = body as BlockAction;
    const channel = b.channel?.id;
    const ts = b.message?.thread_ts ?? b.message?.ts;
    if (!channel || !ts) return;
    try {
      await fn(client, channel, ts);
    } catch (error) {
      logger.error(`${b.actions[0]?.action_id} failed:`, error);
    }
  }) satisfies Parameters<App["action"]>[1];

const register = (app: App) => {
  app.action(RUN_CHECKIN_ACTION, async ({ ack, body, client, logger }) => {
    await ack();
    rememberDemoUser(body.user.id);
    try {
      await runFocusCheck(client, body.user.id);
    } catch (error) {
      logger.error("run_weekly_checkin failed:", error);
    }
  });
  app.action(ACTIONS.draftNote, threadHandler(draftManagerNote));
  app.action(ACTIONS.planWeek, threadHandler(planNextWeek));
  app.action(ACTIONS.onPurpose, threadHandler(confirmOnPurpose));
};

export default { register };
