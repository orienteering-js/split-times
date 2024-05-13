export { parseIOFXML3SplitTimesFile } from "./parsers/iof-xml-3-parser.ts";
export { parseIOFXML2SplitTimesFile } from "./parsers/iof-xml-2-parser.ts";
export { parseIofXmlSplitTimesFile } from "./parsers/iof-xml-parser.ts";
export { computeSplitsRanksMistakes } from "@utils/compute-splits-ranks-mistakes.ts";

export {
  type RouteChoicesStatistic,
  type Routechoice,
  type RoutechoiceWithSerializedTrack,
  type RoutechoiceWithoutTrack,
  routeChoicesStatisticValidator,
  routechoiceValidator,
  routechoiceWithoutTrackValidator,
} from "@models/routechoice.ts";

export { type RunnerLeg, runnerLegValidator } from "@models/runner-leg.ts";
export { EMPTY_RUNNER_LEG } from "@utils/empty-runner-leg.ts";

export {
  type Runner,
  type RunnerTrack,
  runnerTrackValidator,
  runnerValidator,
} from "@models/runner.ts";

export type { SupermanSplit } from "@models/superman.ts";
export { isNotNullRunnerLeg, isRunner } from "@models/runner-guards.ts";
