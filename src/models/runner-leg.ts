import { z } from "zod";
import type { Routechoice } from "@models/routechoice.ts";
import { routechoiceValidator } from "@models/routechoice.ts";

export const runnerLegValidator = z.object({
  startControlCode: z.string(),
  finishControlCode: z.string(),
  timeOverall: z.number(),
  time: z.number(),
  rankSplit: z.number(),
  timeBehindSplit: z.number(),
  rankOverall: z.number(),
  timeBehindOverall: z.number(),
  timeBehindSuperman: z.number(),
  isMistake: z.boolean(),
  timeLoss: z.number(),
  routeChoiceTimeLoss: z.nullable(z.number()),
  detectedRouteChoice: z.nullable(routechoiceValidator),
  manualRouteChoice: z.nullable(routechoiceValidator),
});

export interface RunnerLeg {
  startControlCode: string;
  finishControlCode: string;
  timeOverall: number;
  time: number;
  rankSplit: number;
  timeBehindSplit: number;
  rankOverall: number;
  timeBehindOverall: number;
  timeBehindSuperman: number;
  isMistake: boolean;
  timeLoss: number;
  routeChoiceTimeLoss: number | null;
  detectedRouteChoice: Routechoice | null;
  manualRouteChoice: Routechoice | null;
}
