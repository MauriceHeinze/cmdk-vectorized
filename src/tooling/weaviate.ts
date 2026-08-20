import type { CmdkVectorizedIntent, UploadIntentMapOptions, UploadIntentMapResult } from "./tooling-types";
import { readIntentMap } from "./intent-map";

const CLASS_NAME = "CmdkIntent";
const BATCH_SIZE = 50;
const VECTORIZER = "text2vec-openai";
const VECTORIZED_FIELDS = new Set(["section", "label", "phrases", "keywords", "description"]);

const PROPERTY_NAMES = [
  "recordType",
  "section",
  "commandId",
  "label",
  "path",
  "phrases",
  "keywords",
  "setValue",
  "description",
  "actionType",
  "stateKey",
] as const;

export async function uploadIntentMap(options: UploadIntentMapOptions): Promise<UploadIntentMapResult> {
  const env = options.env ?? process.env;
  const weaviateUrl = env.WEAVIATE_URL;
  const weaviateApiKey = env.WEAVIATE_API_KEY;

  if (!weaviateUrl) {
    throw new Error("WEAVIATE_URL is required.");
  }

  if (!weaviateApiKey) {
    throw new Error("WEAVIATE_API_KEY is required.");
  }

  const fetcher = options.fetcher ?? fetch;
  const intents = await readIntentMap(options.cwd);
  const baseUrl = normalizeWeaviateUrl(weaviateUrl);
  const headers = createHeaders(weaviateApiKey);
  const collectionCreated = await ensureCollection({ baseUrl, fetcher, headers });

  let uploadedCount = 0;
  for (let index = 0; index < intents.length; index += BATCH_SIZE) {
    const batch = intents.slice(index, index + BATCH_SIZE);
    await uploadBatch({ baseUrl, fetcher, headers, intents: batch });
    uploadedCount += batch.length;
  }

  return { collectionCreated, uploadedCount };
}

export function createWeaviateClassSchema() {
  return {
    class: CLASS_NAME,
    description: "cmdk-vectorized intent map records.",
    vectorizer: VECTORIZER,
    moduleConfig: {
      [VECTORIZER]: {
        vectorizeClassName: false,
      },
    },
    properties: PROPERTY_NAMES.map((name) => ({
      name,
      dataType: name === "phrases" || name === "keywords" ? ["text[]"] : ["text"],
      moduleConfig: {
        [VECTORIZER]: {
          skip: !VECTORIZED_FIELDS.has(name),
          vectorizePropertyName: false,
        },
      },
    })),
  };
}

async function ensureCollection(options: {
  baseUrl: string;
  fetcher: typeof fetch;
  headers: HeadersInit;
}): Promise<boolean> {
  const response = await options.fetcher(`${options.baseUrl}/v1/schema/${CLASS_NAME}`, {
    method: "GET",
    headers: options.headers,
  });

  if (response.ok) {
    return false;
  }

  if (response.status !== 404) {
    throw new Error(`Weaviate schema lookup failed (${response.status}). ${await safeResponseText(response)}`);
  }

  const createResponse = await options.fetcher(`${options.baseUrl}/v1/schema`, {
    method: "POST",
    headers: options.headers,
    body: JSON.stringify(createWeaviateClassSchema()),
  });

  if (!createResponse.ok) {
    throw new Error(`Weaviate schema creation failed (${createResponse.status}). ${await safeResponseText(createResponse)}`);
  }

  return true;
}

async function uploadBatch(options: {
  baseUrl: string;
  fetcher: typeof fetch;
  headers: HeadersInit;
  intents: CmdkVectorizedIntent[];
}) {
  const response = await options.fetcher(`${options.baseUrl}/v1/batch/objects`, {
    method: "POST",
    headers: options.headers,
    body: JSON.stringify({
      objects: options.intents.map((intent) => ({
        class: CLASS_NAME,
        id: uuidFromCommandId(intent.commandId),
        properties: intent,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Weaviate batch upload failed (${response.status}). ${await safeResponseText(response)}`);
  }
}

function normalizeWeaviateUrl(rawUrl: string): string {
  const withProtocol = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;
  return withProtocol.replace(/\/+$/, "");
}

function createHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function safeResponseText(response: Response): Promise<string> {
  return response.text().catch(() => "");
}

function uuidFromCommandId(commandId: string): string {
  const bytes = new TextEncoder().encode(commandId);
  let hash1 = 0x811c9dc5;
  let hash2 = 0x01000193;

  for (const byte of bytes) {
    hash1 ^= byte;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= byte;
    hash2 = Math.imul(hash2, 0x811c9dc5);
  }

  const hex = `${unsignedHex(hash1)}${unsignedHex(hash2)}${unsignedHex(hash1 ^ hash2)}${unsignedHex(hash1 + hash2)}`;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function unsignedHex(value: number): string {
  return (value >>> 0).toString(16).padStart(8, "0");
}
