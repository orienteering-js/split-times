/**
 * RunnerLeg type used in the Runner type legs property
 */
export interface RunnerLeg {
  startControlCode: string;
  finishControlCode: string;
  timeOverall: number;
  time: number;
  rankSplit: number;
  timeBehindSplit: number;
  rankOverall: number | null;
  timeBehindOverall: number;
  timeBehindSuperman: number;
  isMistake: boolean;
  timeLoss: number;
}
