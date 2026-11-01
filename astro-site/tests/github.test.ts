import { describe, expect, it } from 'vitest';
import {
  buildCalendar,
  calendarMonthly,
  currentStreak,
  levelFor,
  weeklyToMonthly,
  type ContributionDay,
} from '../src/lib/github';

describe('levelFor', () => {
  it('returns 0 for zero counts', () => {
    expect(levelFor(0, 10)).toBe(0);
    expect(levelFor(5, 0)).toBe(0);
  });

  it('buckets counts relative to the max', () => {
    expect(levelFor(1, 10)).toBe(1);
    expect(levelFor(3, 10)).toBe(2);
    expect(levelFor(6, 10)).toBe(3);
    expect(levelFor(9, 10)).toBe(4);
  });
});

describe('buildCalendar', () => {
  it('levels days relative to the highest count', () => {
    const weeks = [
      {
        contributionDays: [
          { date: '2026-10-27', contributionCount: 0 },
          { date: '2026-10-28', contributionCount: 4 },
        ],
      },
      {
        contributionDays: [
          { date: '2026-11-01', contributionCount: 2 },
          { date: '2026-11-02', contributionCount: 1 },
        ],
      },
    ];
    const calendar = buildCalendar(weeks);
    expect(calendar).toHaveLength(2);
    expect(calendar[0][0]).toEqual({ date: '2026-10-27', count: 0, level: 0 });
    expect(calendar[0][1].level).toBe(4);
    expect(calendar[1][0].level).toBe(2);
    expect(calendar[1][1].level).toBe(1);
  });
});

describe('currentStreak', () => {
  const day = (date: string, count: number): ContributionDay => ({ date, count, level: 0 });

  it('counts consecutive active days backwards from today', () => {
    const days = ['01', '02', '03', '04', '05'].map((d, i) =>
      day(`2026-11-${d}`, [1, 2, 0, 5, 3][i])
    );
    expect(currentStreak(days, '2026-11-05')).toBe(2);
  });

  it('returns 0 when today has no contributions', () => {
    const days = ['01', '02', '03'].map((d, i) => day(`2026-11-${d}`, [1, 2, 0][i]));
    expect(currentStreak(days, '2026-11-03')).toBe(0);
  });

  it('handles an all-active calendar', () => {
    const days = ['01', '02', '03'].map((d) => day(`2026-11-${d}`, 1));
    expect(currentStreak(days, '2026-11-03')).toBe(3);
  });

  it('ignores future days in the last calendar week', () => {
    const days = ['05', '06', '07'].map((d, i) => day(`2026-11-${d}`, [3, 0, 0][i]));
    expect(currentStreak(days, '2026-11-05')).toBe(1);
  });
});

describe('calendarMonthly', () => {
  it('aggregates days into calendar months, oldest first, capped at 12', () => {
    const weeks: ContributionDay[][] = [
      [
        { date: '2025-12-30', count: 2, level: 1 },
        { date: '2026-01-02', count: 3, level: 1 },
      ],
      [{ date: '2026-01-09', count: 5, level: 1 }],
    ];
    expect(calendarMonthly(weeks)).toEqual([
      { label: 'Dec', count: 2 },
      { label: 'Jan', count: 8 },
    ]);
  });
});

describe('weeklyToMonthly', () => {
  it('sums weekly totals into months, oldest first', () => {
    const week = Math.floor(Date.UTC(2026, 0, 26) / 1000); // Monday 2026-01-26
    const monthly = weeklyToMonthly([3, 4], [week, week + 7 * 86400]);
    expect(monthly).toHaveLength(2);
    expect(monthly[0]).toBe(3);
    expect(monthly[1]).toBe(4);
  });

  it('returns at most 12 months', () => {
    const weekly = Array.from({ length: 53 }, (_, i) => i);
    expect(weeklyToMonthly(weekly)).toHaveLength(12);
  });
});
