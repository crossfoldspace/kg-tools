/* eslint-disable @typescript-eslint/no-empty-interface */
import { Schema } from "@effect/schema"

export const GithubTopic = Schema.Struct(
  { topic: Schema.Struct({ name: Schema.String }) }
)
export const GithubRepository = Schema.Struct(
  {
    id: Schema.String, 
    url: Schema.String, 
    owner: Schema.Struct({ 
      login: Schema.String,
      __typename: Schema.Literal('User', 'Organization')
    }),
    name: Schema.String,
    nameWithOwner: Schema.String,
    description: Schema.NullishOr(Schema.String), 
    updatedAt: Schema.Date,
    createdAt: Schema.Date,
    isTemplate: Schema.Boolean,
    repositoryTopics: Schema.Struct({ nodes: Schema.Array(GithubTopic)}),
    languages: Schema.Struct({ nodes: Schema.Array(Schema.Struct({ name: Schema.String })) }),
    forks: Schema.Struct({ totalCount: Schema.Number })
  }
)
export interface GithubRepository extends Schema.Schema.Type<typeof GithubRepository> {}

export const GithubSearchResult = Schema.Struct({
  search: Schema.Struct({
    pageInfo: Schema.Struct({
      startCursor: Schema.String,
      hasNextPage: Schema.Boolean,
      endCursor: Schema.String
    }),
    repositoryCount: Schema.Number,
    nodes: Schema.Array(GithubRepository)
  })
})
export interface GithubSearchResult extends Schema.Schema.Type<typeof GithubSearchResult> {}

export const decodeGithubSearchResult = Schema.decodeUnknownEither<GithubSearchResult, any>(GithubSearchResult)
