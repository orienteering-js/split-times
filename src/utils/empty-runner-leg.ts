import { RunnerLeg } from "@models/runner-leg.ts";

export const EMPTY_RUNNER_LEG: RunnerLeg = {
  startControlCode: "0",
  finishControlCode: "0",
  timeOverall: 0,
  time: 0,
  rankSplit: 0,
  timeBehindSplit: 0,
  rankOverall: 0,
  timeBehindOverall: 0,
  timeBehindSuperman: 0,
  isMistake: false,
  timeLoss: 0,
  routeChoiceTimeLoss: null,
  detectedRouteChoice: null,
  manualRouteChoice: null,
};
