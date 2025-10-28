import React, { useEffect, useState } from "react";
import FileUpload from "./components/FileUpload";
import DataVisualization from "./components/DataVisualization";
import TopSongs from "./components/TopSongs";

const App = () => {
  const [data, setData] = useState<Playback[]>();
  useEffect(() => {
    // Set initial scroll position to the right
    window.scrollTo({
      left: document.body.scrollWidth,
      top: 0,
      behavior: "auto",
    });
  }, [data]);

  const handleFileUpload: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    if (!event.target.files) return; // If no files are selected, exit early.

    const formData = new FormData();
    Array.from(event.target.files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Upload failed");
        console.dir(response);
      } else {
        setData(
          (
            await (response.json() as Promise<{
              message: string;
              data?: Playback[];
            }>)
          ).data
        );
      }
    } catch (error) {
      console.error("An error occurred while uploading files:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center h-screen ml-8">
      {!data && <FileUpload onFileChange={handleFileUpload} />}
      {data && <DataVisualization data={data} />}
    </div>
  );
};

export default App;
