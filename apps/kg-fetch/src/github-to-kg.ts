import { FileSystem } from '@effect/platform';
import {
  NodeFileSystem,
  NodeContext,
  NodeRuntime,
  NodeTerminal,
} from '@effect/platform-node';
import {
  Array,
  Config,
  ConfigProvider,
  Console,
  Chunk,
  Effect,
  Option,
  Stream,
  pipe,
} from 'effect';

import { CypherClient } from "@crossfold/kg-cypher";

import type { GithubSearchResult, GithubRepository } from './gh-response.js';

export const mergeGithubRepository = (ghr: GithubRepository) => 
  `
    MERGE (repo:GithubRepository { url: $url })
    SET repo.owner = $owner,
        repo.name = $name,
        repo.description = $description,
        repo.updatedAt = $updatedAt,
        repo.createdAt = $createdAt,
        repo.isTemplate = $isTemplate,
        repo.forkCount = $forkCount,
        repo.stargazerCount = $stargazerCount,
        repo.topics = $topics,
        repo.languages = $languages
  `