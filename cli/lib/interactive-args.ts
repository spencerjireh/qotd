export interface GenerateAnswers {
  count: number;
  category: string;
  level: number;
  dryRun: boolean;
}

export interface ListAnswers {
  category: string;
  level: number;
  search: string;
}

export interface EditAnswers {
  id: number;
  text: string;
  level: number;
  categories: string;
}

export interface DeleteAnswers {
  mode: "by-id" | "all";
  ids: string[];
}

function withModeFlag(args: string[], modeFlag?: string): string[] {
  if (modeFlag) {
    // Insert mode flag right after ["node", "qotd"]
    args.splice(2, 0, modeFlag);
  }
  return args;
}

export function buildGenerateArgs(answers: GenerateAnswers, modeFlag?: string): string[] {
  const args = ["node", "qotd", "generate", "-n", String(answers.count)];
  if (answers.category) args.push("-c", answers.category);
  if (answers.level) args.push("-l", String(answers.level));
  if (answers.dryRun) args.push("--dry-run");
  return withModeFlag(args, modeFlag);
}

export function buildListArgs(answers: ListAnswers, modeFlag?: string): string[] {
  const args = ["node", "qotd", "list"];
  if (answers.category) args.push("-c", answers.category);
  if (answers.level) args.push("-l", String(answers.level));
  if (answers.search) args.push("-s", answers.search);
  return withModeFlag(args, modeFlag);
}

export function buildEditArgs(answers: EditAnswers, modeFlag?: string): string[] {
  const args = ["node", "qotd", "edit", String(answers.id)];
  if (answers.text) args.push("-t", answers.text);
  if (answers.level) args.push("-l", String(answers.level));
  if (answers.categories) args.push("-c", answers.categories);
  return withModeFlag(args, modeFlag);
}

export function buildDeleteArgs(answers: DeleteAnswers, modeFlag?: string): string[] {
  if (answers.mode === "all") {
    return withModeFlag(["node", "qotd", "delete", "--all"], modeFlag);
  }
  return withModeFlag(["node", "qotd", "delete", ...answers.ids], modeFlag);
}

export function buildStatsArgs(modeFlag?: string): string[] {
  return withModeFlag(["node", "qotd", "stats"], modeFlag);
}
