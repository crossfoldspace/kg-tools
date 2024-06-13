import { pipe, Stream, Effect, Option, Chunk } from "effect"

import { addDays, compareAsc } from "date-fns";

/**
 * An unfold step function which continuously
 * provides the next day.
 */
export const stepDays = (day:Date) => pipe(
  Option.some(addDays(day, 1)),
  Option.map(nextDay => [day, nextDay] as const)
)


/**
 * An unfold step function generating a Stream of contiguous
 * days up until an end Date.
 */
export const stepDaysUntil = (until:Date) => (day:Date) => pipe(
  (day < until) ? Option.some(addDays(day, 1)) : Option.none(),
  Option.map(nextDay => [day, nextDay] as const)
)

/** 
 * Construct a Stream of dates ranging from the Date to but not including
 * an end Date. 
 * */
export const dateRange = (from:Date, until:Date) => {
  return Stream.unfold(from, stepDaysUntil(until)) 
}

/**
 * Return the earliest of two Dates.
 */
export const earliestDate = (a:Date, b:Date) => (compareAsc(a,b) <  1) ? a : b

/**
 * Unfold step function for creating [from,to] Date intervals.
 */
export const stepIntervals = (interval:number) => (day:Date) => pipe(
  Option.some(addDays(day, interval)),
  Option.map(nextDay => [[day, nextDay], nextDay] as const)
)

export const stepIntervalsUntil = (until:Date, interval:number) => (day:Date) => pipe(
  (day < until) ? Option.some(addDays(day, interval)) : Option.none(),
  Option.map(nextDay => [[day, earliestDate(nextDay, until)], nextDay] as const)
)

export const dateInterval = (from:Date, until:Date, interval:number) => Stream.unfold(from, stepIntervalsUntil(until, interval))
