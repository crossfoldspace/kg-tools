import { NodeRuntime } from '@effect/platform-node';
import * as Http from '@effect/platform/HttpClient';
import { Console, Effect } from 'effect';

import * as KgGraphql from './kg-graphql';

describe('kg-graphql', () => {
  it('should call graphqlzero', async () => {
    const getPostAsJson = Http.request
      .post('https://graphqlzero.almansi.me/api')
      .pipe(
        Http.request.jsonBody({
          query: `{
            user(id: 1) {
              id
              name
            }
          }`,
        }),
        Effect.andThen(Http.client.fetch),
        Http.response.json
      );

    const result: any = await Effect.runPromise(getPostAsJson);
    // console.log(result)
    expect(result.data.user.id).toBeDefined();
  });
  it('should call github rest api', async () => {
    const getRepositoryCollaborators = Http.request
      .get('https://api.github.com/repos/neo4j/neo4j/contributors')
      .pipe(
        Http.client.fetch,
        Http.response.json
      );

    const result: any = await Effect.runPromise(getRepositoryCollaborators);
    // console.log(result)
    expect(result[0].login).toBeDefined();
  })
  it('should be convenient for calling graphqlzero', async () => {
    const getPostAsJson = KgGraphql.graphql('https://graphqlzero.almansi.me/api').pipe(
      KgGraphql.queryBody(`
          query fetchUser($userId: ID!) {
            user(id: $userId) {
              id
              name
            }
          }`,
        {
          userId: 1
        }),
      Effect.andThen(KgGraphql.fetchJson)
    );

    const result: any = await Effect.runPromise(getPostAsJson);
    // console.log(result);
    expect(result.data.user.id).toBeDefined();
  });
});
