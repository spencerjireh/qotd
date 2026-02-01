import { getRemoteConfig, promptRemoteConfig } from "./config";
import { HttpDataClient } from "./data-client-http";
import { PrismaDataClient } from "./data-client-prisma";

export type ModeOverride = "local" | "remote" | null;

let modeOverride: ModeOverride = null;

export function setModeOverride(mode: ModeOverride): void {
  modeOverride = mode;
  cachedClient = null;
}

export function getModeOverride(): ModeOverride {
  return modeOverride;
}

export function getActiveMode(): { mode: "local" | "remote"; remote?: { apiUrl: string } } {
  if (modeOverride === "local") {
    return { mode: "local" };
  }
  if (modeOverride === "remote") {
    const remote = getRemoteConfig();
    return { mode: "remote", remote: remote ? { apiUrl: remote.apiUrl } : undefined };
  }
  const remote = getRemoteConfig();
  if (remote) {
    return { mode: "remote", remote: { apiUrl: remote.apiUrl } };
  }
  return { mode: "local" };
}

export interface QuestionData {
  id: number;
  text: string;
  textNorm?: string | null;
  seriousnessLevel: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  categories: CategoryData[];
}

export interface CategoryData {
  id: number;
  name: string;
  color: string;
}

export interface CategoryWithCount extends CategoryData {
  questionCount: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId: number | null;
  existingText: string | null;
}

export interface StatsData {
  total: number;
  byLevel: { seriousnessLevel: number; count: number }[];
  byCategory: { name: string; color: string; count: number }[];
}

export interface CreateQuestionInput {
  text: string;
  textNorm?: string;
  seriousnessLevel: number;
  categoryNames: string[];
}

export interface UpdateQuestionInput {
  text?: string;
  seriousnessLevel?: number;
  categoryIds?: number[];
}

export interface ListQuestionsFilter {
  category?: string;
  seriousnessLevel?: number;
  search?: string;
  limit?: number;
}

export interface BulkCreateResult {
  created: QuestionData[];
  errors: { index: number; text: string; error: string }[];
}

export interface DataClient {
  createQuestion(input: CreateQuestionInput): Promise<QuestionData>;
  createQuestionsBulk(inputs: CreateQuestionInput[]): Promise<BulkCreateResult>;
  listQuestions(filter?: ListQuestionsFilter): Promise<QuestionData[]>;
  getQuestion(id: number): Promise<QuestionData | null>;
  updateQuestion(id: number, input: UpdateQuestionInput): Promise<QuestionData>;
  deleteQuestion(id: number): Promise<void>;
  deleteQuestions(ids?: number[]): Promise<number>;
  getQuestionCount(): Promise<number>;
  getAllQuestionTexts(): Promise<string[]>;
  checkDuplicate(text: string): Promise<DuplicateCheckResult>;
  listCategories(): Promise<CategoryData[]>;
  listCategoriesWithCount(): Promise<CategoryWithCount[]>;
  getStats(): Promise<StatsData>;
}

let cachedClient: DataClient | null = null;

export async function ensureRemoteConfig(): Promise<void> {
  if (modeOverride !== "remote") return;
  const remote = getRemoteConfig();
  if (remote) return;

  if (!process.stdin.isTTY) {
    console.error(
      "Error: --remote requires remote config. Set QOTD_API_URL and QOTD_API_KEY, or create .qotdrc."
    );
    process.exit(1);
  }

  await promptRemoteConfig();
}

export function createDataClient(): DataClient {
  if (cachedClient) return cachedClient;

  if (modeOverride === "local") {
    cachedClient = new PrismaDataClient();
    return cachedClient;
  }

  if (modeOverride === "remote") {
    const remote = getRemoteConfig();
    if (!remote) {
      throw new Error("Remote config not available. Call ensureRemoteConfig() first.");
    }
    cachedClient = new HttpDataClient(remote.apiUrl, remote.apiKey);
    return cachedClient;
  }

  const remote = getRemoteConfig();
  if (remote) {
    cachedClient = new HttpDataClient(remote.apiUrl, remote.apiKey);
  } else {
    cachedClient = new PrismaDataClient();
  }

  return cachedClient;
}
