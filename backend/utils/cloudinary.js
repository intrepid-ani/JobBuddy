import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({});

console.log(
  "Cloudinary config",
  process.env.CLOUDINARY_CLIENT_NAME ? "Fetch Success" : "Fetch Failed",
  process.env.CLOUDINARY_API_KEY ? "Fetch Success" : "Fetch Failed",
  process.env.CLOUDINARY_CLIENT_SECRET ? "Fetch Success" : "Fetch Failed"
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

// Add retry logic to the upload function
const uploadOnCloudinary = async (filePath, options = {}, maxRetries = 3) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const result = await cloudinary.uploader.upload(filePath, options);
      // Delete the file from the server after successful upload
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete temporary file at ${filePath}:`, err);
        } else {
          console.log(`Successfully deleted temporary file: ${filePath}`);
        }
      });
      return result;
    } catch (error) {
      retries++;

      if (error.code === "ECONNRESET" && retries < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        console.log(`Retrying upload. Attempt ${retries} of ${maxRetries}`);
      } else {
        // If not a connection reset or we've exhausted retries, throw the error
        throw error;
      }
    }
  }
};

export default uploadOnCloudinary;
