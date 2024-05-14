import type { ValueOrError } from "@models/error.ts";
import type { Runner } from "@models/runner.ts";
import computeRunnersMistakes from "@utils/compute-mistakes.ts";
import { computeOverallSplitRanks } from "@utils/compute-overall-split-ranks.ts";
import computeRunnersRanks from "@utils/compute-ranks.ts";
import { computeSplitRanksAndTimeBehind } from "@utils/compute-split-ranks-time-behind.ts";

export function computeSplitsRanksMistakes(
  runners: Runner[]
): ValueOrError<Runner[]> {
  const rankedRunners = computeRunnersRanks(runners);
  const [runnersAndSuperman, splitsError] =
    computeSplitRanksAndTimeBehind(rankedRunners);

  if (splitsError !== null) {
    return [null, splitsError];
  }

  const [splitRankedRunners, supermanSplits] = runnersAndSuperman;

  const [overallSplitRankedRunners, overallSplitRankedRunnersError] =
    computeOverallSplitRanks(splitRankedRunners, supermanSplits);

  if (overallSplitRankedRunnersError !== null) {
    return [null, overallSplitRankedRunnersError];
  }

  const runnersWithMistakes = computeRunnersMistakes(
    overallSplitRankedRunners,
    supermanSplits
  );

  return [runnersWithMistakes, null];
}
