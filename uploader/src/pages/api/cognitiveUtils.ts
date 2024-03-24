import type { NextApiRequest, NextApiResponse } from "next";
import { SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";

require("dotenv").config();

const AZURE_COGNITIVE_SERVICE_ENDPOINT =
  process.env.AZURE_COGNITIVE_SERVICE_ENDPOINT;
const AZURE_COGNITIVE_SERVICE_API_KEY =
  process.env.AZURE_COGNITIVE_SERVICE_API_KEY;

if (!AZURE_COGNITIVE_SERVICE_ENDPOINT) {
  throw Error("Azure Cognitive Service Endpoint not found");
}

if (!AZURE_COGNITIVE_SERVICE_API_KEY) {
  throw Error("Azure Cognitive Service API Key not found");
}

export const indexClient = new SearchIndexClient(
  AZURE_COGNITIVE_SERVICE_ENDPOINT!,
  new AzureKeyCredential(AZURE_COGNITIVE_SERVICE_API_KEY!),
);

async function hasIndex(searchIndex: string): Promise<boolean> {
  // Why this function is required: getIndexStatistics doesn't return
  // undefined / null if the index doesn't exist.  So here we have a
  // sanity check
  const indexes = indexClient.listIndexes();

  // azure uses their own special iterators, so we can't just use the
  // object in array syntax
  for await (const index of indexes) {
    if (index.name === searchIndex) {
      return true;
    }
  }
  return false;
}

export function checkSearchIndexMiddleware(
  fn: (
    req: NextApiRequest,
    res: NextApiResponse,
    searchIndex: string,
  ) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { searchIndex } = req.query;
    if (!searchIndex) {
      console.error("Required parameter (searchIndex) was not specified");
      res.status(400).json({
        message: "Required parameter (searchIndex) was not specified",
      });
      return;
    }

    if (searchIndex instanceof Array) {
      console.error("Required parameter (searchIndex) cannot be an array");
      res.status(400).json({
        message: "Required parameter (searchIndex) cannot be an array",
      });
      return;
    }

    if (!(await hasIndex(searchIndex))) {
      console.error("Search index is invalid.");
      res.status(400).json({
        message: "Invalid search index",
      });
      return;
    }

    await fn(req, res, searchIndex);
  };
}
