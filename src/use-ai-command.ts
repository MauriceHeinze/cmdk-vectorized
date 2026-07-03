import { useCallback } from "react";

import { executeAICommand } from "./execute-ai-command";
import type { CommandSearchResult, UseAICommandOptions, UseAICommandResult } from "./types";
import { useAICommandSearch } from "./use-ai-command-search";

export function useAICommand(options: UseAICommandOptions): UseAICommandResult {
  const search = useAICommandSearch(options);

  const execute = useCallback(
    async (result: CommandSearchResult) => {
      await executeAICommand(result, options);
    },
    [options],
  );

  return {
    ...search,
    execute,
  };
}
