import type {
  ActionCommandResult,
  CommandSearchResult,
  ExecuteAICommandContext,
  NavigationCommandResult,
} from "./types";

function createNavigationHrefError(result: NavigationCommandResult) {
  return new Error(`Navigation command "${result.id}" must use an href starting with "/".`);
}

async function resolveNavigationHref(
  result: NavigationCommandResult,
  context: ExecuteAICommandContext,
) {
  return context.resolveHref ? context.resolveHref(result.href, result) : result.href;
}

function resolveAction(
  result: ActionCommandResult,
  actions: ExecuteAICommandContext["actions"],
) {
  return actions?.[result.actionKey];
}

export async function executeAICommand(
  result: CommandSearchResult,
  context: ExecuteAICommandContext,
) {
  try {
    if (result.type === "navigation") {
      const href = await resolveNavigationHref(result, context);

      if (!href) {
        context.onUnresolvedHref?.(result.href, result);
        return;
      }

      if (!href.startsWith("/")) {
        throw createNavigationHrefError(result);
      }

      if (context.routeExists && !context.routeExists(href)) {
        context.onUnknownRoute?.(href, result);
        return;
      }

      await context.navigate(href);
      return;
    }

    const action = resolveAction(result, context.actions);

    if (!action) {
      context.onUnknownAction?.(result.actionKey, result);
      return;
    }

    await action(context);
  } catch (error) {
    context.onExecuteError?.(error, result);
  }
}
