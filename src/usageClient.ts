export interface UsageInfo {
  keyName?: string;
  spend: number;
  updatedAt?: string;
}

interface KeyInfoResponse {
  info?: {
    key_name?: unknown;
    spend?: unknown;
    updated_at?: unknown;
  };
}

const USAGE_ENDPOINT = "https://genai-models-nonprod.sq.com.sg/key/info";

export async function fetchUsageInfo(apiKey: string): Promise<UsageInfo> {
  const url = new URL(USAGE_ENDPOINT);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as KeyInfoResponse;
  return parseUsageInfo(data);
}

export function parseUsageInfo(data: KeyInfoResponse): UsageInfo {
  const spend = data.info?.spend;

  if (typeof spend !== "number" || !Number.isFinite(spend)) {
    throw new Error("Response is missing a valid info.spend value");
  }

  const keyName =
    typeof data.info?.key_name === "string" ? data.info.key_name : undefined;
  const updatedAt =
    typeof data.info?.updated_at === "string"
      ? data.info.updated_at
      : undefined;

  return {
    keyName,
    spend,
    updatedAt,
  };
}
