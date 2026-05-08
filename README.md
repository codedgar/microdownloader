# Microdownloader

A minimal, open-source GUI for [yt-dlp](https://github.com/yt-dlp/yt-dlp).
macOS first — more platforms coming.

Paste a URL, pick **Auto / Video / Audio**, hit Download. That's it.

> Notarized macOS build, no Homebrew, no PATH wrangling, no dropdowns to bury
> the one button you actually want.

## Why

Most yt-dlp GUIs fall into one of two camps: closed-source commercial apps
(Stacher, Downie, 4K Video Downloader) or open-source projects that aren't
signed/notarized for macOS — meaning users have to right-click → Open or run
`xattr -d com.apple.quarantine` to get past Gatekeeper.

Microdownloader aims for the gap:

- Open-source (MIT)
- Signed and notarized for macOS
- Genuinely tiny — three buttons, one input
- Bundles `yt-dlp` and `ffmpeg` so it works on a fresh machine

## Install

Grab the latest `.dmg` from the [Releases](https://github.com/codedgar/microdownloader/releases)
page, drag the app into `Applications`, done.

## Usage

1. Paste a video URL.
2. Pick a format:
   - **Auto** — best available video+audio, container chosen by yt-dlp
   - **Video** — best mp4 video + m4a audio, merged to mp4
   - **Audio** — best audio extracted as mp3 (highest quality)
3. Click **Download**.
4. Click **Show** to reveal the file in Finder, or change the save folder via
   the footer button.

The save folder is remembered between launches.

## Build from source

You need Node.js 18+ and macOS to build the app.

```bash
git clone git@github.com:codedgar/microdownloader.git
cd microdownloader
npm install   # also runs scripts/fetch-binaries.sh
npm start
```

`npm install` triggers `scripts/fetch-binaries.sh`, which downloads
architecture-appropriate `yt-dlp` and `ffmpeg` binaries into
`resources/bin/` (gitignored). To re-fetch later:

```bash
npm run fetch-binaries
```

To produce a `.dmg`:

```bash
npm run build
```

Note: `npm run build` produces a universal DMG and expects `resources/bin/`
to contain a universal `ffmpeg` binary. The fetch script grabs a binary for
your current architecture only — to build a universal binary, fetch both
arm64 and x86_64 ffmpeg builds and combine them with `lipo`:

```bash
lipo -create ffmpeg-arm64 ffmpeg-x86_64 -output resources/bin/ffmpeg
```

(yt-dlp's macOS release is already universal, so no work needed there.)

## Project layout

```
main.js          — Electron main process, spawns yt-dlp
preload.js       — IPC bridge
renderer.js      — UI logic
index.html       — UI markup
style.css        — UI styles (native macOS vibrancy)
resources/bin/   — bundled yt-dlp and ffmpeg (gitignored)
scripts/         — build/dev scripts
```

Total source code is under 1,000 lines.

## Disclaimer

This tool is for personal use with content you have the right to download.
Respect the terms of service of the sites you use it with, and respect
copyright. Don't use this to redistribute work that isn't yours.

## License

[MIT](./LICENSE) for the Microdownloader source code.

The packaged `.dmg` bundles third-party software (yt-dlp, ffmpeg, Electron) —
see [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).
