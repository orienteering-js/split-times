import type { ValueOrError } from "@models/error.ts";
import type { RunnerForSort } from "@models/runner-for-sort.ts";
import type { Runner } from "@models/runner.ts";
import type { SupermanSplit } from "@models/superman.ts";
import { sortRunners } from "@utils/shared.ts";

export function computeSplitRanksAndTimeBehind(
  runners: Runner[]
): ValueOrError<[Runner[], SupermanSplit[]]> {
  const clonedRunners = structuredClone(runners);
  const course = clonedRunners[0].legs.map((leg) =>
    leg === null ? null : leg.finishControlCode
  );

  const supermanSplits: SupermanSplit[] = [];

  // For every legs of every runners calculate ranking and time behind
  for (let index = 0; index < course.length; index++) {
    const leg = course[index];

    // Make an array with splits and id for one leg
    const legSplits: RunnerForSort[] = clonedRunners.map((runner) => {
      const lg = runner.legs.find((l) => l?.finishControlCode === leg);

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
          message: "First runner should have a complete course.",
        },
      ];
    }

    supermanSplits.push({
      time: bestSplitTime,
      timeOverall:
        index === 0
          ? bestSplitTime
          : supermanSplits[index - 1].timeOverall + bestSplitTime,
    });

    for (let i = 0; i < legSplits.length; i++) {
      const legSplit = legSplits[i];

      legSplit.rankSplit =
        i === 0 ? i + 1 : computeRanksplit(legSplit, legSplits[i - 1], i);

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
            message: "First runner should have a complete course.",
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
  index: number
) {
  if (legSplit.time === previousLegSplit.time) {
    return previousLegSplit.rankSplit;
  }

  return index + 1;
}
