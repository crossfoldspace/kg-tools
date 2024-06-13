import { pipe, Stream, Effect, Option, Chunk, Random } from "effect"

import { DateTime } from 'luxon';

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

  it('10 date range from luxon', async () => {
    const daysUpTo = (until:DateTime) => (day:DateTime) => pipe(
      (day < until) ? Option.some(day.plus({days:1})) : Option.none(),
      Option.map(nextDay => [day, nextDay] as const)
    )
    const dateRange = (from:DateTime, until:DateTime) => Stream.unfold(from, daysUpTo(until))
    
    const tenDays = pipe(
      dateRange(DateTime.now(), DateTime.now().plus({days:10})),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )
    const dates = await Effect.runPromise(tenDays)

    console.log(dates);
    expect(dates.length).toBe(11); // range is inclusive of start & end
  })
});
