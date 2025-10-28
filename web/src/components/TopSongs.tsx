import {
  Box,
  Button,
  Card,
  Container,
  DropdownMenu,
  Flex,
  ScrollArea,
} from "@radix-ui/themes";
import { useState } from "react";

const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
};

export default function TopSongs({
  data,
  years,
}: {
  data: Playback[];
  years: number[];
}) {
  const [selectedItem, setSelectedItem] = useState<number>(Math.max(...years));
  const aggregateTopSongs = (
    playbacks: Playback[],
    year: number
  ): Record<string, number> => {
    const topSongs: Record<string, number> = {};

    for (const playback of playbacks) {
      const playbackYear = new Date(playback.ts).getFullYear();

      // Filter by year unless year is 0 (all-time)
      if (year !== 0 && playbackYear !== year) {
        continue;
      }

      if (
        !topSongs[playback.master_metadata_track_name] ||
        playback.master_metadata_track_name === null
      ) {
        topSongs[playback.master_metadata_track_name] = 0;
      }
      topSongs[playback.master_metadata_track_name] += playback.ms_played;
    }
    console.log("calc top songs");
    return topSongs;
  };

  return (
    <Card className="fixed top-0 right-0 p-8 m-4">
      <div className="flex flex-col items-center">
        <Flex direction="row" justify="between" width="100%">
          <h2 className="text-2xl font-bold mb-3">Top Songs</h2>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="soft">
                {selectedItem === 0 ? "All time" : selectedItem}
                <DropdownMenu.TriggerIcon />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item key={0} onSelect={() => setSelectedItem(0)}>
                All time
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              {years
                .map((year) => (
                  <DropdownMenu.Item
                    key={year}
                    onSelect={() => setSelectedItem(year)}
                  >
                    {year}
                  </DropdownMenu.Item>
                ))
                .reverse()}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
        <ScrollArea type="always" scrollbars="vertical" style={{ height: 200 }}>
          <ol className="list-decimal list-inside mt-3 w-full">
            {Object.entries(aggregateTopSongs(data, selectedItem))
              .sort((a, b) => b[1] - a[1])
              .map(([trackId, playtime]) => (
                <li key={trackId} className="text-left">
                  <span>{truncateString(trackId, 20)}</span>
                  <span className="ml-2 mr-6 text-gray-500">
                    {Math.round(playtime / 1000 / 60)} min
                  </span>
                </li>
              ))}
          </ol>
        </ScrollArea>
      </div>
    </Card>
  );
}
