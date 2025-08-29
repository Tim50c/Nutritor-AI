// Simple data generator so the chart
export function generateMockCalories() {
// generate sample daily entries for a month
  const base = new Date(2025, 3, 1); // Apr 1 2025 (month is 0-based)
  const entries: { date: string; value: number }[] = [];


// using the exact numbers seen in screenshot for a single week
  const weekVals = [1000, 1200, 1100, 1600, 1400, 2600, 1800];
  for (let i = 0; i < weekVals.length; i++) {
    const d = new Date(2025, 3, 1 + i);
    entries.push({ date: d.toISOString(), value: weekVals[i] });
  }


// add more sample days across the month
  for (let i = 7; i < 30; i++) {
    const d = new Date(2025, 3, 1 + i);
    entries.push({ date: d.toISOString(), value: Math.round(800 + Math.random() * 2200) });
  }


  return entries;
}