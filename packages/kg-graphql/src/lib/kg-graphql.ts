/* eslint-disable @typescript-eslint/no-empty-interface */
import { Schema } from '@effect/schema';
import { Effect, pipe } from 'effect';

import * as Http from '@effect/platform/HttpClient';

export const GraphQLError = Schema.Struct({
  message: Schema.String,
  nodes: Schema.optional(Schema.Unknown),
  stack: Schema.optional(Schema.String),
  source: Schema.optional(Schema.Unknown),
  positions: Schema.optional(Schema.Array(Schema.Number)),
  originalError: Schema.optional(Schema.Unknown),
  extensions: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
});
export interface GraphQLError extends Schema.Schema.Type<typeof GraphQLError> {}

export const GraphQlResponse = Schema.Struct({
  data: Schema.optional(Schema.Object),
  errors: Schema.optional(Schema.Array(GraphQLError)),
});
export interface GraphQlResponse
  extends Schema.Schema.Type<typeof GraphQlResponse> {}

export const decodeGraphQLResponse = Schema.decodeUnknownEither<
  GraphQlResponse,
  any
>(GraphQlResponse);

export const queryBody = (query: string, variables?: Record<string, unknown>) =>
  Http.request.jsonBody({ query, variables });

export const queryVariable = (variable: string, value: string) =>
  Http.request.setHeader(variable, value);

/**
 * Prepares a GraphQL request as an HTTP client POST operation.
 */
export const graphql = (url: string) => Http.request.post(url);

/**
 * Process a request by fetching it then converting the reponse to JSON.
 */
export const fetchJson = (request: Http.request.ClientRequest) => pipe(
  Effect.succeed(request),
  Effect.andThen(Http.client.fetch),
  Http.response.json
)

export const graphqlResponse = <E, R>(
  effect: Effect.Effect<Http.response.ClientResponse, E, R>
) =>
  pipe(
    effect,
    Http.response.json,
    Effect.map((response) => decodeGraphQLResponse(response)),
    Effect.flatten,
    Effect.flatMap((dataAndErrors) =>
      dataAndErrors.errors
        ? Effect.fail(dataAndErrors.errors as GraphQLError[])
        : Effect.succeed(dataAndErrors.data)
    )
  );
