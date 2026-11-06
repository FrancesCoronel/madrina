// In-memory state for the demo. No database: this resets when the server restarts.

export type Win = {
  raw: string;
  bullet: string;
  competency: string;
  at: string;
};

const wins = new Map<string, Win[]>();

export const listWins = (profileId: string): Win[] => wins.get(profileId) ?? [];

export const addWin = (profileId: string, win: Win) => {
  wins.set(profileId, [...listWins(profileId), win]);
};

/** DM channel + thread of the last focus check, so replies there can be read as wins. */
const lastCheckin = new Map<string, { channel: string; ts: string }>();

export const setLastCheckin = (userId: string, channel: string, ts: string) =>
  lastCheckin.set(userId, { channel, ts });
export const getLastCheckin = (userId: string) => lastCheckin.get(userId);

/** Last Slack user who used Madrina, so the cron knows whom to check in with. */
let demoUser: string | undefined = process.env.MADRINA_DEMO_USER_ID;
export const rememberDemoUser = (userId: string) => {
  demoUser = userId;
};
export const getDemoUser = () => process.env.MADRINA_DEMO_USER_ID ?? demoUser;
