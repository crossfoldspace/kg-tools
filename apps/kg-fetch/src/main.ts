import { Args, Command, Options } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"

import { Array, Config, ConfigProvider, Console, Effect, Stream, Option, Either, pipe } from "effect"

import dotenv from 'dotenv'; 


import { CypherClientService, connect as connectToNeo4j } from "@crossfold/kg-cypher";
import { dateInterval } from "@crossfold/extra-effect"
import { fetchGithubRepositories } from "./fetch-github.js"
import { cypherMergeGithubRepository, normalizeRepo } from "./github-to-kg.js";

dotenv.config();  // Load environment variables from .env file 

// ght trend [-v | --verbose] [--from date] [--to date] [--pat github PAT] [--] [<topics>...]
const topics = Args.text({ name: 'topics' }).pipe(Args.repeated);
const fromDate = Options.date('from').pipe(
  Options.withAlias('f')
);
const toDate = Options.date('to').pipe(
  Options.withAlias('t')
);
const ghPat = Options.text('pat').pipe(
  Options.withFallbackConfig(Config.string("GITHUB_PAT")),
)

export const ghToKg = Command.make(
  'ghToKg',
  { ghPat, topics, fromDate, toDate },
  ({ ghPat, topics, fromDate, toDate }) => CypherClientService.pipe(
    Effect.andThen(cc => pipe(
      dateInterval(fromDate, toDate, 7),
      Stream.tap(interval => Console.log(`Fetching interval ${interval}`)),
      Stream.flatMap(([intervalStart, intervalEnd]) => fetchGithubRepositories(ghPat, topics, intervalStart, intervalEnd)),
      Stream.runForEach( repo => pipe(
          Effect.succeed(normalizeRepo(repo)),
          Effect.tap((params) => Console.log(`${params.owner}/${params.name}`)),
          Effect.flatMap(params => cc.query(cypherMergeGithubRepository, params))
        ))
    ))
  ) 
);

const cli = Command.run(ghToKg, {
  name: "knowledge graph fetch",
  version: "v1.0.0"
})


const neo4jClient = connectToNeo4j('neo4j://localhost:7687', 'neo4j', 'marwhompa');

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.withConfigProvider(ConfigProvider.fromEnv()),
  Effect.provideServiceEffect(CypherClientService, neo4jClient),
  Effect.provide(NodeContext.layer),
  Effect.scoped,
  NodeRuntime.runMain
)
