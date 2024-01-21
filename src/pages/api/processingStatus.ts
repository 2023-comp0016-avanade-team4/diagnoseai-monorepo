import type { NextApiRequest, NextApiResponse } from "next";
import {
  SearchClient,
  SearchIndexClient,
  SearchIndexerClient,
  AzureKeyCredential,
} from "@azure/search-documents";
import { indexClient, checkSearchIndexMiddleware } from "./cognitiveUtils";
import { authGuard } from "./authGuard";

async function isIndexReady(searchIndex: string): Promise<boolean> {
  /**
   * Checks if a search index is ready. It relies on the fact that the
   * document count will be non-zero to check if the index is ready.
   * If the search index doesn't exist, this will return false.
   */
  const index = await indexClient.getIndexStatistics(searchIndex);
  return index.documentCount > 0;
}

async function handler(req: NextApiRequest, res: NextApiResponse, searchIndex: string) {
  res.status(200).json({
    ready: await isIndexReady(searchIndex),
  });
}

export default authGuard(checkSearchIndexMiddleware(
  handler
));
