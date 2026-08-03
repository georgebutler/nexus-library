function getOrdinalSuffix(day: number) {
  if (day >= 11 && day <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatLongDate(value: string | null): string {
  if (!value) {
    return "Release TBA";
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "Release TBA";
  }

  const month = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(date);
  const day = date.getUTCDate();
  return `${month} ${day}${getOrdinalSuffix(day)}, ${date.getUTCFullYear()}`;
}
