import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const updatede_path = path.join(__dirname, "../public/temp");

console.log("updatede_path", updatede_path);

if (!fs.existsSync(updatede_path)) {
  fs.mkdirSync(updatede_path, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, updatede_path);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});
