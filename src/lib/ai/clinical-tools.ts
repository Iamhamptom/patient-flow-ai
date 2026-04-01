/**
 * Clinical Intelligence Tools — unique to Patient Flow AI.
 * NOT duplicating Netcare Health OS Doctor features.
 *
 * These give FlowBot healthcare domain knowledge:
 * - Knowledge Base search (300MB SA healthcare intelligence)
 * - ICD-10 code lookup (41K SA codes)
 * - Medicine search (NAPPI + SEP pricing)
 * - Clinical triage (urgency assessment from patient messages)
 * - Billing assist (claims coding suggestions)
 * - HL7v2 message parsing (CareOn bridge translator)
 */
import { tool } from "ai";
import { z } from "zod";
import { searchKB, searchICD10, searchMedicines } from "@/lib/rag/kb-search";
import { parseHL7Message } from "@/lib/hl7/parser";

export function createClinicalTools() {
  return {
    search_knowledge_base: tool({
      description:
        "Search the SA healthcare knowledge base — 300MB of compiled intelligence covering law (Medical Schemes Act, POPIA), claims adjudication, ICD-10 coding, PMBs, scheme profiles, pharmaceuticals, fraud, compliance, and clinical guidelines. Use this BEFORE answering any health/claims/regulatory question.",
      inputSchema: z.object({
        query: z.string().describe("Search query — use specific terms like 'PMB diabetes', 'GEMS tariff', 'POPIA breach notification', 'ICD-10 rejection codes'"),
        maxChars: z.number().optional().describe("Max characters to return (default 4000)"),
      }),
      execute: async ({ query, maxChars }) => {
        return searchKB(query, maxChars);
      },
    }),

    search_icd10: tool({
      description:
        "Search ICD-10 diagnosis codes (SA WHO version, NOT US ICD-10-CM). Search by code prefix (e.g. 'E11' for diabetes) or description (e.g. 'hypertension'). Returns code, description, and PMB status.",
      inputSchema: z.object({
        query: z.string().describe("ICD-10 code prefix (e.g. E11) or description text (e.g. 'diabetes mellitus')"),
        limit: z.number().optional(),
      }),
      execute: async ({ query, limit }) => {
        const results = await searchICD10(query, limit);
        return {
          count: results.length,
          codes: results,
          note: results.length === 0
            ? "No codes found. Try broader search terms. SA uses WHO ICD-10, not US ICD-10-CM."
            : undefined,
        };
      },
    }),

    search_medicines: tool({
      description:
        "Search SA medicine database — NAPPI codes, trade names, active ingredients, SEP (Single Exit Price). Search by name (e.g. 'metformin'), ingredient, or NAPPI code.",
      inputSchema: z.object({
        query: z.string().describe("Medicine name, ingredient, or NAPPI code"),
        limit: z.number().optional(),
      }),
      execute: async ({ query, limit }) => {
        const results = await searchMedicines(query, limit);
        return {
          count: results.length,
          medicines: results,
          note: results.length === 0
            ? "No medicines found. Try the trade name or active ingredient."
            : undefined,
        };
      },
    }),

    clinical_triage: tool({
      description:
        "Assess the urgency of a patient message or symptom description. Returns urgency level (EMERGENCY/URGENT/SEMI-URGENT/ROUTINE) with recommended action. IMPORTANT: This is decision support — clinical responsibility stays with the practitioner.",
      inputSchema: z.object({
        message: z.string().describe("Patient's message or symptom description"),
        patientAge: z.number().optional(),
        patientGender: z.string().optional(),
      }),
      execute: async ({ message, patientAge, patientGender }) => {
        const m = message.toLowerCase();

        // Emergency keywords
        const emergencyTerms = [
          "chest pain", "can't breathe", "cannot breathe", "difficulty breathing",
          "severe bleeding", "loss of consciousness", "unconscious", "seizure",
          "stroke", "heart attack", "choking", "anaphylaxis", "allergic reaction severe",
          "suicidal", "overdose", "poisoning",
        ];
        const isEmergency = emergencyTerms.some((t) => m.includes(t));
        if (isEmergency) {
          return {
            urgency: "EMERGENCY",
            action: "CALL 082 911 IMMEDIATELY. Do NOT rely on this AI for emergency medical advice.",
            escalate: true,
            disclaimer: "AI triage is decision support only. Clinical responsibility remains with the treating practitioner.",
          };
        }

        // Urgent keywords
        const urgentTerms = [
          "severe pain", "high fever", "fever 39", "fever 40", "swelling",
          "infection", "post-operative", "wound", "bleeding", "dizzy",
          "fainted", "vomiting blood", "blood in stool",
        ];
        const isUrgent = urgentTerms.some((t) => m.includes(t));
        if (isUrgent) {
          return {
            urgency: "URGENT",
            action: "Book same-day appointment. Notify the doctor of symptoms before the consultation.",
            escalate: false,
            recommendedTimeframe: "Within 4 hours",
            disclaimer: "AI triage is decision support only.",
          };
        }

        // Semi-urgent
        const semiUrgentTerms = [
          "moderate pain", "persistent", "not improving", "medication concern",
          "side effect", "rash", "headache", "migraine",
        ];
        const isSemiUrgent = semiUrgentTerms.some((t) => m.includes(t));
        if (isSemiUrgent) {
          return {
            urgency: "SEMI-URGENT",
            action: "Book appointment within 24-48 hours. Monitor symptoms.",
            escalate: false,
            recommendedTimeframe: "Within 48 hours",
            disclaimer: "AI triage is decision support only.",
          };
        }

        return {
          urgency: "ROUTINE",
          action: "Schedule routine appointment at patient's convenience.",
          escalate: false,
          recommendedTimeframe: "Within 1 week",
          disclaimer: "AI triage is decision support only. Clinical responsibility remains with the treating practitioner.",
        };
      },
    }),

    billing_assist: tool({
      description:
        "Suggest ICD-10 codes and billing approach for a consultation. Checks PMB status, modifier requirements, and common rejection pitfalls. Uses SA healthcare claims knowledge base.",
      inputSchema: z.object({
        diagnosis: z.string().describe("Patient's diagnosis or presenting complaint"),
        service: z.string().optional().describe("Service provided (e.g. 'GP consultation', 'blood test')"),
        scheme: z.string().optional().describe("Medical aid scheme"),
      }),
      execute: async ({ diagnosis, service, scheme }) => {
        // Search ICD-10 for diagnosis
        const codes = await searchICD10(diagnosis, 5);

        // Search KB for claims guidance
        const kbResult = await searchKB(
          `${diagnosis} ${scheme ?? ""} claims coding rejection`,
          2000
        );

        return {
          suggestedCodes: codes,
          claimsGuidance: kbResult.content.slice(0, 1500),
          source: kbResult.source,
          warnings: [
            "Always verify ICD-10 codes against clinical findings",
            "SA uses WHO ICD-10, not US ICD-10-CM",
            codes.some((c) => c.pmb) ? "PMB condition detected — must be paid in full at DSP" : null,
            "Check pre-authorization requirements with the scheme before procedures",
          ].filter(Boolean),
          disclaimer: "Billing suggestions are decision support. Final coding responsibility is with the practitioner.",
        };
      },
    }),

    parse_hl7_message: tool({
      description:
        "Parse a CareOn HL7v2 message from hospital systems. Translates raw HL7 (ADT, ORU, ORM, DFT, SIU, MDM) into structured data — patient demographics, diagnoses, procedures, lab results. This is the CareOn Bridge translator.",
      inputSchema: z.object({
        rawMessage: z.string().describe("Raw HL7v2 message string (pipe-delimited segments)"),
      }),
      execute: async ({ rawMessage }) => {
        try {
          const parsed = parseHL7Message(rawMessage);
          return {
            success: true,
            ...parsed,
            note: "Parsed via Patient Flow AI CareOn Bridge HL7v2 translator. Supports ADT, ORU, ORM, DFT, SIU, MDM message types.",
          };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to parse HL7 message",
          };
        }
      },
    }),
  };
}
