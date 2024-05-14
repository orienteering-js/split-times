import type { RunnerLeg } from "@models/runner-leg.ts";

/**
 * Runner type, returned by the parseIofXmlSplitTimesFile function
 */
export type Runner = {
  id: string;
  firstName: string;
  lastName: string;
  status: "ok" | "not-ok";
  startTime: number;
  time: number | null;
  legs: (RunnerLeg | null)[];
  rank: number | null;
  timeBehind: number | null;
  totalTimeLost: number;
};
