import type { ValueOrError } from "@models/error.ts";
import type { RunnerLeg } from "@models/runner-leg.ts";
import type { Runner } from "@models/runner.ts";
import { computeSplitsRanksMistakes } from "@utils/compute-splits-ranks-mistakes.ts";
import { EMPTY_RUNNER_LEG } from "@utils/empty-runner-leg.ts";
import { getStartControlCode } from "@utils/shared.ts";

/**
 * Parse an IOF XML 3.0 file an return an array of runners of the given class
 *
 * @param xmlDocument Returned by new DOMParser().parseFromString("...", "text/xml")
 * Works with linkedom's DOMParser in non browser environment, even if Typescript will
 * complain with the returned type.
 * @param classIdOrName The class id or class name in the xml document
 * @param timeZone A string like "+02:00" representing a timezone offset from GMT
 * @returns
 */
export function parseIOFXML3SplitTimesFile(
  xmlDocument: XMLDocument,
  classIdOrName: string,
  timeZone: string,
): ValueOrError<Runner[]> {
  try {
    const IOFXMLVersion = xmlDocument
      .querySelector("ResultList")
      ?.getAttribute("iofVersion");

    if (IOFXMLVersion !== "3.0") {
      return [
        null,
        { code: "NOT_IOF_XML_3", message: "Not an IOF XML 3.0 file" },
      ];
    }

    const classResults = Array.from(
      xmlDocument.querySelectorAll("ClassResult"),
    );

    let classResult = classResults.find((classR) => {
      const classTag = classR.querySelector("Class");
      const id = classTag?.querySelector("Id")?.textContent?.trim();
      return id === classIdOrName;
    });

    if (classResult === undefined) {
      classResult = classResults.find((classR) => {
        const classTag = classR.querySelector("Class");
        const name = classTag?.querySelector("Name")?.textContent?.trim();
        return name === classIdOrName;
      });
    }

    if (classResult === undefined) {
      return [
        null,
        {
          code: "CLASS_NAME_NOT_FOUND",
          message: "There is no ClassResult matching the given class name",
        },
      ];
    }

    const personResults = classResult.querySelectorAll("PersonResult");
    const [runners, runnersError] = getRunners(personResults, timeZone);

    if (runnersError !== null) {
      return [null, runnersError];
    }

    return computeSplitsRanksMistakes(runners);
  } catch (_) {
    return [
      null,
      { code: "UNKNOWN_ERROR", message: "An unknown error occured." },
    ];
  }
}

function getRunners(
  personResults: NodeListOf<Element>,
  timeZone: string,
): ValueOrError<Runner[]> {
  const runners: Runner[] = [];

  for (const personResult of Array.from(personResults)) {
    const statusTag = personResult.querySelector("Status");
    const IOFXMLStatus = statusTag !== null ? statusTag.textContent : null;

    // We skip runners with no split at all
    if (IOFXMLStatus === null || !VALID_IOF_XML_STATUS.includes(IOFXMLStatus)) {
      continue;
    }

    const status = OK_IOF_XML_STATUS.includes(IOFXMLStatus) ? "ok" : "not-ok";

    const id = crypto.randomUUID();

    const family = personResult.querySelector("Family");
    const lastName = family !== null ? family.textContent : "";

    const given = personResult.querySelector("Given");
    const firstName = given !== null ? given.textContent : "";

    const startTimeTag = personResult.querySelector("StartTime");

    const [startTime, startTimeError] = computeStartOrFinishTime(
      startTimeTag,
      timeZone,
    );

    if (startTimeError !== null) return [null, startTimeError];

    const [legs, legsError] = extractLegsFromPersonResult(personResult);

    let time: number | null = null;

    if (status === "ok") {
      const timeString = personResult
        .querySelector("Time")
        ?.textContent?.trim();

      if (timeString === undefined) {
        return [
          null,
          {
            code: "INVALID_TIME",
            message: `Overall time is invalid for runner ${firstName} ${lastName}`,
          },
        ];
      }

      time = parseInt(timeString, 10);

      if (isNaN(time)) {
        return [
          null,
          {
            code: "INVALID_TIME",
            message: `Overall time is invalid for runner ${firstName} ${lastName}`,
          },
        ];
      }
    }
    // else {
    //   const finishTimeTag = personResult.querySelector("FinishTime");
    //   const [finishTime, finishTimeError] = computeStartOrFinishTime(finishTimeTag, timeZone);

    //   if (finishTimeError === null) {
    //     time = finishTime - startTime;
    //   }
    // }

    if (legsError !== null) {
      return [null, legsError];
    }

    if (legs.length === 0) continue;
    legs.push(computeLastLeg(time, legs));

    runners.push({
      id,
      status,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      startTime,
      time,
      legs,
      rank: null,
      timeBehind: null,
      totalTimeLost: 0,
    });
  }

  if (runners.length === 0) {
    return [
      null,
      { code: "NO_VALID_RUNNER", message: "No valid runners in this file" },
    ];
  }

  const firstRunnerLegsLenth = runners[0].legs.length;

  if (runners.some((runner) => runner.legs.length !== firstRunnerLegsLenth)) {
    return [
      null,
      {
        code: "INCONSISTENT_RUNNERS_LEGS",
        message: "Not all runners have the same legs number in their course",
      },
    ];
  }

  return [runners, null];
}

function computeLastLeg(
  time: number | null,
  legs: (RunnerLeg | null)[],
): RunnerLeg | null {
  const secondLastLeg = legs.at(-1);

  if (
    time === null ||
    secondLastLeg === null ||
    secondLastLeg?.timeOverall === undefined
  ) {
    return null;
  }

  const startControlCode = secondLastLeg.finishControlCode;

  return {
    ...EMPTY_RUNNER_LEG,
    startControlCode,
    finishControlCode: "finish",
    timeOverall: time,
    time: time - secondLastLeg.timeOverall,
  };
}

function computeStartOrFinishTime(
  startOrFinishTimeTag: Element | null,
  timeZone: string,
): ValueOrError<number> {
  if (
    startOrFinishTimeTag === null ||
    startOrFinishTimeTag.textContent === null
  ) {
    return [
      null,
      {
        code: "INVALID_RUNNER",
        message: "No start time with a valid runner status",
      },
    ];
  }

  const time = startOrFinishTimeTag.textContent.includes("+")
    ? startOrFinishTimeTag.textContent
    : startOrFinishTimeTag.textContent + timeZone;

  const dateTime = new Date(time);

  return [dateTime.valueOf() / 1000, null];
}

function extractLegsFromPersonResult(
  personResult: Element,
): ValueOrError<(RunnerLeg | null)[]> {
  const legTags = Array.from(personResult.querySelectorAll("SplitTime"));

  /** @type {(RunnerLeg | null)[]} */
  const legs = [];

  for (let index = 0; index < legTags.length; index++) {
    const splitTime = legTags[index];
    const status = splitTime.getAttribute("status");

    if (status === IOFXMLSplitTimeStatusEnum.Additional.valueOf()) {
      continue;
    }

    if (status === IOFXMLSplitTimeStatusEnum.Missing.valueOf()) {
      legs.push(null);
      continue;
    }

    if (index > 0) {
      const previousControlStatus = legTags[index - 1].getAttribute("status");

      if (
        previousControlStatus ===
          IOFXMLSplitTimeStatusEnum.Additional.valueOf() ||
        previousControlStatus === IOFXMLSplitTimeStatusEnum.Missing.valueOf()
      ) {
        legs.push(null);
        continue;
      }
    }

    const [startControlCode, startControlCodeError] = getStartControlCode(
      legTags,
      index,
    );

    if (startControlCodeError !== null) {
      return [null, startControlCodeError];
    }

    const controlCodeTag = splitTime.querySelector("ControlCode");

    if (controlCodeTag === null || controlCodeTag.textContent === null) {
      return [
        null,
        {
          code: "CONTROL_NOT_FOUND",
          message: "No control code found for leg finish control",
        },
      ];
    }

    const finishControlCode = controlCodeTag.textContent;
    const timeString = splitTime.querySelector("Time")?.textContent?.trim();

    if (timeString === undefined) {
      return [null, { code: "INVALID_TIME", message: "No valid split time" }];
    }

    const timeOverall = parseInt(timeString, 10);

    if (isNaN(timeOverall)) {
      return [null, { code: "INVALID_TIME", message: "No valid split time" }];
    }

    const [time, timeError] = getTime(legTags, index, timeOverall);

    if (timeError !== null) {
      return [null, timeError];
    }

    legs.push({
      ...EMPTY_RUNNER_LEG,
      startControlCode,
      finishControlCode,
      timeOverall,
      time,
    });
  }

  return [legs, null];
}

function getTime(
  legTags: Element[],
  index: number,
  timeOverall: number,
): ValueOrError<number> {
  if (index === 0) return [timeOverall, null];

  const previousControlTimeTag = legTags[index - 1]
    .querySelector("Time")
    ?.textContent?.trim();

  if (previousControlTimeTag === undefined) {
    return [null, { code: "INVALID_TIME", message: "No valid split time" }];
  }

  const previousControlTimeOverall = parseInt(previousControlTimeTag, 10);

  if (isNaN(timeOverall)) {
    return [null, { code: "INVALID_TIME", message: "No valid split time" }];
  }

  return [timeOverall - previousControlTimeOverall, null];
}

/** @enum {string} */
const IOFXML3RunnerStatusEnum = {
  OK: "OK",
  Finished: "Finished",
  MissingPunch: "MissingPunch",
  Disqualified: "Disqualified",
  DidNotFinish: "DidNotFinish",
  Active: "Active",
  Inactive: "Inactive",
  OverTime: "OverTime",
  SportingWithdrawal: "SportingWithdrawal",
  NotCompeting: "NotCompeting",
  Moved: "Moved",
  MovedUp: "MovedUp",
  DidNotStart: "DidNotStart",
  DidNotEnter: "DidNotEnter",
  Cancelled: "Cancelled",
};

/** @enum {string} */
const IOFXMLSplitTimeStatusEnum = {
  Missing: "Missing",
  Additional: "Additional",
};

const OK_IOF_XML_STATUS = [
  IOFXML3RunnerStatusEnum.OK,
  IOFXML3RunnerStatusEnum.Finished,
];

const VALID_IOF_XML_STATUS = [
  IOFXML3RunnerStatusEnum.OK,
  IOFXML3RunnerStatusEnum.Finished,
  IOFXML3RunnerStatusEnum.MissingPunch,
  IOFXML3RunnerStatusEnum.Disqualified,
  IOFXML3RunnerStatusEnum.DidNotFinish,
  IOFXML3RunnerStatusEnum.OverTime,
];
