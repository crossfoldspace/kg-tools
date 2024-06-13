import { pipe, Stream, Effect, Option, Chunk, Random } from "effect"

import { addDays, compareAsc } from "date-fns";


describe('effect streams', () => {
  it('10 random numbers', async () => {
    const randomNumbers = Stream.repeatEffect(Random.nextInt)
    const tenRandomNumbers = Stream.take(randomNumbers, 10)
    const collectedNumbers = Stream.runCollect(tenRandomNumbers)
    const chunks = await Effect.runPromise(collectedNumbers);
    const numbers = Chunk.toReadonlyArray(chunks)

    expect(numbers.length).toBe(10);
  });
  it('10 random numbers, piped', async () => {
    const randomNumbers = Stream.repeatEffect(Random.nextInt).pipe(
      Stream.take(10),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )
    const numbers = await Effect.runPromise(randomNumbers);
    expect(numbers.length).toBe(10);
  });

  it('10 date range from date-fns', async () => {
    const dateRange = (from:Date, until:Date) => {
      const daysUntil = (until:Date) => (day:Date) => pipe(
        (day < until) ? Option.some(addDays(day, 1)) : Option.none(),
        Option.map(nextDay => [day, nextDay] as const)
      )
      return Stream.unfold(from, daysUntil(until)) 
    }
    
    const tenDays = pipe(
      new Date(),
      ( now => dateRange(now, addDays(now, 10)) ),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )
    const dates = await Effect.runPromise(tenDays)

    // console.log(dates); // for example...
    // [
    //   2024-06-13T10:23:22.654Z,
    //   2024-06-14T10:23:22.654Z,
    //   2024-06-15T10:23:22.654Z,
    //   2024-06-16T10:23:22.654Z,
    //   2024-06-17T10:23:22.654Z,
    //   2024-06-18T10:23:22.654Z,
    //   2024-06-19T10:23:22.654Z,
    //   2024-06-20T10:23:22.654Z,
    //   2024-06-21T10:23:22.654Z,
    //   2024-06-22T10:23:22.654Z,
    //   2024-06-23T10:23:22.654Z
    // ]
    expect(dates.length).toBe(10); // range excludes the upper bound
  })
  it('10 day intervals', async () => {
    const earliestDate = (a:Date, b:Date) => (compareAsc(a,b) <  1) ? a : b

    const dateInterval = (from:Date, until:Date, interval:number) => {
      const intervalsUntil = (until:Date) => (day:Date) => pipe(
        (day < until) ? Option.some(addDays(day, interval)) : Option.none(),
        Option.map(nextDay => [[day, earliestDate(nextDay, until)], nextDay] as const)
      )
      return Stream.unfold(from, intervalsUntil(until))
    }
    
    const weekly = pipe(
      new Date(),
      ( now => dateInterval(now, addDays(now, 30), 3) ),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )
    const dates = await Effect.runPromise(weekly)

    console.log(dates); // for example...
    expect(dates.length).toBe(5); 
  })
});
