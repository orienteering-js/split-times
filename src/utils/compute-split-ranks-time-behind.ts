import type { ValueOrError } from "@models/error.ts";
import type { RunnerForSort } from "@models/runner-for-sort.ts";
import type { Runner } from "@models/runner.ts";
import type { SupermanSplit } from "@models/superman.ts";
import { sortRunners } from "@utils/shared.ts";

const FIRST_RUNNER_NOT_COMPLETE_MSG = "First runner sould have a complete course";

export function computeSplitRanksAndTimeBehind(
  runners: Runner[],
): ValueOrError<[Runner[], SupermanSplit[]]> {
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

  const supermanSplits: SupermanSplit[] = [];

  // For every legs of every runners calculate ranking and time behind
  for (let index = 0; index < clonedRunners[0].legs.length; index++) {
    // Make an array with splits and id for one leg
    const legSplits: RunnerForSort[] = clonedRunners.map((runner) => {
      const lg = runner.legs[index];
      const time = lg === undefined || lg === null ? null : lg.time;
      return { id: runner.id, time, rankSplit: 0 };
    });

    legSplits.sort(sortRunners);
    const bestSplitTime = legSplits[0].time;

    if (bestSplitTime === null) {
      return [
        null,
        {
          code: "FIRST_RUNNER_NOT_COMPLETE",
          message: FIRST_RUNNER_NOT_COMPLETE_MSG,
        },
      ];
    }

    supermanSplits.push({
      time: bestSplitTime,
      timeOverall: index === 0
        ? bestSplitTime
        : supermanSplits[index - 1].timeOverall + bestSplitTime,
    });

    for (let i = 0; i < legSplits.length; i++) {
      const legSplit = legSplits[i];

      legSplit.rankSplit = i === 0 ? i + 1 : computeRanksplit(legSplit, legSplits[i - 1], i);

      const runner = clonedRunners.find((r) => legSplit.id === r.id);
      const runnerLeg = runner?.legs[index];

      if (runnerLeg === null || runnerLeg === undefined) {
        continue;
      }

      runnerLeg.rankSplit = legSplit.rankSplit;
      const legBestTime = legSplits[0];

      if (legBestTime.time === null) {
        return [
          null,
          {
            code: "FIRST_RUNNER_NOT_COMPLETE",
            message: FIRST_RUNNER_NOT_COMPLETE_MSG,
          },
        ];
      }

      runnerLeg.timeBehindSplit = runnerLeg.time - legBestTime.time;
    }
  }

  return [[clonedRunners, supermanSplits], null];
}

export function computeRanksplit(
  legSplit: RunnerForSort,
  previousLegSplit: RunnerForSort,
  index: number,
) {
  if (legSplit.time === previousLegSplit.time) {
    return previousLegSplit.rankSplit;
  }

  return index + 1;
}
