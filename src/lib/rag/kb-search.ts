/**
 * Knowledge Base Search — RAG for SA healthcare intelligence.
 *
 * Searches the 300MB compiled knowledge base (13 files + databases):
 * - Law & regulation (Medical Schemes Act, POPIA)
 * - Claims adjudication (rejection codes, decision flowchart)
 * - Coding standards (ICD-10, CCSA tariffs, NAPPI)
 * - PMB & CDL (270 DTPs, 27 CDL with treatments)
 * - Scheme profiles (Discovery, GEMS, Bonitas, etc.)
 * - Pharmaceutical (SEP formula, dispensing fees)
 * - Fraud detection (8 types, R22-28B problem)
 * - Compliance (POPIA, SAHPRA, ISO 13485)
 * - Clinical guidelines
 *
 * Two search modes:
 * 1. File-based: reads compiled MD files directly (fast, no embeddings needed)
 * 2. Vector-based: pgvector semantic search (requires indexing, higher quality)
 */
import { supabaseAdmin } from "@/lib/supabase";
import { readFile } from "fs/promises";
import { join } from "path";

const KB_DIR = join(process.cwd(), "docs", "knowledge");

/** Map topic keywords to KB files */
const KB_FILE_MAP: Record<string, string> = {
  law: "01_law_and_regulation.md",
  regulation: "01_law_and_regulation.md",
  popia: "01_law_and_regulation.md",
  "medical schemes act": "01_law_and_regulation.md",
  claims: "02_claims_adjudication.md",
  rejection: "02_claims_adjudication.md",
  adjudication: "02_claims_adjudication.md",
  coding: "03_coding_standards.md",
  "icd-10": "03_coding_standards.md",
  icd10: "03_coding_standards.md",
  tariff: "03_coding_standards.md",
  nappi: "03_coding_standards.md",
  pmb: "04_pmb_and_cdl.md",
  cdl: "04_pmb_and_cdl.md",
  "chronic disease": "04_pmb_and_cdl.md",
  "prescribed minimum": "04_pmb_and_cdl.md",
  scheme: "05_scheme_profiles.md",
  discovery: "05_scheme_profiles.md",
  gems: "05_scheme_profiles.md",
  bonitas: "05_scheme_profiles.md",
  momentum: "05_scheme_profiles.md",
  pharmaceutical: "06_pharmaceutical.md",
  medicine: "06_pharmaceutical.md",
  drug: "06_pharmaceutical.md",
  dispensing: "06_pharmaceutical.md",
  fraud: "07_fraud_detection.md",
  waste: "07_fraud_detection.md",
  compliance: "08_compliance.md",
  sahpra: "08_compliance.md",
  hpcsa: "08_compliance.md",
  industry: "09_industry_landscape.md",
  vendor: "09_industry_landscape.md",
  competitor: "09_industry_landscape.md",
  market: "10_market_intelligence.md",
  business: "11_business_intelligence.md",
  commercial: "12_commercial_intelligence.md",
  clinical: "13_clinical_guidelines.md",
  guideline: "13_clinical_guidelines.md",
  triage: "13_clinical_guidelines.md",
};

/**
 * Search KB by topic keyword — reads the relevant file and extracts
 * the most relevant sections. Fast, no embeddings needed.
 */
export async function searchKB(
  query: string,
  maxChars = 4000
): Promise<{ source: string; content: string; sections: string[] }> {
  const q = query.toLowerCase();

  // Find matching file(s)
  let fileName = "";
  for (const [keyword, file] of Object.entries(KB_FILE_MAP)) {
    if (q.includes(keyword)) {
      fileName = file;
      break;
    }
  }

  if (!fileName) {
    // Default to claims adjudication for generic health queries
    fileName = "02_claims_adjudication.md";
  }

  try {
    const content = await readFile(join(KB_DIR, fileName), "utf-8");

    // Extract relevant sections based on query keywords
    const lines = content.split("\n");
    const queryWords = q.split(/\s+/).filter((w) => w.length > 3);
    const sections: string[] = [];
    let currentSection = "";
    let currentRelevance = 0;

    for (const line of lines) {
      if (line.startsWith("##")) {
        if (currentSection && currentRelevance > 0) {
          sections.push(currentSection.trim());
        }
        currentSection = line + "\n";
        currentRelevance = 0;
      } else {
        currentSection += line + "\n";
        for (const word of queryWords) {
          if (line.toLowerCase().includes(word)) currentRelevance++;
        }
      }
    }
    if (currentSection && currentRelevance > 0) {
      sections.push(currentSection.trim());
    }

    // Sort by relevance and truncate
    const result = sections.join("\n\n---\n\n").slice(0, maxChars);

    return {
      source: fileName,
      content: result || content.slice(0, maxChars),
      sections: sections.map((s) => s.split("\n")[0]),
    };
  } catch {
    return {
      source: fileName,
      content: `Knowledge base file ${fileName} not available in this deployment.`,
      sections: [],
    };
  }
}

/**
 * Search ICD-10 codes by description or code prefix.
 */
export async function searchICD10(
  query: string,
  limit = 10
): Promise<{ code: string; description: string; pmb: boolean }[]> {
  // Try exact code match first
  if (/^[A-Z]\d{2}/i.test(query)) {
    const { data } = await supabaseAdmin
      .from("pf_icd10_codes")
      .select("code, description, pmb_condition")
      .ilike("code", `${query}%`)
      .limit(limit);

    return (data ?? []).map((d) => ({
      code: d.code,
      description: d.description,
      pmb: d.pmb_condition,
    }));
  }

  // Full-text search on description
  const { data } = await supabaseAdmin
    .from("pf_icd10_codes")
    .select("code, description, pmb_condition")
    .textSearch("description", query.split(" ").join(" & "))
    .limit(limit);

  return (data ?? []).map((d) => ({
    code: d.code,
    description: d.description,
    pmb: d.pmb_condition,
  }));
}

/**
 * Search medicines by name, ingredient, or NAPPI code.
 */
export async function searchMedicines(
  query: string,
  limit = 10
): Promise<{ nappiCode: string; name: string; ingredient: string; sep: number }[]> {
  // NAPPI code search
  if (/^\d{5,}/.test(query)) {
    const { data } = await supabaseAdmin
      .from("pf_medicines")
      .select("nappi_code, trade_name, active_ingredient, sep_price")
      .ilike("nappi_code", `${query}%`)
      .limit(limit);

    return (data ?? []).map((d) => ({
      nappiCode: d.nappi_code,
      name: d.trade_name,
      ingredient: d.active_ingredient ?? "",
      sep: d.sep_price ?? 0,
    }));
  }

  // Name/ingredient search
  const { data } = await supabaseAdmin
    .from("pf_medicines")
    .select("nappi_code, trade_name, active_ingredient, sep_price")
    .textSearch("trade_name", query.split(" ").join(" & "))
    .limit(limit);

  return (data ?? []).map((d) => ({
    nappiCode: d.nappi_code,
    name: d.trade_name,
    ingredient: d.active_ingredient ?? "",
    sep: d.sep_price ?? 0,
  }));
}
