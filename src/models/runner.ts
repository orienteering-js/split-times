import { z } from "zod";
import { runnerLegValidator } from "./runner-leg.js";

export const runnerTrackValidator = z.object({
  lats: z.array(z.number()),
  lons: z.array(z.number()),
  times: z.array(z.number()),
  color: z.string().startsWith("#"),
});

export type RunnerTrack = z.infer<typeof runnerTrackValidator>;

export const runnerValidator = z.object({
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

export type Runner = z.infer<typeof runnerValidator>;
