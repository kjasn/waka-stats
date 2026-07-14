# waka-stats

Generates a shareable SVG showing your most-used WakaTime languages from the
last 7 days.

## Setup

Add your WakaTime API key to `.env`:

```env
WAKA_API_KEY=your-api-key
```

## Generate

```bash
bun run generate
```

The command writes `wakatime-stats.svg` at the project root.

## Daily profile refresh

The GitHub Actions workflow at `.github/workflows/update-wakatime-stats.yml`
regenerates and commits the SVG every day at midnight UTC. In your repository
settings, add `WAKA_API_KEY` as an Actions secret, then commit and push the
workflow and `wakatime-stats.svg`.

Embed it in your profile README with:

```md
![WakaTime stats](https://raw.githubusercontent.com/<your-username>/<your-profile-repo>/main/wakatime-stats.svg)
```
