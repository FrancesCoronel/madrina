# Hackathon learnings 📝

Notes from building Madrina solo in one morning at the Code with Claude: Women in AI Hackathon (2026-11-06). Madrina didn't place in the top 6. The biggest reason is the first one below.

If you're about to do a timed build, skim this first.

## Finish the demo first 🎬

Judges watch the video. A feature that never makes it on camera doesn't count.

- **Record a rough demo at the halfway point.** As soon as the core flow works end to end, record a scrappy take, so later takes only have to improve on it.
- **Lock the video 30 minutes before the deadline.** I recorded the final take with 15 minutes left and finished the clean cut after submissions closed.
- **Say no to late side quests.** In the last hour I added an MCP connector, a brag-doc export, a live glue-work flag, AI-generated avatars and a reseeded workspace. They all work, and most of them never made it into the video.
- **Check the submission rules early.** I spent minutes cutting the video to 2:00 before realizing the form had no length limit.

## Recording tips 📸

- **Record only the app window, with the mic on.** On macOS, `Cmd+Shift+5` > Record Selected Window. Recording the whole screen meant cropping, a dimmed picture to fix, and other workspaces showing in the corner.
- **Don't read the script from the same screen.** I kept switching to the shot list, so 14 stretches of the video showed the wrong window. Print the script or put it on a second screen.
- **Rehearse each click once.** Messages that only one user can see vanish when Slack reloads, buttons can double-post, and AI replies take 5 to 8 seconds. Talk through the waits instead of cutting them.

## Parallel agents: fast, with an integration tax 🤖

Running several Claude Code sessions at once (formatting, seed data, branding, the demo script and new features) got a lot built quickly, but the cost showed up at the end.

- **Freeze the demo checkout before recording.** Side sessions pushed 8 commits to `main`. Pulling them mid-demo changed the app on camera and added a dependency that wasn't installed, so every Slack request failed with a 500 until `pnpm install` ran.
- **Give every session a file boundary.** "Edit only these files, commit nothing" kept parallel sessions from overwriting each other.
- **One session owns commits.** It kept history readable and made it obvious what was live.

## Gotchas worth knowing 🧪

- **Thinking models can return empty text.** Claude Sonnet and Opus 5.5 think by default. With `maxOutputTokens: 800`, thinking used 732 tokens and the reply came back empty. Set `effort` and leave room in the token budget.
- **Org-scoped Anthropic keys need a workspace.** Hackathon keys that aren't scoped to a workspace fail until you send the `anthropic-workspace-id` header. Madrina reads it from `ANTHROPIC_WORKSPACE_ID`.
- **The Slack CLI names dev apps "(local)".** Every `slack run` start, and every change to `manifest.json`, reinstalls the app with that suffix. The tunnel script also rewrites `manifest.json` with the ngrok URL. A manual rename only sticks until the next restart.
- **Slack stores bot avatars per message.** Changing a persona's `icon_url` doesn't update old messages. You have to repost.
- **Bots can't write drafts for you.** There's no API to put text in someone's compose box, so Madrina drafts in the thread and links to the 1:1 channel.
- **The starting template is deprecated.** Vercel's Slack Agent Template now points to [Eve](https://vercel.com/templates/eve/eve-slack-agent). Its Workflow SDK added friction, so Madrina calls Claude directly through `@ai-sdk/anthropic`.

## What worked 💡

- **Synthetic data from the start.** One fake persona (Ana) with a clear story (Gateway versus Billing) made every feature easy to demo and safe to share.
- **A written spec with "cut from the bottom" priorities.** The core flow shipped before anything else.
- **Block Kit over plain text.** The App Home dashboard and the button-driven check-in read well on camera.
