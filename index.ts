const { RANGE, WakaTimeClient } = require("wakatime-client") as {
  RANGE: { LAST_7_DAYS: string };
  WakaTimeClient: new (apiKey: string) => {
    getMyStats(options: { range: string }): Promise<WakaTimeStats>;
  };
};

const DEFAULT_OUTPUT_PATH = "wakatime-stats.svg";
const MAX_LANGUAGES = 8;

type WakaTimeLanguage = {
  name: string;
  percent: number;
  text: string;
  total_seconds: number;
};

type WakaTimeStats = {
  data: {
    languages: WakaTimeLanguage[];
  };
};

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };

    return entities[character] ?? character;
  });
}

export function createStatsSvg(languages: WakaTimeLanguage[]): string {
  const rankedLanguages = [...languages]
    .filter((language) => language.total_seconds > 0)
    .sort((first, second) => second.total_seconds - first.total_seconds)
    .slice(0, MAX_LANGUAGES);
  const rowHeight = 32;
  const headerHeight = 72;
  const footerHeight = 32;
  const width = 560;
  const height =
    headerHeight +
    Math.max(1, rankedLanguages.length) * rowHeight +
    footerHeight;

  const rows = rankedLanguages.length
    ? rankedLanguages
        .map((language, index) => {
          const y = headerHeight + index * rowHeight;
          const barWidth = Math.max(2, Math.min(260, language.percent * 2.6));

          return `
    <text x="24" y="${y + 20}" class="language">${escapeXml(language.name)}</text>
    <rect x="190" y="${y + 9}" width="260" height="8" rx="4" class="track" />
    <rect x="190" y="${y + 9}" width="${barWidth.toFixed(1)}" height="8" rx="4" class="bar" />
    <text x="536" y="${y + 20}" text-anchor="end" class="stats">${escapeXml(language.text)} · ${language.percent.toFixed(1)}%</text>`;
        })
        .join("")
    : `
    <text x="24" y="108" class="empty">No coding activity recorded in the last 7 days.</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Weekly Development Stats</title>
  <desc id="description">Most used programming languages in the last 7 days.</desc>
  <style>
    .title { fill: #f8fafc; font: 700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .subtitle, .stats { fill: #94a3b8; font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .language { fill: #e2e8f0; font: 600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .empty { fill: #94a3b8; font: 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .track { fill: #1e293b; }
    .bar { fill: #38bdf8; }
  </style>
  <rect width="100%" height="100%" rx="12" fill="#0f172a" />
  <text x="24" y="32" class="title">Most used languages</text>
  <text x="24" y="53" class="subtitle">WakaTime · last 7 days</text>${rows}
  <text x="24" y="${height - 12}" class="subtitle">Generated from WakaTime</text>
</svg>`;
}

async function getLanguages(apiKey: string): Promise<WakaTimeLanguage[]> {
  const client = new WakaTimeClient(apiKey);
  const stats = await client.getMyStats({ range: RANGE.LAST_7_DAYS });
  return stats.data.languages;
}

async function main(): Promise<void> {
  const apiKey = Bun.env.WAKA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "WAKA_API_KEY is required. Add it to .env or export it in your shell.",
    );
  }

  const outputPath = DEFAULT_OUTPUT_PATH;
  const svg = createStatsSvg(await getLanguages(apiKey));
  await Bun.write(outputPath, svg);
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
