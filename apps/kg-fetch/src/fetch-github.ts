import {
  Console,
  Chunk,
  Effect,
  Option,
  Stream,
  Schedule
} from 'effect';
import * as Http from '@effect/platform/HttpClient';

import { formatISO } from "date-fns";

import * as KgGraphQL from '@crossfold/kg-graphql';

import { decodeGithubSearchResult } from './gh-response.js';
import type { GithubRepository } from './gh-response.js';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const ghApi = (pat: string) =>
  KgGraphQL.graphql(GITHUB_GRAPHQL_ENDPOINT).pipe(
    Http.request.setHeader('authorization', `token ${pat}`)
  );

const ghSearchTopics = (topic: string) => `${topic} in:topics`

const ghSearchTopicBetween = (from: Date, to: Date, topic: string) =>
  `${topic} in:readme created:${formatISO(from)}..${formatISO(to)} is:public`;

const ghQuery =
  (from: Date, to: Date, topic: string) => (cursor: string) =>
    `
    query topicalRepositories${cursor ? '($cursor: String!)' : ''} {
      search(query:"${ghSearchTopicBetween(from, to, topic)}", type:REPOSITORY, first: 100, ${ cursor !== '' ? 'after: $cursor' : ''}) 
      {
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
            repositoryTopics(first:20) {nodes {topic {name}}}
            languages(first:20) {nodes {name}}
            forkCount
            stargazerCount
            forks(visibility: PUBLIC, first:100, orderBy:{field:STARGAZERS, direction:DESC}) {
                nodes {  nameWithOwner }
            }
          }
        }
      }
    }
          `;

export const fetchGithubRepositories = (
  pat: string,
  topic: string,
  from: Date,
  to: Date
) => {
  const policy = Schedule.intersect(
    Schedule.exponential("10 millis"),
    Schedule.recurs(10)
  )
  
  const ghApiWithAuth = ghApi(pat);
  const queryWithCursor = ghQuery(from, to, topic);
  const ghApiWithCursor = (cursor: string) =>
    Effect.retry(ghApiWithAuth.pipe(
      KgGraphQL.queryBody(queryWithCursor(cursor), { cursor }),
      Effect.andThen(Http.client.fetchOk),
      KgGraphQL.graphqlResponse
    ),
    policy);
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


