import { createCommandSearchHandler } from 'cmdk-vectorized/server'
import { searchWeaviateRoutes } from './weaviate-search'

export const GET = createCommandSearchHandler({
  defaultLimit: 8,
  maxLimit: 20,
  search: async ({ query, limit }) => {
    const routes = await searchWeaviateRoutes(query, limit)

    return routes.map((route) => ({
      id: `route:${route.route}`,
      type: 'navigation' as const,
      title: route.label || route.route,
      description: route.longDescription || route.description || undefined,
      href: route.route,
      score: route.score,
      meta: route.explainScore ? { explainScore: route.explainScore } : undefined,
    }))
  },
})