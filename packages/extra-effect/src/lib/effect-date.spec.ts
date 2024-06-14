import { pipe, Stream, Effect, Chunk } from "effect"

import { addDays, subDays } from "date-fns";

import { dateInterval, dateRange, dateRangeStream, earliestDate, stepDays } from "./effect-date.js"

describe('effect date', () => {

  it("earliestDate()", () => {
    const now = new Date();
    const later = addDays(now, 1);
    const earlier = subDays(now, 1);
    expect(earliestDate(now, later)).toBe(now);
    expect(earliestDate(now, earlier)).toBe(earlier);
    expect(earliestDate(later, earlier)).toBe(earlier);
  })

  it('stepDays Stream', async () => {
    const days = Stream.unfold(new Date, stepDays).pipe(
      Stream.take(7),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )
    const result = await Effect.runPromise(days);

    // console.log(result);
    expect(result.length).toBe(7);
  })
  it('dateRange', async () => {
    const now = new Date();
    const tenDays = pipe(
      dateRangeStream(now, addDays(now, 10)),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )
    const dates = await Effect.runPromise(tenDays)

    // console.log(dates); 
    expect(dates.length).toBe(10); // range excludes the upper bound
  })
  it('dateInterval', async () => {
    const now = new Date();
    const weekly = pipe(
      dateInterval(now, addDays(now, 30), 7),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )
    const dates = await Effect.runPromise(weekly)

    // console.log(dates);
    expect(dates.length).toBe(5); 
  })
  it('date intervals to contiguous days', async () => {
    const now = new Date();
    const days = pipe(
      dateInterval(now, addDays(now, 14), 7),
      Stream.mapConcat( interval => dateRange(interval[0], interval[1]) ),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )
    const result = await Effect.runPromise(days);

    // console.log(result);
    expect(result.length).toBe(14)
  })
});
