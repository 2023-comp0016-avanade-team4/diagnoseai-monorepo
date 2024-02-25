import { BlobServiceClient } from "@azure/storage-blob";
import { v1 as uuidv1 } from "uuid";
import formidable from "formidable";
import { NextApiRequest, NextApiResponse } from "next";
require("dotenv").config();

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw Error("Azure Storage Connection string not found");
}
const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING,
);
const containerClient =
  blobServiceClient.getContainerClient("document-storage");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  //If the request is not a POST request, return a 405 'Method Not Allowed'
  if (req.method == "POST") {
    const form = new formidable.IncomingForm();
    form
      .parse(req, async (error, _, files) => {
        try {
          if (error) {
            throw error;
          }
          const blobName = uuidv1() + files.file?.[0].originalFilename;
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          blockBlobClient
            .uploadFile(files.file?.[0].filepath || "")
            .then((_) => {
              res.status(200).json({ message: "File uploaded successfully" });
            })
            .catch((error) => {
              console.error(error);
              res.status(500).json({ message: "Internal server error" });
            });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Internal server error" });
        }
      });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    externalResolver: true,
  },
};

export default handler;
