/* eslint-disable @typescript-eslint/no-empty-interface */
import { Schema } from '@effect/schema';
import { Effect, Context, pipe } from 'effect';

import neo4j from 'neo4j-driver';

import { Driver as Neo4jDriver, Neo4jError } from 'neo4j-driver';

import { CypherClient, QueryParameters } from './cypher-service.js'

class Neo4jCypherClient implements CypherClient {
  driver: Neo4jDriver;

  constructor(url: string, username: string, password: string) {
    this.driver = neo4j.driver(url, neo4j.auth.basic(username, password));
    this.driver.verifyAuthentication(); // ABKTODO -- fail early, or lazily at query request?
  }

  query = (cypher: string, parameters?: QueryParameters) =>
    Effect.tryPromise(() => this.driver.executeQuery(cypher, parameters));

  close = () => this.driver.close();
}

export const acquireDriver = (
  url: string,
  username: string,
  password: string
) => Effect.try({
      try: () => new Neo4jCypherClient(url, username, password),
      catch: (error) => error
})

export const release = (pg: CypherClient) => Effect.promise(() => pg.close());

export const connect = (
  url: string,
  username: string,
  password: string
) => Effect.acquireRelease(
    acquireDriver(url, username, password), 
    release)