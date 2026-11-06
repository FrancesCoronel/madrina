import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, type ModelMessage } from "ai";

// Latest Claude Sonnet. Override with ANTHROPIC_MODEL if needed.
export const MODEL_ID = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

// Org-level (non-workspace-scoped) keys must name a workspace on every request.
const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
const anthropic = createAnthropic({
  headers: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
});

export const MADRINA_VOICE = `You are Madrina, a career coach for women software engineers. Warm, direct, practical, hopeful. Short messages. Always end with one clear choice or next step. Treat the IC track (Staff, Principal) and management as equally valid. Watch for glue work and invisible work, and help her get credit or hand it off. Encourage working in public channels instead of DMs so work is visible. Recommend only resources from the curated list, all by women who publicly identify as women. Never send anything to her manager yourself: draft it, she decides. Never infer anyone's gender.

Formatting: you are writing in Slack. Use Slack mrkdwn (*bold*, _italic_, - bullets, <url|text> links). Keep it under ~120 words unless asked to draft something longer. No em dashes.`;

/** One-shot Claude call. Uses ANTHROPIC_API_KEY from the environment. */
export async function askClaude({
  system,
  messages,
  prompt,
}: {
  system?: string;
  messages?: ModelMessage[];
  prompt?: string;
}): Promise<string> {
  const { text } = await generateText({
    model: anthropic(MODEL_ID),
    system: system ?? MADRINA_VOICE,
    ...(messages ? { messages } : { prompt: prompt ?? "" }),
    maxOutputTokens: 800,
  });
  return text.trim();
}
