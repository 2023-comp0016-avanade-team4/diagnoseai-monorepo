import type { NextApiRequest, NextApiResponse } from "next";
import { BlobServiceClient } from "@azure/storage-blob";
import { v1 as uuidv1 } from "uuid";
import { PendingUploads } from "../../models/pendingUploadsModel";
import formidable from "formidable";
import { authGuard } from "./authGuard";
import { clerkClient } from "@clerk/nextjs";
import { User, getAuth } from "@clerk/nextjs/server";

require("dotenv").config();

async function addProcessingFileToDB(filename: string, user: User) {
  if (user.username === undefined) {
    throw new Error("Username empty");
  }

  if (user.emailAddresses.length < 1) {
    throw new Error("No valid email addresses to send link to");
  }

  await PendingUploads.create({
    filename,
    username: user.username || "123",
    user_email: user.emailAddresses[0].emailAddress,
  });
  console.log(`Filename ${filename} registered in file processing`);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // If the request is not a POST request, return a 405 'Method Not Allowed';
  if (req.method == "POST") {
    const form = formidable({});
    form.parse(req, async (error, _, files) => {
      try {
        if (error) {
          throw error;
        }
        const AZURE_STORAGE_CONNECTION_STRING =
          process.env.AZURE_STORAGE_CONNECTION_STRING;
        const AZURE_STORAGE_CONTAINER_NAME =
          process.env.AZURE_STORAGE_CONTAINER_NAME;
        if (!AZURE_STORAGE_CONNECTION_STRING) {
          throw Error("Azure Storage Connection string not found");
        }
        if (!AZURE_STORAGE_CONTAINER_NAME) {
          throw Error("Azure Storage Container name not found");
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(
          AZURE_STORAGE_CONNECTION_STRING,
        );
        const containerClient = blobServiceClient.getContainerClient(
          AZURE_STORAGE_CONTAINER_NAME,
        );
        const blobName = uuidv1();
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        blockBlobClient
          .uploadFile(files.file?.[0].filepath || "")
          .then(async (_response) => {
            const { userId } = getAuth(req);
            const user = await clerkClient.users.getUser(userId || "");
            await addProcessingFileToDB(blobName, user);
            console.log(`Upload block blob ${blobName} successfully`);
            res.status(200).json({ message: "File uploaded successfully" });
          })
          .catch((error) => {
            console.log("catch inside blockBlobClient.uploadFile");
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
          });
      } catch (error) {
        console.log("catch inside form.parse");
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

export default authGuard(handler);
