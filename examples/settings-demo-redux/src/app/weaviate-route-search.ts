import type { WeaviateRouteResult } from './command-types.ts'

const DEFAULT_ENDPOINT = '/api/command-search'

type CommandSearchApiResult = {
  id: string
  type: 'navigation' | 'action'
  title: string
  description?: string
  href?: string
  score?: number
  meta?: {
    explainScore?: string
  }
}

type CommandSearchApiResponse = {
  results?: CommandSearchApiResult[]
}

export function createWeaviateRouteSearch(options?: { endpoint?: string }) {
  const endpoint = options?.endpoint ?? DEFAULT_ENDPOINT

  return async function searchWeaviateRoutes(
    query: string,
    limit = 10,
  ): Promise<WeaviateRouteResult[]> {
    const url = new URL(endpoint, window.location.origin)
    url.searchParams.set('q', query)
    url.searchParams.set('limit', String(limit))

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Command search failed (${response.status}). ${errorText}`)
    }

    const data = (await response.json()) as CommandSearchApiResponse

    return (data.results ?? [])
      .filter((result) => result.type === 'navigation' && result.href)
      .map((result) => ({
        route: result.href!,
        label: result.title,
        description: result.description ?? '',
        score: result.score,
        explainScore: result.meta?.explainScore,
      }))
  }
}