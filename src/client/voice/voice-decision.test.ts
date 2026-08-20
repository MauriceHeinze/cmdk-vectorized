import { describe, expect, it } from "vitest";

import type { CommandSearchResult } from "../../core/command-types";
import { resolveVoiceDecision } from "./voice-decision";

describe("resolveVoiceDecision", () => {
  const defaults = {
    minConfidence: 0.6,
    autoExecute: "single" as const,
    peerGap: 0.15,
    stepGap: 0.05,
    voiceListLimit: 3,
  };

  const home = {
    id: "nav.home",
    type: "navigation" as const,
    title: "Home",
    href: "/home",
    score: 0.95,
  };
  const docs = {
    id: "nav.docs",
    type: "navigation" as const,
    title: "Docs",
    href: "/docs",
    score: 0.9,
  };
  const components = {
    id: "nav.components",
    type: "navigation" as const,
    title: "Components",
    href: "/components",
    score: 0.88,
  };

  it("routes straight for a single confident hit (single mode)", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [home],
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.decision).toBe("executed");
    expect(resolved.destinationHref).toBe("/home");
    expect(resolved.top).toEqual(home);
  });

  it("shows a list when peer-band destinations disagree", () => {
    // Scores within stepGap of neighbors and peerGap of top → full band, 3 pages
    const resolved = resolveVoiceDecision({
      ...defaults,
      stepGap: 0.05,
      peerGap: 0.15,
      results: [
        { ...home, score: 0.92 },
        { ...docs, score: 0.9 },
        { ...components, score: 0.88 },
      ],
    });

    expect(resolved.shouldExecute).toBe(false);
    expect(resolved.decision).toBe("ambiguous");
    expect(resolved.results.length).toBeGreaterThanOrEqual(2);
  });

  it("caps displayed results with voiceListLimit", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [
        { ...home, score: 0.95 },
        { ...docs, score: 0.94 },
        { ...components, score: 0.93 },
        { ...home, id: "nav.extra", href: "/extra", score: 0.92 },
      ],
      autoExecute: "never",
      voiceListLimit: 2,
      stepGap: 0.05,
    });

    expect(resolved.results).toHaveLength(2);
    expect(resolved.shouldExecute).toBe(false);
  });

  it("treats true as always and false as never", () => {
    expect(
      resolveVoiceDecision({
        ...defaults,
        results: [home, docs],
        autoExecute: true,
      }).shouldExecute,
    ).toBe(true);

    expect(
      resolveVoiceDecision({
        ...defaults,
        results: [home],
        autoExecute: false,
      }).shouldExecute,
    ).toBe(false);
  });

  it("returns empty when nothing passes confidence", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [{ ...home, score: 0.1 }],
      minConfidence: 0.7,
    });

    expect(resolved.decision).toBe("empty");
    expect(resolved.shouldExecute).toBe(false);
  });

  it("billing fixture: same-page action+nav → navigate to billing (not list, not leaf action)", () => {
    const billingResults: CommandSearchResult[] = [
      {
        id: "settings.billing.update-card",
        type: "action",
        title: "Update payment card",
        description: "Change the credit card used for billing",
        actionKey: "settings.billing.update-card",
        href: "/settings/billing",
        score: 0.7216892242431641,
      },
      {
        id: "settings.billing.open",
        type: "navigation",
        title: "Billing settings",
        description: "Update your payment method, download invoices, and change your plan",
        href: "/settings/billing",
        score: 0.6923880577087402,
      },
      {
        id: "settings.plans.open",
        type: "navigation",
        title: "Plans",
        description: "Compare plans, upgrade, or change billing frequency",
        href: "/settings/plans",
        score: 0.6344346702098846,
      },
      {
        id: "settings.billing.cancel",
        type: "action",
        title: "Cancel subscription",
        actionKey: "settings.billing.cancel",
        href: "/settings/billing",
        score: 0.633653074502945,
      },
      {
        id: "settings.profile.open",
        type: "navigation",
        title: "Profile settings",
        href: "/settings/profile",
        score: 0.6167759895324707,
      },
    ];

    const resolved = resolveVoiceDecision({
      ...defaults,
      results: billingResults,
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.decision).toBe("executed");
    expect(resolved.destinationHref).toBe("/settings/billing");
    expect(resolved.top?.type).toBe("navigation");
    expect(resolved.top?.type === "navigation" && resolved.top.href).toBe("/settings/billing");
    // Prefer the real navigation row when present
    expect(resolved.top?.id).toBe("settings.billing.open");
  });

  it("profile cluster: action siblings share href → navigate to profile", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [
        {
          id: "settings.profile.open",
          type: "navigation",
          title: "Profile settings",
          href: "/settings/profile",
          score: 0.91,
        },
        {
          id: "settings.profile.save",
          type: "action",
          title: "Save profile",
          actionKey: "settings.profile.save",
          href: "/settings/profile",
          score: 0.89,
        },
        {
          id: "settings.profile.upload-avatar",
          type: "action",
          title: "Upload avatar",
          actionKey: "settings.profile.upload-avatar",
          href: "/settings/profile",
          score: 0.88,
        },
      ],
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.destinationHref).toBe("/settings/profile");
    expect(resolved.top?.id).toBe("settings.profile.open");
  });

  it("large score gap: only top is a peer → navigate without listing far results", () => {
    const resolved = resolveVoiceDecision({
      ...defaults,
      results: [
        { ...home, score: 0.9 },
        { ...docs, score: 0.55 },
      ],
    });

    expect(resolved.shouldExecute).toBe(true);
    expect(resolved.destinationHref).toBe("/home");
    expect(resolved.results).toHaveLength(1);
  });
});
