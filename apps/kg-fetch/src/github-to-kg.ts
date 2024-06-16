import neo4j from 'neo4j-driver';

import type { GithubSearchResult, GithubRepository } from './gh-response.js';

export const cypherMergeGithubRepository = `
    MERGE (repo:GithubRepository { url: $url })
    SET repo.nameWithOwner = $nameWithOwner,
        repo.owner = $owner,
        repo.name = $name,
        repo.description = $description,
        repo.updatedAt = $updatedAt,
        repo.createdAt = $createdAt,
        repo.isTemplate = $isTemplate,
        repo.forkCount = $forkCount,
        repo.stargazerCount = $stargazerCount,
        repo.topics = $topics,
        repo.languages = $languages,
        repo.forks = $forks
  `

export const normalizeRepo = (repo: GithubRepository) => ({
    nameWithOwner: repo.nameWithOwner,
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
    forks: repo.forks.nodes.map( fork => fork.nameWithOwner )
})