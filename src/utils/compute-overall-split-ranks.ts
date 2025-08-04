import type { ValueOrError } from "@models/error.ts";
import type { RunnerForSort } from "@models/runner-for-sort.ts";
import type { Runner } from "@models/runner.ts";
import type { SupermanSplit } from "@models/superman.ts";
import { computeRanksplit } from "@utils/compute-split-ranks-time-behind.ts";
import { sortRunners } from "@utils/shared.ts";

const FIRST_RUNNER_NOT_COMPLETE_MSG =
  "First runner sould have a complete course";

export function computeOverallSplitRanks(
  runners: Runner[],
  supermanSplits: SupermanSplit[]
): ValueOrError<Runner[]> {
  const clonedRunners = structuredClone(runners);

  if (
    clonedRunners.length === 0 ||
    clonedRunners[0].legs.some((l) => l === null)
  ) {
    return [
      null,
      {
        code: "FIRST_RUNNER_NOT_COMPLETE",
        message: FIRST_RUNNER_NOT_COMPLETE_MSG,
      },
    ];
  }

  // For every legs of every runners calculate ranking and time behind
  for (let legIndex = 0; legIndex < clonedRunners[0].legs.length; legIndex++) {
    // Make an array with splits and id for one leg
    const legSplits: RunnerForSort[] = clonedRunners.map((runner) => {
      const lg = runner.legs[legIndex];

      const time = lg !== null && lg !== undefined ? lg.timeOverall : null;
      return { id: runner.id, time, rankSplit: 0 };
    });

    legSplits.sort(sortRunners);

    // Remove runners that have null legs before this leg (so we dont compute rank overall for them for this leg).
    const filteredLegSplits = legSplits.filter((legSplit) => {
      const runner = clonedRunners.find((r) => legSplit.id === r.id);
      if (runner === undefined) return false;

      for (let i = legIndex; i >= 0; i--) {
        if (runner.legs[i] === null) return false;
      }

      return true;
    });

    // Compute rankOverall and timeBehindOverall from filteredLegSplits
    for (let i = 0; i < filteredLegSplits.length; i++) {
      const legSplit = filteredLegSplits[i];

      const runnerLeg = clonedRunners.find((r) => legSplit.id === r.id)?.legs[
        legIndex
      ];

      if (runnerLeg === undefined || runnerLeg === null) continue;

      legSplit.rankSplit =
        i === 0
          ? i + 1
          : computeRanksplit(legSplit, filteredLegSplits[i - 1], i);

      runnerLeg.rankOverall = legSplit.rankSplit;

      const legOverallBestTime = filteredLegSplits[0];

      if (legOverallBestTime.time === null) {
        return [
          null,
          {
            code: "FIRST_RUNNER_NOT_COMPLETE",
            message: "At least one runner sould have a complete course",
          },
        ];
      }

      runnerLeg.timeBehindOverall =
        runnerLeg.timeOverall - legOverallBestTime.time;
    }

    // Compute timeBehindSuperman from legSplits
    for (let i = 0; i < legSplits.length; i++) {
      const legSplit = legSplits[i];

      const runnerLeg = clonedRunners.find((r) => legSplit.id === r.id)?.legs[
        legIndex
      ];

      if (runnerLeg === undefined || runnerLeg === null) continue;

      const legOverallBestTime = legSplits[0];

      if (legOverallBestTime.time === null) {
        return [
          null,
          {
            code: "FIRST_RUNNER_NOT_COMPLETE",
            message: "At least one runner sould have a complete course",
          },
        ];
      }

      runnerLeg.timeBehindSuperman =
        runnerLeg.timeOverall - supermanSplits[legIndex].timeOverall;

      // TODO: fix this
      if (runnerLeg.rankOverall === 0) runnerLeg.rankOverall = null;
    }
  }

  return [clonedRunners, null];
}
