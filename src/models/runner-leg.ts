export interface RunnerLeg {
  startControlCode: string;
  finishControlCode: string;
  timeOverall: number;
  time: number;
  rankSplit: number;
  timeBehindSplit: number;
  rankOverall: number;
  timeBehindOverall: number;
  timeBehindSuperman: number;
  isMistake: boolean;
  timeLoss: number;
}
