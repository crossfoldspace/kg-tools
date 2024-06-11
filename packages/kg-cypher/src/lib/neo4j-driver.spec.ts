import neo4j from 'neo4j-driver';

describe('neo4j driver', () => {
  it('should should be promising', async () => {
    const driver = neo4j.driver(
      'neo4j://localhost',
      neo4j.auth.basic('neo4j', 'marwhompa')
    );

    const session = driver.session();

    const result = await session.executeRead((tx) =>
      tx.run('RETURN "hello" as greeting')
    );

    console.log(result.records[0].get('greeting'));

    await session.close();

    await driver.close();
  });
});
