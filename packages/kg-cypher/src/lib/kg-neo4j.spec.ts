import { Effect, Stream, Chunk, Console, pipe } from 'effect';

import * as Neo4jClient from './kg-neo4j.js';
import { CypherClient, CypherClientService } from './cypher-service.js';

import { Result } from 'neo4j-driver';

describe('KG Cypher Client', () => {
  it('acquire, use, release', async () => {
    const use = (cc: CypherClient) => cc.query("RETURN 'hello' as msg")

    const program = Effect.acquireUseRelease(
      Neo4jClient.acquireDriver('neo4j://localhost:7687', 'neo4j', 'marwhompa'),
      use,
      Neo4jClient.release
    );

    await Effect.runPromise(program);
  });

  it('is available as a service', async () => {

    const program = CypherClientService.pipe(
      Effect.andThen(cc => cc.query("RETURN 'hello' as msg")),
      // Effect.tap((result) => Console.log(result))
    )

    const neo4jClient = Neo4jClient.connect('neo4j://localhost:7687', 'neo4j', 'marwhompa');

    const runnable = Effect.scoped(
      Effect.provideServiceEffect(program, CypherClientService, neo4jClient)
    )
    await Effect.runPromise(runnable);
  })

  it('can stream results', async () => {
    const program = CypherClientService.pipe(
      Effect.andThen( cc => pipe(
        cc.stream("MATCH (n:GithubRepository) RETURN n.nameWithOwner"),
        Stream.take(10),
        Stream.runCollect,
        Effect.map(Chunk.toArray)
    )))

    const neo4jClient = Neo4jClient.connect('neo4j://localhost:7687', 'neo4j', 'marwhompa');

    const runnable = Effect.scoped(
      Effect.provideServiceEffect(program, CypherClientService, neo4jClient)
    )
    const results = await Effect.runPromise(runnable);
    console.log(results);
    expect(results.length).toBe(10);
  })
});
