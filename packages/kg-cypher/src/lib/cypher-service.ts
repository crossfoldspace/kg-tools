/* eslint-disable @typescript-eslint/no-empty-interface */
import { Schema } from '@effect/schema';
import { Effect, Context, Stream, pipe } from 'effect';

import {Date as Neo4jDate, RecordShape} from 'neo4j-driver/types';

export type QueryParameterScalar = number | string | boolean | Neo4jDate<number>
export type QueryParameterValue = QueryParameterScalar | QueryParameterScalar[] | QueryParameters | QueryParameters[]
export interface QueryParameters extends Readonly<Record<string, Readonly<QueryParameterValue>>> {}

/**
 * A CypherClient can execute Cypher queries.
 */
export interface CypherClient {
  readonly query: (cypher: string, parameters?: QueryParameters) => Effect.Effect<any, unknown, never>;
  readonly stream: (cypher: string, parameters?: QueryParameters) => Stream.Stream<RecordShape, Error, never>;
  readonly close: () => Promise<void>;
}


export class CypherClientService extends Context.Tag("@crossfold/cypher/CypherClient")<
  CypherClientService,
  CypherClient
>() {}



///////////////////////////////////////
// Schema

// const ResultSummary = Schema.Struct({
//   query: Schema.Struct({
//     text: Schema.String,
//     parameters: Schema.Object
//   }),
//   queryType: Schema.Literal('r', 'w'),
//   counters: QueryStatistics { _stats: [Object], _systemUpdates: 0 },
//   updateStatistics: QueryStatistics { _stats: [Object], _systemUpdates: 0 },
//   plan: false,
//   profile: false,
//   notifications: [],
//   server: ServerInfo {
//     address: 'localhost:7687',
//     agent: 'Neo4j/5.19.0',
//     protocolVersion: 5.4
//   },
//   resultConsumedAfter: Integer { low: 1, high: 0 },
//   resultAvailableAfter: Integer { low: 4, high: 0 },
//   database: { name: 'neo4j' }
// })

// const EagerResult = Schema.Struct({
//   keys: Schema.Array(Schema.String),
//   records: [
//     Record {
//       keys: [Array],
//       length: 1,
//       _fields: [Array],
//       _fieldLookup: [Object]
//     }
//   ],
//   summary: ResultSummary
// })
