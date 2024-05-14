import { z } from "zod";
import { runnerLegValidator, type RunnerLeg } from "@models/runner-leg.ts";

export const runnerTrackValidator: z.ZodType<RunnerTrack> = z.object({
  lats: z.array(z.number()),
  lons: z.array(z.number()),
  times: z.array(z.number()),
  color: z.string().startsWith("#"),
});

export type RunnerTrack = {
  lats: number[];
  lons: number[];
  times: number[];
  color: string;
};

export const runnerValidator: z.ZodType<Runner> = z.object({
  id: z.string().uuid(),
  trackingDeviceId: z.string().nullable(),
  userId: z.string().nullable(),
  status: z.union([z.literal("ok"), z.literal("not-ok")]),
  firstName: z.string(),
  lastName: z.string(),
  startTime: z.number(),
  time: z.nullable(z.number()),
  legs: z.array(z.nullable(runnerLegValidator)),
  rank: z.nullable(z.number()),
  timeBehind: z.nullable(z.number()),
  totalTimeLost: z.number(),
  track: z.nullable(runnerTrackValidator),
  timeOffset: z.number(),
});

export type Runner = {
  id: string;
  trackingDeviceId: string | null;
  userId: string | null;
  status: "ok" | "not-ok";
  firstName: string;
  lastName: string;
  startTime: number;
  time: number | null;
  legs: (RunnerLeg | null)[];
  rank: number | null;
  timeBehind: number | null;
  totalTimeLost: number;
  track: RunnerTrack | null;
  timeOffset: number;
};
