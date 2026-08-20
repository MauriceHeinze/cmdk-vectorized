/** Host route helper (not a running process). Ranking stays in the host `search` callback. */
export { createCommandSearchHandler } from "./search-handler/create-command-search-handler";

export type {
  ActionCommandResult,
  CommandSearchResult,
  CreateCommandSearchHandlerOptions,
  NavigationCommandResult,
} from "./core/command-types";
