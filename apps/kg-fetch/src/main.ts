import { Args, Command, Options } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"

import { Array, Config, ConfigProvider, Console, Effect, Stream, Option, Either, pipe, Schedule } from "effect"

import dotenv from 'dotenv'; 

import { CypherClientService, connect as connectToNeo4j } from "@crossfold/kg-cypher";
import { dateIntervals } from "@crossfold/extra-effect"
import { fetchGithubRepositories } from "./fetch-github.js"
import { cypherMergeGithubRepository, normalizeRepo } from "./github-to-kg.js";

dotenv.config();  // Load environment variables from .env file 

// ght trend [-v | --verbose] [--from date] [--to date] [--pat github PAT] [--] <topic>
const topic = Args.text({ name: 'topic' });
const fromDate = Options.date('from').pipe(
  Options.withAlias('f')
);
const toDate = Options.date('to').pipe(
  Options.withAlias('t')
);
const interval = Options.integer('interval').pipe(
  Options.withDefault(7)
)
const ghPat = Options.text('pat').pipe(
  Options.withFallbackConfig(Config.string("GITHUB_PAT")),
)
const neo4jUri = Options.text('neo4j').pipe(
  Options.withFallbackConfig(Config.string("NEO4J_URI"))
)
const neo4jUsername = Options.text('username').pipe(
  Options.withFallbackConfig(Config.string("NEO4J_USERNAME"))
)
const neo4jPassword = Options.text('password').pipe(
  Options.withFallbackConfig(Config.string("NEO4J_PASSWORD"))
)
export const fetchRepos = Command.make(
  'fetchRepos',
  { ghPat, topic, fromDate, toDate, interval, neo4jUri, neo4jUsername, neo4jPassword },
  ({ ghPat, topic, fromDate, toDate, interval, neo4jUri, neo4jUsername, neo4jPassword }) => 
    connectToNeo4j(neo4jUri, neo4jUsername, neo4jPassword).pipe(
    Effect.andThen(cc => pipe(
      dateIntervals(fromDate, toDate, interval),
      Stream.tap(fromDateToDate => Console.log(`Fetching interval ${fromDateToDate}`)),
      Stream.flatMap(([intervalStart, intervalEnd]) => fetchGithubRepositories(ghPat, topic, intervalStart, intervalEnd)),
      Stream.schedule(Schedule.fixed("1 millis")),
      Stream.runForEach( repo => pipe(
          Effect.succeed(normalizeRepo(repo)),
          Effect.map(params => ({...params, mention: topic})),
          Effect.tap((params) => Console.log(`${params.nameWithOwner}`)),
          Effect.flatMap(params => cc.query(cypherMergeGithubRepository, params))
        ))
    ))
  ) 
);

const kgCommands = Command.make(
  "kg",
  // Configuration object for the command
  {},
  // Handler function that executes the command
  (config) => Effect.succeed("Welcome to KG!")
)

// Combining commands
const multicommand = kgCommands.pipe(Command.withSubcommands([fetchRepos]))

const cli = Command.run(multicommand, {
  name: "knowledge graph tools",
  version: "v1.0.0"
})

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.withConfigProvider(ConfigProvider.fromEnv()),
  Effect.provide(NodeContext.layer),
  Effect.scoped,
  NodeRuntime.runMain
)
