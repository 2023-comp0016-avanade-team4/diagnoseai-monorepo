import type { NextApiRequest, NextApiResponse } from "next";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { checkSearchIndexMiddleware } from "./cognitiveUtils";
import { authGuard } from "./authGuard";

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

async function handler(_req: NextApiRequest, res: NextApiResponse, searchIndex: string) {
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
  // only take maximally 10 documents
  let selectedResults: string[] = [];
  for (let i = 0; i < Math.min(10, count); i++) {
    selectedResults.push(
      (await searchResults.results.next()).value.document.content as string
    );
  }

  res.status(200).json({
    results: selectedResults,
  });
}

export default authGuard(checkSearchIndexMiddleware(
  handler
));
