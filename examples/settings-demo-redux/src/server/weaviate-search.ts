type GraphQlRow = Record<string, unknown>

type WeaviateAdditional = {
  score?: string | number
  explainScore?: string
}

type ScoredGraphQlRow = GraphQlRow & {
  _additional?: WeaviateAdditional
}

const HYBRID_SEARCH_PROPERTIES = ['label', 'description', 'longDescription'] as const

export type WeaviateRouteRow = {
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

export async function searchWeaviateRoutes(
  query: string,
  limit = 10,
): Promise<WeaviateRouteRow[]> {
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

function stringOrEmpty(value: unknown): string {
  return String(value ?? '').trim()
}

function numberOrUndefined(value: unknown): number | undefined {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}