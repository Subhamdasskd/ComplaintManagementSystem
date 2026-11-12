import { describe, expect, it } from "vitest";
import { shouldEscalate, nextLevel, DEFAULT_ESCALATION_POLICY } from "./escalation";

const HOUR = 3_600_000;
const now = new Date("2026-11-12T12:00:00.000Z");
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * HOUR);

describe("escalation ladder", () => {
  it("moves L1 to L2 and L2 to L3, then stops", () => {
    expect(nextLevel("L1")).toBe("L2");
    expect(nextLevel("L2")).toBe("L3");
    expect(nextLevel("L3")).toBeNull();
  });
});

describe("shouldEscalate", () => {
  const policy = DEFAULT_ESCALATION_POLICY;

  it("escalates an L1 complaint past its 24h window", () => {
    expect(
      shouldEscalate({ status: "OPEN", level: "L1", levelChangedAt: hoursAgo(25), now, policy }),
    ).toBe(true);
  });

  it("leaves an L1 complaint inside its window alone", () => {
    expect(
      shouldEscalate({ status: "WIP", level: "L1", levelChangedAt: hoursAgo(23), now, policy }),
    ).toBe(false);
  });

  it("uses the longer L2 window", () => {
    expect(
      shouldEscalate({ status: "WIP", level: "L2", levelChangedAt: hoursAgo(30), now, policy }),
    ).toBe(false);
    expect(
      shouldEscalate({ status: "WIP", level: "L2", levelChangedAt: hoursAgo(49), now, policy }),
    ).toBe(true);
  });

  it("never escalates closed or rejected complaints", () => {
    expect(
      shouldEscalate({ status: "CLOSED", level: "L1", levelChangedAt: hoursAgo(200), now, policy }),
    ).toBe(false);
    expect(
      shouldEscalate({ status: "REJECTED", level: "L2", levelChangedAt: hoursAgo(200), now, policy }),
    ).toBe(false);
  });

  it("never escalates beyond L3", () => {
    expect(
      shouldEscalate({ status: "OPEN", level: "L3", levelChangedAt: hoursAgo(500), now, policy }),
    ).toBe(false);
  });

  it("honours a custom policy window", () => {
    expect(
      shouldEscalate({
        status: "OPEN",
        level: "L1",
        levelChangedAt: hoursAgo(2),
        now,
        policy: { l1Hours: 1, l2Hours: 1 },
      }),
    ).toBe(true);
  });
});
