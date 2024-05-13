import { arrayAverage } from "@utils/shared.ts";
import type { Runner } from "@models/runner.ts";
import type { SupermanSplit } from "@models/superman.ts";
import type { RunnerLeg } from "@models/runner-leg.ts";

export default function computeRunnersMistakes(
  runners: Runner[],
  supermanSplits: SupermanSplit[],
  mistakeDetectionRatio = 1.2
) {
  const clonedRunners = structuredClone(runners);

  clonedRunners.forEach((runner) => {
    const percentagesBehindSuperman = runner.legs.map((leg, legIndex) =>
      leg === null ? null : leg.time / supermanSplits[legIndex].time
    );

    const averagePercentage = arrayAverage(percentagesBehindSuperman);

    const clearedPercentageBehindSuperman =
      clearPercentageBehindAndComputeIsMistake(
        percentagesBehindSuperman,
        runner,
        averagePercentage,
        mistakeDetectionRatio
      );

    // Recalculate average without mistakes
    const clearedAveragePercentage = arrayAverage(
      clearedPercentageBehindSuperman
    );

    const newClearedPercentagesBehindSuperman =
      clearPercentageBehindAndComputeIsMistake(
        percentagesBehindSuperman,
        runner,
        clearedAveragePercentage,
        mistakeDetectionRatio
      );

    // Recalculate average without mistakes
    const newClearedAveragePercentage = arrayAverage(
      newClearedPercentagesBehindSuperman
    );

    runner.totalTimeLost = runner.legs.reduce(
      (timeLost: number, leg: RunnerLeg | null, legIndex: number) => {
        if (leg === null || !leg.isMistake) {
          return 0;
        }

        const timeWithoutMistake = Math.round(
          // First runner is supposed to have only complete legs
          supermanSplits[legIndex].time * newClearedAveragePercentage
        );

        leg.timeLoss = leg.time - timeWithoutMistake;

        return timeLost + leg.timeLoss;
      },
      0
    );
  });

  return clonedRunners;
}

function clearPercentageBehindAndComputeIsMistake(
  percentagesBehindSuperman: (number | null)[],
  runner: Runner,
  averagePercentage: number,
  mistakeDetectionRatio: number
) {
  return percentagesBehindSuperman.map((percentage, legIndex) => {
    const leg = runner.legs[legIndex];

    if (leg === null || percentage === null) {
      return null;
    }

    leg.isMistake = percentage > averagePercentage * mistakeDetectionRatio;

    return leg.isMistake ? null : percentage;
  });
}
