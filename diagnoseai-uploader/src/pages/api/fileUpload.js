const { DefaultAzureCredential } = require('@azure/identity');
const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
const formidable = require('formidable');
require("dotenv").config();

async function handler(req, res) {
  console.log(req);
  const form = new formidable.IncomingForm();
  form.parse(req, async (error, fields, files) => {
    try {
      if (error) {
        throw error;
      }

      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      if (!accountName) {
        throw new Error('Azure Storage accountName not found');
      }

      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        new DefaultAzureCredential()
      );

      const containerClient = blobServiceClient.getContainerClient("document-storage");
      const blobName = uuidv1() + files.file.name;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      blockBlobClient.uploadFile(files.file.path).then((response) => {

      console.log(`Upload block blob ${blobName} successfully`);
      res.status(200).json({ message: "File uploaded successfully" });
    }).catch((error) => {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

export default handler;

