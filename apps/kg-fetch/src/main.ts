import { Args, Command, Options } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"

import { Array, Config, ConfigProvider, Console, Effect, Stream, Option, Either, pipe } from "effect"

import { DateTime } from "luxon";

import dotenv from 'dotenv'; 

import { fetchGithubRepositories } from "./fetch-github.js"

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

export const ghtStream = Command.make(
  'github',
  { ghPat, topics, fromDate, toDate },
  ({ ghPat, topics, fromDate, toDate }) => 
    fetchGithubRepositories(ghPat, topics, DateTime.fromJSDate(fromDate), DateTime.fromJSDate(toDate)).pipe(
      Stream.runForEach( repo => Console.log(repo.nameWithOwner))
    )
);

const cli = Command.run(ghtStream, {
  name: "knowledge graph fetch",
  version: "v1.0.0"
})

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.withConfigProvider(ConfigProvider.fromEnv()),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
