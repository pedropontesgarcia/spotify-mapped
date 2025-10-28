# Spotify Mapped

Spotify Mapped is a project to parse and visualize Spotify playback statistics.
It takes streaming history files from Spotify as input, and produces a visual
representation and compiles statistics.

## Usage

Spotify Mapped can be used by cloning this repository, initializing the web and
backend Node projects with `npm i` on each subdirectory, and running the backend
with `npm start` and the frontend in development mode with `npm run dev`.

## Data

The input data files can be obtained from the Spotify website ([here is a useful
guide from stats.fm](https://support.stats.fm/docs/import/spotify-import/)).
Some sample data files are located in the `data` directory.

## Rationale

Spotify Wrapped is painfully incomplete, and I could not find a free service
online to visualize and aggregate streaming data. There are several
subscription-based paid services that offer this, but the functionality seemed
so simple that I could not justify the cost. Therefore, I made Spotify Mapped.
