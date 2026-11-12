import { describe, expect, it } from "vitest";
import { dueAt, formatDuration, isOverdue, slaConsumed, DEFAULT_SLA_POLICY } from "./sla";

const HOUR = 3_600_000;

describe("SLA policy", () => {
  it("uses the documented hours per priority", () => {
    expect(DEFAULT_SLA_POLICY).toEqual({ LOW: 120, MEDIUM: 72, HIGH: 24, CRITICAL: 4 });
  });

  it("computes a due date from the creation time", () => {
    const created = new Date("2026-11-12T00:00:00.000Z");
    expect(dueAt(created, "CRITICAL").getTime()).toBe(created.getTime() + 4 * HOUR);
    expect(dueAt(created, "HIGH").getTime()).toBe(created.getTime() + 24 * HOUR);
    expect(dueAt(created, "MEDIUM").getTime()).toBe(created.getTime() + 72 * HOUR);
    expect(dueAt(created, "LOW").getTime()).toBe(created.getTime() + 120 * HOUR);
  });

  it("allows a custom policy override", () => {
    const created = new Date("2026-11-12T00:00:00.000Z");
    expect(dueAt(created, "HIGH", { LOW: 1, MEDIUM: 1, HIGH: 2, CRITICAL: 1 }).getTime()).toBe(
      created.getTime() + 2 * HOUR,
    );
  });
});

describe("overdue detection", () => {
  const due = new Date("2026-11-12T10:00:00.000Z");

  it("flags complaints past their due date", () => {
    expect(isOverdue(due, "OPEN", new Date("2026-11-12T11:00:00.000Z"))).toBe(true);
  });

  it("ignores complaints still inside their window", () => {
    expect(isOverdue(due, "WIP", new Date("2026-11-12T09:00:00.000Z"))).toBe(false);
  });

  it("never flags closed or rejected complaints", () => {
    expect(isOverdue(due, "CLOSED", new Date("2026-11-13T00:00:00.000Z"))).toBe(false);
    expect(isOverdue(due, "REJECTED", new Date("2026-11-13T00:00:00.000Z"))).toBe(false);
  });
});

describe("SLA consumption", () => {
  const created = new Date("2026-11-12T00:00:00.000Z");
  const due = new Date("2026-11-12T10:00:00.000Z");

  it("is 0 at creation", () => {
    expect(slaConsumed(created, due, created)).toBe(0);
  });

  it("is 50 percent at the midpoint", () => {
    expect(slaConsumed(created, due, new Date("2026-11-12T05:00:00.000Z"))).toBe(50);
  });

  it("clamps past the deadline", () => {
    expect(slaConsumed(created, due, new Date("2026-11-12T20:00:00.000Z"))).toBe(100);
  });
});

describe("formatDuration", () => {
  it("renders days, hours and minutes", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(48)).toBe("48m");
    expect(formatDuration(3 * 60 + 12)).toBe("3h 12m");
    expect(formatDuration(2 * 1440 + 4 * 60)).toBe("2d 4h");
    expect(formatDuration(null)).toBe("—");
  });
});
