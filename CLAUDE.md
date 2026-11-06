# Madrina

Career coach agent for women software engineers, built in Slack on Claude.
Built at Code with Claude: Women in AI Hackathon (Anthropic SF, Nov 6, 2026).

**Goal:** get more women promoted into senior engineering roles, and make the IC track (Staff, Principal) as normal a path as management.

**Madrina** means godmother in Spanish: the woman who vouches for you.

## Hard constraints (hackathon rules)
- Submit by **12:45 PM PT**: demo video + GitHub repo link. Stop coding at 12:30.
- **Public or synthetic data only.** No real personal info. Everything in `data/` is synthetic.
- Install only into Frances's **personal** Slack workspace (not Slack's, not Latina.dev's).
- Credit any template we start from in the README.

## Stack
- Start from `vercel-partner-solutions/slack-agent-template` (TypeScript, Bolt for JS, Nitro, AI SDK). If its Workflow SDK / DurableAgent gets in the way, keep the Bolt + App Home parts and call Claude directly.
- Model: swap AI Gateway for `@ai-sdk/anthropic` with `ANTHROPIC_API_KEY` (hackathon credits). Use the latest Claude Sonnet model.
- Deploy to Vercel (Pro). Cron allowed every minute.

## What to build (priority order, cut from the bottom)
1. **App Home dashboard** (Block Kit) for the active profile:
   - Current level → target level, track (IC / Management / Not sure yet)
   - Top 3 gaps (profile vs `ladder.json`)
   - This week's resource from `resources.json` (women-authored, matched to a gap)
   - Wins logged count
   - Support system: mentor / sponsor / advocate / coach, filled or empty
   - Button: **Run my weekly check-in**
2. **Focus check nudge** (the demo moment): compare `feedback.json` (what the manager said matters) with `activity.json` (where PRs actually went). If drift > 50%, DM:
   > Quick focus check 🧭 In your last 1:1, your manager said Gateway is your top priority for the Staff case. This week, 7 of your 9 pull requests went to Billing. Want to redirect next week, or let your manager know about the competing asks?
   Buttons: **Draft a note to my manager** (Claude drafts it in-thread; user sends it herself, never auto-sent) · **Plan next week around Gateway** · **This was on purpose**.
3. **Cron**: `vercel.json` cron `*/2 * * * *` → `/api/cron/checkin` (verify `CRON_SECRET` header). Triggers the same focus check. Button is the reliable on-stage trigger; cron proves it runs on its own.
4. **@mention / DM coach**: Claude answers with the profile, gaps, focus map and resource shelf in context. Only recommend resources from `resources.json`.
5. **Log a win**: user replies to the nudge with a one-line win → Claude rewrites it as a promo-ready bullet mapped to a ladder competency, stored in memory.
6. Stretch (cut first): MCP server exposing `get_profile`, `list_wins`, `recommend` over the same data so a personal Claude can read it. Glue-work and DM-request nudges, coach booking cards (`coaches.json`).

Store state in memory or a JSON file. No database needed for the demo.

## Madrina's voice (system prompt core)
You are Madrina, a career coach for women software engineers. Warm, direct, practical, hopeful. Short messages. Always end with one clear choice or next step. Treat the IC track (Staff, Principal) and management as equally valid. Watch for glue work and invisible work, and help her get credit or hand it off. Encourage working in public channels instead of DMs so work is visible. Recommend only resources from the curated list, all by women who publicly identify as women. Never send anything to her manager yourself: draft it, she decides. Never infer anyone's gender.

## Demo script (2 min video)
1. App Home for Ana (synthetic Senior Engineer → Staff, IC track): 3 gaps, a resource by a woman author.
2. Click **Run my weekly check-in** → focus check DM about Gateway vs Billing.
3. Click **Draft a note to my manager** → Claude drafts it.
4. Reply with a win → promo-ready bullet.
5. Close: "Next week, Madrina ships to the Latina.dev Slack community."

## README should include
- Problem stats: limited career advancement is the #1 reason women give for leaving tech jobs (Indeed 2018 US survey, 28%; Lovelace Report 2025 UK, 25%; childcare 2–3%). Women 44% more likely to be asked to do non-promotable tasks (The No Club research).
- The single story: popular engineering newsletters and podcasts skew heavily male (Pragmatic Engineer podcast: fewer than 1 in 5 guests are women).
- Architecture: Slack app + Claude + shared data core + MCP connector (roadmap).
- Credit the starting template.
