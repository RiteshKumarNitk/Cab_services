export function calculateLeadScore(followUps: Array<{ outcome: string | null; leadScore: number | null }>): number {
  if (followUps.length === 0) return 0;

  const scores = followUps.filter(f => f.leadScore !== null).map(f => f.leadScore as number);
  if (scores.length === 0) return 0;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  const positiveOutcomes = followUps.filter(f => f.outcome === "INTERESTED" || f.outcome === "CONVERTED").length;
  const totalWithOutcome = followUps.filter(f => f.outcome !== null).length;
  const outcomeBonus = totalWithOutcome > 0 ? (positiveOutcomes / totalWithOutcome) * 20 : 0;

  return Math.min(Math.round(avg * 10 + outcomeBonus), 100);
}
