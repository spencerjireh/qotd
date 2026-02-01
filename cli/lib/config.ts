import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve } from "path";
import { input, confirm } from "@inquirer/prompts";
import pc from "picocolors";

export interface QotdConfig {
  apiUrl?: string;
  apiKey?: string;
}

const CONFIG_PATH = resolve(process.cwd(), ".qotdrc");

export function loadConfig(): QotdConfig {
  try {
    if (!existsSync(CONFIG_PATH)) return {};
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as QotdConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: QotdConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function clearConfig(): void {
  try {
    unlinkSync(CONFIG_PATH);
  } catch {
    // file may not exist
  }
}

export function getRemoteConfig(): { apiUrl: string; apiKey: string } | null {
  // Check .qotdrc first
  const fileConfig = loadConfig();
  if (fileConfig.apiUrl && fileConfig.apiKey) {
    return { apiUrl: fileConfig.apiUrl, apiKey: fileConfig.apiKey };
  }

  // Fall back to environment variables
  const apiUrl = process.env.QOTD_API_URL;
  const apiKey = process.env.QOTD_API_KEY;
  if (apiUrl && apiKey) {
    return { apiUrl, apiKey };
  }

  return null;
}

export async function promptRemoteConfig(): Promise<{ apiUrl: string; apiKey: string }> {
  const config = loadConfig();
  const apiUrl = await input({
    message: "API URL:",
    default: config.apiUrl || "http://localhost:3000",
  });

  const apiKey = await input({
    message: "API Key:",
    default: config.apiKey || "",
  });

  if (!apiUrl || !apiKey) {
    console.error(pc.red("Error: Both API URL and API Key are required."));
    process.exit(1);
  }

  // Test connectivity
  console.log(pc.cyan("Testing connection..."));
  try {
    const testUrl = `${apiUrl.replace(/\/$/, "")}/api/categories`;
    const res = await fetch(testUrl, {
      headers: { "x-api-key": apiKey },
    });

    if (!res.ok) {
      console.log(pc.yellow(`Server responded with ${res.status}. Config saved anyway.`));
    } else {
      console.log(pc.green("Connection successful."));
    }
  } catch (e) {
    console.log(
      pc.yellow(
        `Could not connect to ${apiUrl}: ${e instanceof Error ? e.message : String(e)}. Config saved anyway.`
      )
    );
  }

  const shouldSave = await confirm({
    message: "Save this config to .qotdrc for future use?",
    default: true,
  });

  if (shouldSave) {
    saveConfig({ apiUrl, apiKey });
    console.log(pc.green(`Remote config saved to .qotdrc.`));
  }

  // Set env vars for this session so getRemoteConfig() picks them up
  process.env.QOTD_API_URL = apiUrl;
  process.env.QOTD_API_KEY = apiKey;

  return { apiUrl, apiKey };
}
