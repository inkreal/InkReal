export function getTimeOfDayGreeting(): { line: string; context: string } {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 5) {
    return { line: "Burning the midnight oil", context: "The quiet hours, when stories find their voice." };
  }
  if (hour >= 5 && hour < 9) {
    return { line: "First light, fresh page", context: "A new morning for new words." };
  }
  if (hour >= 9 && hour < 12) {
    return { line: "The page is waiting", context: "Morning clarity for clear sentences." };
  }
  if (hour >= 12 && hour < 17) {
    return { line: "Midday musings", context: "The afternoon is yours to fill." };
  }
  if (hour >= 17 && hour < 21) {
    return { line: "Golden hour, golden prose", context: "Evening light invites reflection." };
  }
  return { line: "Burning the midnight oil", context: "The night belongs to the storyteller." };
}
