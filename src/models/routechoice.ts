import { z } from "zod";

export const routeChoicesStatisticValidator = z.object({
  fastestTime: z.optional(z.number()),
  firstQuartileTime: z.optional(z.number()),
  numberOfRunners: z.optional(z.number()),
  color: z.optional(z.string()),
});

export const routechoiceWithoutTrackValidator = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string().startsWith("#"),
  length: z.number(),
  statistics: routeChoicesStatisticValidator.optional(),
});

export const routechoiceValidator = routechoiceWithoutTrackValidator.extend({
  track: z.array(z.tuple([z.number(), z.number()])),
});

export interface RouteChoicesStatistic {
  fastestTime?: number;
  firstQuartileTime?: number;
  numberOfRunners?: number;
  color?: string;
}

export interface RoutechoiceWithoutTrack {
  id: string;
  name: string;
  color: string;
  length: number;
  statistics?: RouteChoicesStatistic;
}

export interface Routechoice extends RoutechoiceWithoutTrack {
  track: [number, number][];
}

export interface RoutechoiceWithSerializedTrack
  extends RoutechoiceWithoutTrack {
  track: string;
}
