import type { KnownBlock, WebClient } from "@slack/web-api";
import { askClaude, MADRINA_VOICE } from "~/lib/ai/claude";
import { getGaps, getProfile } from "~/lib/madrina/data";
import { channelFor, computeFocus, focusSummary } from "~/lib/madrina/focus";
import { setLastCheckin } from "~/lib/madrina/store";
import { markdownToBlocks } from "~/lib/slack/format";

export const ACTIONS = {
  draftNote: "focus_draft_manager_note",
  planWeek: "focus_plan_next_week",
  onPurpose: "focus_on_purpose",
} as const;

/** Drift threshold from the spec: nudge when more than half the PRs went elsewhere. */
const DRIFT_THRESHOLD = 0.5;

const openDm = async (client: WebClient, userId: string) => {
  const { channel } = await client.conversations.open({ users: userId });
  if (!channel?.id) throw new Error("Could not open DM");
  return channel.id;
};

export const focusCheckBlocks = (): { text: string; blocks: KnownBlock[] } => {
  const f = computeFocus();
  const priority = f.priority;
  const pct = Math.round(f.drift * 100);

  if (f.drift <= DRIFT_THRESHOLD) {
    const text = `Weekly check-in 🧭 ${f.priorityPrs} of your ${f.totalPrs} pull requests went to ${priority}, which is what your manager said matters most. Nice focus. Got a win from this week? Reply here and I'll make it promo-ready.`;
    return { text, blocks: [{ type: "section", text: { type: "mrkdwn", text } }] };
  }

  const main = `*Quick focus check* 🧭\nIn your last 1:1, your manager said *${priority}* is your top priority for the Staff case. This week, *${f.topOtherPrs} of your ${f.totalPrs} pull requests* went to *${f.topOther}*.\n\nWant to redirect next week, or let your manager know about the competing asks?`;
  const dmNote = f.topOtherByDm
    ? `💬 ${f.topOtherByDm} of those ${f.topOtherPrs} ${f.topOther} requests came in by DM, so nobody else sees that work. Ask them to post in *#${channelFor(f.topOther)}* instead. It makes the load visible and easier to share.`
    : "";

  const blocks: KnownBlock[] = [
    { type: "section", text: { type: "mrkdwn", text: main } },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${priority}: ${f.priorityPrs} PRs  ·  ${f.topOther}: ${f.topOtherPrs} PRs  ·  ${pct}% off-priority  ·  source: ${f.feedbackSource}`,
        },
      ],
    },
  ];
  if (dmNote) blocks.push({ type: "section", text: { type: "mrkdwn", text: dmNote } });
  blocks.push(
    {
      type: "actions",
      elements: [
        {
          type: "button",
          action_id: ACTIONS.draftNote,
          style: "primary",
          text: { type: "plain_text", text: "Draft a note to my manager", emoji: true },
        },
        {
          type: "button",
          action_id: ACTIONS.planWeek,
          text: { type: "plain_text", text: `Plan next week around ${priority}`, emoji: true },
        },
        {
          type: "button",
          action_id: ACTIONS.onPurpose,
          text: { type: "plain_text", text: "This was on purpose", emoji: true },
        },
      ],
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: "Got a win from this week? Reply in this thread with one line and I'll make it promo-ready." }],
    },
  );

  const text = `Quick focus check 🧭 Your manager said ${priority} is your top priority. This week, ${f.topOtherPrs} of your ${f.totalPrs} pull requests went to ${f.topOther}.`;
  return { text, blocks };
};

/** Run the focus check and DM it. Shared by the Home button and the cron. */
export const runFocusCheck = async (client: WebClient, userId: string) => {
  const channel = await openDm(client, userId);
  const { text, blocks } = focusCheckBlocks();
  const res = await client.chat.postMessage({ channel, text, blocks });
  if (res.ts) setLastCheckin(userId, channel, res.ts);
  return { channel, ts: res.ts };
};

const context = () => {
  const profile = getProfile();
  const gaps = getGaps(profile).slice(0, 3).map((g) => `${g.competency} (Staff expects: ${g.expectation})`);
  return `Profile (synthetic): ${profile.name}, ${profile.current_level} engineer on ${profile.team}, targeting ${profile.target_level} on the ${profile.track} track.\nTop gaps: ${gaps.join("; ")}.\n${focusSummary(computeFocus())}`;
};

/** Post a placeholder in the thread, then replace it with Claude's answer. */
const replyInThread = async (
  client: WebClient,
  channel: string,
  thread_ts: string,
  placeholder: string,
  produce: () => Promise<{ text: string; blocks: KnownBlock[] }>,
) => {
  const pending = await client.chat.postMessage({ channel, thread_ts, text: placeholder });
  try {
    const { text, blocks } = await produce();
    await client.chat.update({ channel, ts: pending.ts as string, text, blocks });
  } catch (error) {
    await client.chat.update({
      channel,
      ts: pending.ts as string,
      text: "Sorry, I hit a snag. Tap the button again in a moment?",
    });
    throw error;
  }
};

export const draftManagerNote = (client: WebClient, channel: string, thread_ts: string) =>
  replyInThread(client, channel, thread_ts, "✍️ Drafting a note you can send your manager...", async () => {
    const draft = await askClaude({
      system: `${MADRINA_VOICE}\n\nTask: write a short Slack message that Ana can send to her manager herself. First person, as Ana. 4 to 6 sentences. Name the competing Billing asks and that most arrived by DM, restate that Gateway is the Staff priority, and ask one concrete question (for example, should Billing asks go through a channel, or who else can pick them up). Confident, not apologetic. Output only the message body.`,
      prompt: context(),
    });
    const intro = "Here's a draft. I won't send it. Copy it, make it yours, and send it if it feels right.";
    return {
      text: `${intro}\n\n${draft}`,
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: `*${intro}*` } },
        ...markdownToBlocks(draft),
        {
          type: "context",
          elements: [{ type: "mrkdwn", text: "📝 Draft only. Madrina never messages your manager for you." }],
        },
      ],
    };
  });

export const planNextWeek = (client: WebClient, channel: string, thread_ts: string) =>
  replyInThread(client, channel, thread_ts, "🗺️ Sketching next week around Gateway...", async () => {
    const plan = await askClaude({
      system: `${MADRINA_VOICE}\n\nTask: a plan for Ana's next week centered on Gateway. 4 or 5 bullets, Monday to Friday, each tied to a Staff competency (Technical scope, Influence, Direction). Include getting the Gateway RFC in front of the two partner teams, one way to redirect or hand off the Billing asks, and moving requests out of DMs into a channel. End with one clear next step.`,
      prompt: context(),
    });
    return { text: plan, blocks: markdownToBlocks(plan) };
  });

export const confirmOnPurpose = async (client: WebClient, channel: string, thread_ts: string) => {
  const f = computeFocus();
  const text = `Got it, sometimes ${f.topOther} really is the right call 💪 Let's make sure it counts. Reply here with one line about what that work unlocked and I'll turn it into a promo-ready bullet.${f.glue.length ? `\n\nAlso, you did glue work this week (${f.glue.join("; ").toLowerCase()}). That's real Staff-level work when it's visible. Want to log one of those as a win too?` : ""}`;
  await client.chat.postMessage({ channel, thread_ts, text, blocks: [{ type: "section", text: { type: "mrkdwn", text } }] });
};
