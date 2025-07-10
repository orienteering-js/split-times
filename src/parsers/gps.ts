import type { ValueOrError } from "@models/error.ts";
import type { RunnerLeg } from "@models/runner-leg.ts";
import type { Runner } from "@models/runner.ts";
import { computeSplitsRanksMistakes } from "@utils/compute-splits-ranks-mistakes.ts";

type RunnerTrack = {
  id: string;
  firstName: string;
  lastName: string;
  lats: number[];
  lons: number[];
  times: number[];
};

type ControlPoint = {
  code: string;
  latitude: number;
  longitude: number;
};

type RunnerControlPoint = {
  code: string;
  latitude: number;
  longitude: number;
  time: number;
};

const CIRCLE_RADIUS = 20;

/**
 * Generates split times for runners based on their GPS tracks and course control points.
 *
 * @param {Object} options - The input parameters.
 * @param {RunnerTrack[]} options.runnerTracks - An array of runner GPS tracks to process.
 * @param {ControlPoint[]} options.controlPoints - An array of control points defining the course.
 * @returns {ValueOrError<Runner[]>} A value containing the list of runners with computed split times,
 * or an error if processing fails.
 */
export function createSplitTimesFromGpsTracksAndCourse({
  runnerTracks,
  controlPoints,
}: {
  runnerTracks: RunnerTrack[];
  controlPoints: ControlPoint[];
}): ValueOrError<Runner[]> {
  const runners: Runner[] = [];

  if (controlPoints.length < 2) {
    return [
      null,
      {
        code: "NOT_ENOUTH_CONTROL_POINTS",
        message: "controlPoints array should contain at least 2 items.",
      },
    ];
  }

  for (const runnerTrack of runnerTracks) {
    const runnerControlPoints: (RunnerControlPoint | null)[] = [];

    for (const controlPoint of controlPoints) {
      let minimumDistance = Infinity;

      const firstPointInCircleIndex = runnerTrack.lats.findIndex(
        (lat, index) => {
          const lon = runnerTrack.lons[index]!;

          minimumDistance = haversineDistance(
            [lon, lat],
            [controlPoint.longitude, controlPoint.latitude]
          );

          return minimumDistance <= CIRCLE_RADIUS;
        }
      );

      if (firstPointInCircleIndex === -1) {
        runnerControlPoints.push(null);
        continue;
      }

      let closestPointIndex = firstPointInCircleIndex;

      for (let i = firstPointInCircleIndex; i < runnerTrack.lats.length; i++) {
        const lat = runnerTrack.lats[i]!;
        const lon = runnerTrack.lons[i]!;

        const distance = haversineDistance(
          [lon, lat],
          [controlPoint.longitude, controlPoint.latitude]
        );

        if (distance > CIRCLE_RADIUS) {
          break;
        }

        if (distance < minimumDistance) {
          minimumDistance = distance;
          closestPointIndex = i;
        }
      }

      runnerControlPoints.push({
        code: controlPoint.code,
        latitude: runnerTrack.lats[closestPointIndex]!,
        longitude: runnerTrack.lons[closestPointIndex]!,
        time: runnerTrack.times[closestPointIndex]!,
      });
    }

    const startTime = runnerControlPoints[0]?.time ?? runnerTrack.times[0]!;
    const lastControlPoint = runnerControlPoints.at(-1) ?? null;

    const legs: (RunnerLeg | null)[] = [];

    for (let i = 1; i < runnerControlPoints.length; i++) {
      const startControlPoint = runnerControlPoints[i - 1];
      const finishControlPoint = runnerControlPoints[i];

      if (startControlPoint === null || finishControlPoint === null) {
        legs.push(null);
        continue;
      }

      legs.push({
        startControlCode: startControlPoint.code,
        finishControlCode: finishControlPoint.code,
        timeOverall: finishControlPoint.time - startTime,
        time: finishControlPoint.time - startControlPoint.time,
        rankSplit: 0,
        timeBehindSplit: 0,
        rankOverall: 0,
        timeBehindOverall: 0,
        timeBehindSuperman: 0,
        isMistake: false,
        timeLoss: 0,
      });
    }

    runners.push({
      id: runnerTrack.id,
      firstName: runnerTrack.firstName,
      lastName: runnerTrack.lastName,
      status: runnerControlPoints.some((c) => c === null) ? "not-ok" : "ok",
      startTime,
      time:
        lastControlPoint !== null ? lastControlPoint.time - startTime : null,
      legs,
      rank: null,
      timeBehind: null,
      totalTimeLost: 0,
    });
  }

  runners.sort((runner1, runner2) => {
    const runner1IsComplete = runner1.legs.every((leg) => leg !== null);
    const runner2IsComplete = runner2.legs.every((leg) => leg !== null);

    if (runner1IsComplete && !runner2IsComplete) {
      return -1;
    }

    if (!runner1IsComplete && runner2IsComplete) {
      return 1;
    }

    return 0;
  });

  return computeSplitsRanksMistakes(runners);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

type Coordinate = [longitude: number, latitude: number];

function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371e3; // meters
  const lon1 = toRadians(coord1[0]);
  const lat1 = toRadians(coord1[1]);
  const lon2 = toRadians(coord2[0]);
  const lat2 = toRadians(coord2[1]);

  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
