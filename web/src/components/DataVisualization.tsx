import { useState, useMemo } from "react";
// import { letterFrequency } from "@visx/mock-data";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { scaleLinear, scaleTime } from "@visx/scale";
import { ScaleLinear, ScaleTime } from "@visx/vendor/d3-scale";
import {
  eachMonthOfInterval,
  eachYearOfInterval,
  startOfMonth,
  startOfYear,
} from "date-fns";
import TopSongs from "./TopSongs";
import { Card, Flex, ScrollArea } from "@radix-ui/themes";

type Track = { trackName: string; plays: number; playtime: number };

type Tracks = Map<string, Track>; // where the key is the track name

type Datapoint = {
  date: Date; // Date
  playtime: number; // Playtime in milliseconds
  tracks: Tracks; // Top tracks for the day
};

type Datapoints = Map<string, Datapoint>; // where the key is the date in YYYY-MM-DD format

const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
};

function aggregatePlaytimeByDay(playbacks: Playback[]): Datapoints {
  const datapoints: Datapoints = new Map();
  for (const playback of playbacks) {
    const dateString = playback.ts.split("T")[0];
    if (!datapoints.get(dateString)) {
      datapoints.set(dateString, {
        date: new Date(dateString),
        playtime: 0,
        tracks: new Map(),
      });
    }
    const datapoint = datapoints.get(dateString)!;
    const trackName =
      playback.master_metadata_track_name ?? playback.episode_name;
    if (!datapoint.tracks.get(trackName)) {
      datapoint.tracks.set(trackName, {
        trackName,
        plays: 0,
        playtime: 0,
      });
    }
    const track = datapoint.tracks.get(trackName)!;
    track.plays += 1;
    track.playtime += playback.ms_played;
    datapoint.playtime += playback.ms_played;
  }
  return datapoints;
}

function getNMostPlayedTracksOnDay(
  datapoints: Datapoints,
  date: Date,
  n: number
): Track[] {
  const dateString = date.toISOString().split("T")[0];
  const datapoint = datapoints.get(dateString);
  if (!datapoint) return [];
  return Array.from(datapoint.tracks.values())
    .sort((a, b) =>
      b.plays !== a.plays ? b.plays - a.plays : b.playtime - a.playtime
    )
    .slice(0, n);
}

export default function DataVisualization({ data }: { data: Playback[] }) {
  const [hoveredDate, setHoveredDate] = useState<null | Date>(null);
  // Aggregate the data
  const datapoints = useMemo(() => aggregatePlaytimeByDay(data), [data]);
  console.log(datapoints);

  // Define the graph dimensions and margins
  const barwidth = 30;
  const width = datapoints.size * barwidth;
  const height = 800;
  const margin = { top: 20, bottom: 100, left: 20, right: 20 };

  const minDate = new Date(
    Math.min(...datapoints.values().map(({ date }) => date.getTime()))
  );
  const maxDate = new Date(
    Math.max(...datapoints.values().map(({ date }) => date.getTime()))
  );

  const months = eachMonthOfInterval({
    start: startOfMonth(minDate),
    end: startOfMonth(new Date(maxDate.getTime() - 1)),
  });
  const years = eachYearOfInterval({
    start: startOfYear(minDate),
    end: startOfYear(maxDate),
  });

  // Then we'll create some bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // We'll make some helpers to get at the data we want
  const x = (d: Datapoint) => d.date;
  const y = (d: Datapoint) => d.playtime / 1000 / 60; // Convert milliseconds to minutes

  // And then scale the graph by our data
  const xScale: ScaleTime<number, number> = scaleTime({
    range: [0, xMax],
    round: true,
    domain: [minDate, maxDate],
    // padding: 0.4,
  });
  const yScale: ScaleLinear<number, number> = scaleLinear({
    range: [yMax, 0],
    round: true,
    domain: [0, Math.max(...datapoints.values().map(y))],
  });

  const xPoint = (data: Datapoint) => xScale(x(data));
  const yPoint = (data: Datapoint) => yScale(y(data));
  const vals = Array.from(datapoints.values());
  return (
    <div className="mt-8 text-white">
      <TopSongs data={data} years={years.map((year) => year.getFullYear())} />
      <svg
        width={width}
        height={height}
        onWheel={(e: React.WheelEvent<SVGSVGElement>) => {
          if (e.deltaX !== 0) {
            window.scrollBy({ left: e.deltaX, top: 0, behavior: "auto" });
          }
          // Reverse vertical scroll
          if (e.deltaY !== 0) {
            window.scrollBy({ left: -e.deltaY, top: 0, behavior: "auto" });
          }
        }}
      >
        <rect
          width="100%"
          height="100%"
          fill="transparent"
          onClick={() => setHoveredDate(null)}
        />
        {vals.map((d, i) => {
          const barHeight = yMax - yPoint(d);
          return (
            <Group key={`bar-${i}`}>
              <Bar
                x={xPoint(d) - barwidth / 4}
                y={100}
                width={barwidth * 0.75}
                height={yMax - 100}
                fill="transparent"
                onClick={
                  hoveredDate !== null &&
                  hoveredDate.getTime() == d.date.getTime()
                    ? () => setHoveredDate(null)
                    : () => setHoveredDate(d.date)
                }
              />
              {hoveredDate && hoveredDate.getTime() == d.date.getTime() ? (
                <Bar
                  x={xPoint(d)}
                  y={yMax - barHeight}
                  width={barwidth * 0.25}
                  height={barHeight}
                  fill="#b91d82"
                  onClick={() => setHoveredDate(null)}
                />
              ) : (
                <Bar
                  x={xPoint(d)}
                  y={yMax - barHeight}
                  width={barwidth * 0.25}
                  height={barHeight}
                  fill="#1DB954"
                  onClick={() => setHoveredDate(d.date)}
                />
              )}
            </Group>
          );
        })}
        {/* Render month labels for each year */}
        {years.map((year) => {
          const monthsFiltered = months.filter(
            (d) => d.getFullYear() === year.getFullYear()
          );

          return monthsFiltered.map((month) => {
            return (
              <text
                key={`month-${year}-${month}`}
                x={xScale(month)! + barwidth / 2}
                y={yMax + 20} // Position below the x-axis
                textAnchor="middle"
                fontSize={16}
                fill="white"
              >
                {month.toLocaleString("default", {
                  month: "short",
                })}{" "}
                {/* Month name */}
              </text>
            );
          });
        })}

        {/* Render year labels */}
        {years.map((year) => {
          return (
            <text
              key={`year-${year.getFullYear()}`}
              x={xScale(year)! + barwidth / 2}
              y={yMax + 40} // Position below the month labels
              textAnchor="middle"
              fontSize={20}
              fontWeight="bold"
              fill="white"
              className="sticky left-0"
            >
              {year.getFullYear()}
            </text>
          );
        })}
      </svg>
      {hoveredDate && (
        <Card className="p-8 fixed top-0 left-0 z-20 m-4" id="tooltip">
          <Flex direction="row" justify="between" width="100%">
            <div id="date" className="text-xl font-bold mb-4">
              {hoveredDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div id="date" className="text-lg mb-4 text-gray-500">
              {Math.round(
                datapoints.get(hoveredDate.toISOString().split("T")[0])!
                  .playtime /
                  1000 /
                  60
              )}{" "}
              min
            </div>
          </Flex>
          <ScrollArea
            type="always"
            scrollbars="vertical"
            style={{ maxHeight: 200 }}
          >
            <ol className="list-decimal list-inside">
              {getNMostPlayedTracksOnDay(datapoints, hoveredDate, 100).map(
                (t) => (
                  <li id={`song-${t.trackName}`}>
                    {truncateString(t.trackName, 30)}
                    <span className="ml-2 mr-6 text-gray-500">
                      {t.plays} {t.plays > 1 ? "plays" : "play"}
                    </span>
                  </li>
                )
              )}
            </ol>
          </ScrollArea>
        </Card>
      )}
      <svg
        className="fixed top-8 left-2 h-full z-10 pointer-events-none"
        width={80} // You can adjust the width as needed
        height={height}
      >
        {yScale.ticks(5).map((tickValue, i) => {
          if (i === 0) return;
          const yPos = yScale(tickValue);
          return (
            <g key={`tick-${i}`}>
              <line
                x1={10} // Position on the left (fixed)
                y1={yPos}
                x2={0} // Length of the tick mark
                y2={yPos}
                stroke="white"
                strokeWidth={2}
              />
              {/* Render the tick label */}
              <text
                x={20} // Horizontal offset for the label
                y={yPos + 4}
                textAnchor="start"
                fontSize={14}
                fill="white"
              >
                {tickValue} min
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
