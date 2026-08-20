import { useCallback } from "react";

import { executeAICommand } from "../../core/execute-ai-command";
import type { CommandSearchResult } from "../../core/command-types";
import type { UseAICommandOptions, UseAICommandResult } from "../types";
import { useAICommandSearch } from "./use-ai-command-search";
import { useLatest } from "../shared/hooks/use-latest";

export function useAICommand(options: UseAICommandOptions): UseAICommandResult {
  const search = useAICommandSearch(options);
  const executionContextRef = useLatest(options);

  const execute = useCallback(
    async (result: CommandSearchResult) => {
      await executeAICommand(result, executionContextRef.current);
    },
    [executionContextRef],
  );

  return {
    ...search,
    execute,
  };
}
