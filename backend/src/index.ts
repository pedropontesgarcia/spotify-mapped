import express from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import cors from "cors";
import * as fs from "fs";

const port = 3000;

const app = express();

const corsOptions = {
  origin: "*", // FIXME: Change this to the actual domain
  methods: "POST",
  allowedHeaders: ["Content-Type", "Access-Control-Allow-Origin"],
  credentials: true,
};

function combineJSONLists(files: string[]): any[] | undefined {
  const combinedList: any[] = [];

  for (const file of files) {
    try {
      // Read and parse the file
      const rawData = fs.readFileSync(file, "utf8");
      const list: any[] = JSON.parse(rawData); // Ensure top-level content is an array

      // Combine the lists
      combinedList.push(...list);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  return combinedList;
}

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (_, file: Express.Multer.File, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const multi_upload = multer({
  storage: storage,
  limits: { fileSize: 104857600 }, // 100MB
  fileFilter: (_, file: Express.Multer.File, cb: FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".json") {
      cb(null, true);
    } else {
      cb(null, false);
      const err = new Error("Only .json allowed!");
      err.name = "ExtensionError";
      return cb(err);
    }
  },
}).array("files", 5);

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.post("/upload", (req, res) => {
  console.log("Request received");
  console.dir(req, { depth: null, colors: true });
  multi_upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      res
        .status(500)
        .send({ error: { message: `Multer uploading error: ${err.message}` } });
      console.log("Multer error sending files");
      return;
    } else if (err) {
      if (err.name == "ExtensionError") {
        res.status(413).send({ error: { message: err.message } });
      } else {
        res.status(500).send({
          error: { message: `unknown uploading error: ${err.message}` },
        });
      }
      console.log("Error sending files");
      return;
    }
    console.log("Files received successfully");
    const filenames = (req.files as Express.Multer.File[]).map(
      (file) => file.path
    );
    const combinedList = combineJSONLists(filenames);
    res.status(200).send({
      message: "Files uploaded successfully",
      data: combinedList,
    });
  });
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
