import { Args, Command, Options } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"

import { Array, Config, ConfigProvider, Console, Effect, Stream, Option, Either, pipe } from "effect"

import dotenv from 'dotenv'; 

import neo4j from 'neo4j-driver';

import { fetchGithubRepositories } from "./fetch-github.js"
import { CypherClientService, connect as connectToNeo4j } from "@crossfold/kg-cypher";
import { mergeGithubRepository } from "./github-to-kg.js";

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
  ({ ghPat, topics, fromDate, toDate }) => CypherClientService.pipe(
    Effect.andThen(cc =>
      fetchGithubRepositories(ghPat, topics, fromDate, toDate).pipe(
        // Stream.runForEach( repo => Console.log(repo.nameWithOwner))
        Stream.runForEach( repo => pipe(
          Effect.succeed(repo),
          Effect.map( repo => ({
              owner: repo.owner.login,
              name: repo.name,
              url: repo.url,
              description: repo.description,
              updatedAt: neo4j.types.Date.fromStandardDate(repo.updatedAt),
              createdAt: neo4j.types.Date.fromStandardDate(repo.createdAt),
              isTemplate: repo.isTemplate,
              forkCount: repo.forkCount,
              stargazerCount: repo.stargazerCount,
              topics: repo.repositoryTopics.nodes.map(repoTopic => repoTopic.topic.name),
              languages: repo.languages.nodes.map( lang => lang.name ),
          })),
          Effect.tap(params => Console.log(`${params.owner}/${params.name}`)),
          Effect.flatMap(params => cc.query(mergeGithubRepository(repo), params))
        ))
      )
    )
  )
);

const cli = Command.run(ghtStream, {
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
