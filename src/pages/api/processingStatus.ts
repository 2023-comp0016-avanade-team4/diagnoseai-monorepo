import type { NextApiRequest, NextApiResponse } from "next";
import {
  SearchClient,
  SearchIndexClient,
  SearchIndexerClient,
  AzureKeyCredential,
} from "@azure/search-documents";
import { authGuard } from "./authGuard";
import { PendingUploads } from "../../models/pendingUploadsModel";

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

async function getDocumentCount(searchIndex: string): Promise<number> {
  try {
    const searchClient = new SearchClient(
      AZURE_COGNITIVE_SERVICE_ENDPOINT!,
      searchIndex,
      new AzureKeyCredential(AZURE_COGNITIVE_SERVICE_API_KEY!)
    );
    const searchResults = await searchClient.search("*", {
      select: ["content"],
      includeTotalCount: true,
    });
    let count = searchResults.count ? searchResults.count : 0;
    return count;
  } catch {
    return 0;
  }
}

async function isIndexReady(searchIndex: string): Promise<boolean> {
  /**
   * Uses the pendingUploads method to figure out if a index is done processing.
   */
  // Use PendingUploads to figure out if searchIndex == filename entry existsd
  const pendingUploads = await PendingUploads.findOne({
    where: {
      filename: searchIndex,
    },
  });

  return pendingUploads == null && (await getDocumentCount(searchIndex)) > 0;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { searchIndex } = req.query;

  if (typeof searchIndex !== 'string') {
    res.status(400).json({
      error: "searchIndex must be a string",
    });
    return;
  }

  res.status(200).json({
    ready: await isIndexReady(searchIndex),
  });
}

export default authGuard(handler)
