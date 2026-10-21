import { ReplitConnectors } from "@replit/connectors-sdk";

export type ProviderId = "github" | "supabase" | "vercel";
export type ProviderStatus = "connected" | "missing" | "error";
export interface ProviderConnection {
  provider: ProviderId;
  status: ProviderStatus;
  message: string;
  checkedAt: string;
}

const connectors = new ReplitConnectors();
const githubConnector = "github-source-control";

const responseStatus = (
  provider: ProviderId,
  status: ProviderStatus,
  message: string,
  checkedAt: string,
): ProviderConnection => ({ provider, status, message, checkedAt });

async function checkGitHub(checkedAt: string): Promise<ProviderConnection> {
  try {
    const connections = await connectors.listConnections({
      connector_names: githubConnector,
      refresh_policy: "auto",
    });
    if (connections.length === 0) {
      return responseStatus("github", "missing", "Connect a GitHub account in Replit.", checkedAt);
    }
    const response = await connectors.proxy(githubConnector, "/user");
    if (!response.ok) {
      return responseStatus("github", "error", `GitHub authorization returned ${response.status}.`, checkedAt);
    }
    return responseStatus("github", "connected", "GitHub account is authorized.", checkedAt);
  } catch {
    return responseStatus("github", "error", "GitHub could not be reached. Check the Replit connection.", checkedAt);
  }
}

async function checkSupabase(checkedAt: string): Promise<ProviderConnection> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectUrl = process.env.SUPABASE_URL;
  if (!accessToken || !projectUrl) {
    return responseStatus("supabase", "missing", "Add the Supabase URL and management token in Replit Secrets.", checkedAt);
  }

  let projectRef: string;
  try {
    projectRef = new URL(projectUrl).hostname.split(".")[0] ?? "";
  } catch {
    return responseStatus("supabase", "error", "SUPABASE_URL is not a valid project URL.", checkedAt);
  }
  if (!/^[a-z0-9]{10,30}$/.test(projectRef)) {
    return responseStatus("supabase", "error", "SUPABASE_URL does not contain a valid project reference.", checkedAt);
  }

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      return responseStatus("supabase", "connected", "Supabase project is authorized.", checkedAt);
    }
    return responseStatus(
      "supabase",
      "error",
      response.status === 401 || response.status === 403
        ? "Supabase token needs database access for this project."
        : `Supabase returned ${response.status}.`,
      checkedAt,
    );
  } catch {
    return responseStatus("supabase", "error", "Supabase could not be reached.", checkedAt);
  }
}

async function checkVercel(checkedAt: string): Promise<ProviderConnection> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return responseStatus("vercel", "missing", "Add a Vercel token in Replit Secrets.", checkedAt);
  }
  try {
    const response = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      return responseStatus("vercel", "connected", "Vercel account is authorized.", checkedAt);
    }
    return responseStatus(
      "vercel",
      "error",
      response.status === 401 || response.status === 403
        ? "Vercel token is invalid or lacks permission."
        : `Vercel returned ${response.status}.`,
      checkedAt,
    );
  } catch {
    return responseStatus("vercel", "error", "Vercel could not be reached.", checkedAt);
  }
}

export async function getProviderConnections(): Promise<ProviderConnection[]> {
  const checkedAt = new Date().toISOString();
  return Promise.all([
    checkGitHub(checkedAt),
    checkSupabase(checkedAt),
    checkVercel(checkedAt),
  ]);
}

export async function requireReadyProviders(): Promise<void> {
  const connections = await getProviderConnections();
  const unavailable = connections.filter((connection) => connection.status !== "connected");
  if (unavailable.length > 0) {
    throw new Error(`Connect all providers before running a job: ${unavailable.map((item) => item.provider).join(", ")}.`);
  }
}

export { connectors, githubConnector };
