import {
  Console,
  Chunk,
  Effect,
  Option,
  Stream,
} from 'effect';
import * as Http from '@effect/platform/HttpClient';

import { DateTime } from 'luxon';

import * as KgGraphQL from '@crossfold/kg-graphql';

import { decodeGithubSearchResult } from './gh-response.js';
import type { GithubRepository } from './gh-response.js';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const ghApi = (pat: string) =>
  KgGraphQL.graphql(GITHUB_GRAPHQL_ENDPOINT).pipe(
    Http.request.setHeader('authorization', `token ${pat}`)
  );

const ghSearchTopics = (topics: string[]) =>
  topics.map((topic) => `${topic} in:topics`).join(' OR ');

const ghSearchTopicBetween = (from: DateTime, to: DateTime, topics: string[]) =>
  `${ghSearchTopics(topics)} created:${from.toISODate()}..${to.toISODate()}`;

const ghQuery =
  (from: DateTime, to: DateTime, topics: string[]) => (cursor: string) =>
    `
            query topicalRepositories${cursor ? '($cursor: String!)' : ''} {
              search(query:"${ghSearchTopicBetween(
                from,
                to,
                topics
              )}", type:REPOSITORY, first: 100, ${
      cursor !== '' ? 'after: $cursor' : ''
    }) {
                pageInfo {
                  startCursor
                  hasNextPage
                  endCursor
                }
                repositoryCount
                nodes {
                  ... on Repository {
                    id
                    url
                    owner { login,  __typename}
                    name
                    nameWithOwner
                    description
                    updatedAt
                    createdAt
                    isTemplate
                    repositoryTopics {nodes {topic {name}}}
                    languages {nodes {name}}
                    forkCount
                    stargazerCount
                  }
                }
              }
            }
          `;

export const fetchGithubRepositories = (
  pat: string,
  topics: string[],
  from: DateTime,
  to: DateTime
) => {
  const ghApiWithAuth = ghApi(pat);
  const queryWithCursor = ghQuery(from, to, topics);
  const ghApiWithCursor = (cursor: string) =>
    ghApiWithAuth.pipe(
      KgGraphQL.queryBody(queryWithCursor(cursor), { cursor }),
      Effect.andThen(Http.client.fetch),
      KgGraphQL.graphqlResponse
    );
  return Stream.paginateChunkEffect('', (cursor) =>
    ghApiWithCursor(cursor).pipe(
      // Effect.tap((response) => Console.log(response)),
      Effect.flatMap(decodeGithubSearchResult),
      Effect.map((result) => result.search),
      // Effect.tap( page => Console.log(page.search.pageInfo.hasNextPage)),
      Effect.andThen((page) => {
        return [
          Chunk.fromIterable<GithubRepository>(page.nodes),
          page.pageInfo.hasNextPage
            ? Option.some(page.pageInfo.endCursor)
            : Option.none<string>(),
        ];
      })
    )
  );
};

