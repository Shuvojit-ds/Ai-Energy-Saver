import { RagDocument, RagRetrievalResult } from "../types";
import { RAG_KNOWLEDGE_VAULT } from "../data/energyKnowledgeBase";

// Tokenize and clean text into lowercase terms
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Computes relevance score between a query and a RagDocument
export function searchKnowledgeBase(
  query: string,
  vault: RagDocument[] = RAG_KNOWLEDGE_VAULT,
  topK = 3
): RagRetrievalResult[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) {
    return vault.slice(0, topK).map((doc) => ({
      doc,
      score: 1.0,
      matchedSnippets: [doc.summary],
    }));
  }

  const results: RagRetrievalResult[] = [];

  for (const doc of vault) {
    let score = 0;
    const docText = `${doc.title} ${doc.summary} ${doc.fullText}`.toLowerCase();
    const docTerms = tokenize(docText);

    // Term frequency scoring
    for (const term of queryTerms) {
      // Direct keyword matches get boosted
      if (doc.keywords.some((k) => k.toLowerCase().includes(term) || term.includes(k.toLowerCase()))) {
        score += 3.5;
      }
      // Title match boost
      if (doc.title.toLowerCase().includes(term)) {
        score += 2.5;
      }
      // Body term occurrence
      const count = docTerms.filter((t) => t === term).length;
      if (count > 0) {
        score += Math.min(count, 4) * 0.8;
      }
    }

    // Category relevance
    if (
      (query.toLowerCase().includes("solar") && doc.category === "Renewable Solar") ||
      (query.toLowerCase().includes("tariff") && doc.category === "Tariff & Load") ||
      (query.toLowerCase().includes("ac") && doc.id.includes("ac")) ||
      (query.toLowerCase().includes("fan") && doc.id.includes("fan"))
    ) {
      score += 4.0;
    }

    // Extract relevant sentence snippets
    const sentences = doc.fullText.split(/(?<=[.?!])\s+/);
    const matchedSnippets: string[] = [];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasTerm = queryTerms.some((t) => lowerSentence.includes(t));
      if (hasTerm && matchedSnippets.length < 2) {
        matchedSnippets.push(sentence.trim());
      }
    }

    if (matchedSnippets.length === 0) {
      matchedSnippets.push(doc.summary);
    }

    if (score > 0) {
      // Normalize score between 0.40 and 0.99 for display
      const normalizedScore = Number((Math.min(score / 15, 0.59) + 0.4).toFixed(2));
      results.push({
        doc,
        score: normalizedScore,
        matchedSnippets,
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  // If no match found, return the most pertinent baseline documents
  if (results.length === 0) {
    return vault.slice(0, topK).map((doc) => ({
      doc,
      score: 0.5,
      matchedSnippets: [doc.summary],
    }));
  }

  return results.slice(0, topK);
}
