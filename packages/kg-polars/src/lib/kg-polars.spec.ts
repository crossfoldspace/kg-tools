import { kgPolars } from './kg-polars';
import pl from 'nodejs-polars';

describe('kg-polars', () => {
  it('series can sum', () => {
    const fooSeries = pl.Series("foo", [1, 2, 3])
    expect(fooSeries.sum()).toEqual(6);
  });
  it('series can become an array', () => {
    const fooSeries = pl.Series("foo", [1,2,3])
    expect(fooSeries.toArray()).toEqual([1,2,3])
  })
  it('dataframe prints nicely', () => {
    const df = pl.DataFrame(
      {
          "integer": [1, 2, 3],
          "date": [
              new Date(2025, 1, 1),
              new Date(2025, 1, 2),
              new Date(2025, 1, 3),
          ],
          "float": [4.0, 5.0, 6.0],
          "string": ["a", "b", "c"],
      }
    )
  
    console.log(df)

    df.writeCSV("test/output.csv")
    const df_csv = pl.readCSV("test/output.csv")

  
  })
});
