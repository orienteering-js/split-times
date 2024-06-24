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
  for (let index = 0; index < clonedRunners[0].legs.length; index++) {
    // Make an array with splits and id for one leg
    const legSplits: RunnerForSort[] = clonedRunners.map((runner) => {
      const lg = runner.legs[index];

      const time = lg !== null && lg !== undefined ? lg.timeOverall : null;
      return { id: runner.id, time, rankSplit: 0 };
    });

    legSplits.sort(sortRunners);

    for (let i = 0; i < legSplits.length; i++) {
      const legSplit = legSplits[i];

      legSplit.rankSplit =
        i === 0 ? i + 1 : computeRanksplit(legSplit, legSplits[i - 1], i);

      const runner = clonedRunners.find((r) => legSplit.id === r.id);
      const runnerLeg = runner?.legs[index];

      if (runnerLeg === undefined || runnerLeg === null) {
        continue;
      }

      runnerLeg.rankOverall = legSplit.rankSplit;
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

      runnerLeg.timeBehindOverall =
        runnerLeg.timeOverall - legOverallBestTime.time;

      runnerLeg.timeBehindSuperman =
        runnerLeg.timeOverall - supermanSplits[index].timeOverall;
    }
  }

  return [clonedRunners, null];
}
