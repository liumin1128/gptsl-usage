export interface UsageInfo {
  budgetLimit?: number;
  keyAlias?: string;
  keyName?: string;
  spend: number;
  updatedAt?: string;
  userName?: string;
}

interface ModelBudgetLimit {
  budget_limit?: unknown;
}

interface KeyInfoResponse {
  info?: {
    key_alias?: unknown;
    key_name?: unknown;
    max_budget?: unknown;
    model_max_budget?: unknown;
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
  const keyAlias =
    typeof data.info?.key_alias === "string" ? data.info.key_alias : undefined;
  const updatedAt =
    typeof data.info?.updated_at === "string"
      ? data.info.updated_at
      : undefined;
  const budgetLimit = parseBudgetLimit(
    data.info?.max_budget,
    data.info?.model_max_budget,
  );

  return {
    budgetLimit,
    keyAlias,
    keyName,
    spend,
    updatedAt,
    userName: parseUserName(keyAlias),
  };
}

export function parseUserName(
  keyAlias: string | undefined,
): string | undefined {
  if (!keyAlias) {
    return undefined;
  }

  const separatorIndex = keyAlias.lastIndexOf(" - ");
  const userName =
    separatorIndex >= 0 ? keyAlias.slice(separatorIndex + 3) : keyAlias;
  const trimmedUserName = userName.trim();

  return trimmedUserName || undefined;
}

function parseBudgetLimit(
  maxBudget: unknown,
  modelMaxBudget: unknown,
): number | undefined {
  if (typeof maxBudget === "number" && Number.isFinite(maxBudget)) {
    return maxBudget;
  }

  if (!isRecord(modelMaxBudget)) {
    return undefined;
  }

  const limits = Object.values(modelMaxBudget)
    .map(readModelBudgetLimit)
    .filter((limit): limit is number => limit !== undefined);

  if (limits.length === 0) {
    return undefined;
  }

  return Math.max(...limits);
}

function readModelBudgetLimit(value: unknown): number | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const budget = (value as ModelBudgetLimit).budget_limit;
  return typeof budget === "number" && Number.isFinite(budget)
    ? budget
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
