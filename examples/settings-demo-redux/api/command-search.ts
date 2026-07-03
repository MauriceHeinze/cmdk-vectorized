import type { VercelRequest, VercelResponse } from '@vercel/node'

type GraphQlRow = Record<string, unknown>

type WeaviateAdditional = {
  score?: string | number
  explainScore?: string
}

type ScoredGraphQlRow = GraphQlRow & {
  _additional?: WeaviateAdditional
}

const HYBRID_SEARCH_PROPERTIES = ['label', 'description', 'longDescription'] as const

type WeaviateRouteRow = {
  route: string
  label: string
  description: string
  longDescription: string
  score?: number
  explainScore?: string
}

function normalizeWeaviateUrl(rawUrl: string) {
  return rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
}

function readWeaviateEnv() {
  const weaviateUrl = process.env.WEAVIATE_URL ?? process.env.VITE_WEAVIATE_DATABASE_URL
  const weaviateApiKey = process.env.WEAVIATE_API_KEY ?? process.env.VITE_WEAVIATE_API_KEY
  const clusterUrl =
    process.env.WEAVIATE_CLUSTER_URL ??
    process.env.VITE_WEAVIATE_CLUSTER_URL ??
    weaviateUrl

  if (!weaviateUrl || !weaviateApiKey) {
    throw new Error('Missing WEAVIATE_URL and WEAVIATE_API_KEY server environment variables.')
  }

  return {
    weaviateUrl: normalizeWeaviateUrl(weaviateUrl),
    weaviateApiKey,
    clusterUrl: clusterUrl ? normalizeWeaviateUrl(clusterUrl) : normalizeWeaviateUrl(weaviateUrl),
  }
}

function stringOrEmpty(value: unknown): string {
  return String(value ?? '').trim()
}

function numberOrUndefined(value: unknown): number | undefined {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

async function searchWeaviateRoutes(query: string, limit = 10): Promise<WeaviateRouteRow[]> {
  const { weaviateUrl, weaviateApiKey, clusterUrl } = readWeaviateEnv()
  const escapedQuery = JSON.stringify(query)

  const hybridProperties = JSON.stringify([...HYBRID_SEARCH_PROPERTIES])

  const graphQlQuery = `
    {
      Get {
        Routes(
          hybrid: {
            query: ${escapedQuery}
            properties: ${hybridProperties}
          }
          limit: ${limit}
        ) {
          path
          label
          description
          longDescription
          _additional {
            score
            explainScore
          }
        }
      }
    }
  `

  const response = await fetch(`${weaviateUrl}/v1/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${weaviateApiKey}`,
      'X-Weaviate-Cluster-Url': clusterUrl,
    },
    body: JSON.stringify({ query: graphQlQuery }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Weaviate query failed (${response.status}). ${errorText}`)
  }

  const data = (await response.json()) as {
    data?: {
      Get?: {
        Routes?: ScoredGraphQlRow[]
      }
    }
    errors?: Array<{ message: string }>
  }

  if (data.errors?.length) {
    const messages = data.errors.map((error) => error.message).join('; ')
    throw new Error(`Weaviate GraphQL errors: ${messages}`)
  }

  return (data.data?.Get?.Routes ?? [])
    .map((row) => ({
      route: stringOrEmpty(row.path),
      label: stringOrEmpty(row.label),
      description: stringOrEmpty(row.description),
      longDescription: stringOrEmpty(row.longDescription),
      score: numberOrUndefined(row._additional?.score),
      explainScore: row._additional?.explainScore,
    }))
    .filter((item) => item.route)
}

function parseLimit(rawLimit: string | string[] | undefined, defaultLimit: number) {
  const rawValue = Array.isArray(rawLimit) ? rawLimit[0] : rawLimit
  if (!rawValue) {
    return defaultLimit
  }

  const parsed = Number.parseInt(rawValue, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultLimit
}

function readQueryParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed.', results: [] })
    return
  }

  try {
    const query = readQueryParam(req.query.q)
    const limit = Math.min(parseLimit(req.query.limit, 8), 20)
    const routes = await searchWeaviateRoutes(query, limit)

    const results = routes.map((route) => ({
      id: `route:${route.route}`,
      type: 'navigation' as const,
      title: route.label || route.route,
      description: route.longDescription || route.description || undefined,
      href: route.route,
      score: route.score,
      meta: route.explainScore ? { explainScore: route.explainScore } : undefined,
    }))

    res.status(200).json({ results })
  } catch (error) {
    console.error('Command search failed:', error)

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Command search failed.',
      results: [],
    })
  }
}