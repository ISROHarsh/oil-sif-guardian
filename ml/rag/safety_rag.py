"""
Generative AI & Grounded RAG Safety Assistant Engine (Phase 21 & 22).
Implements:
1. Prompt-injection defense & input sanitization (Phase 22).
2. Grounded document retriever over approved OISD, IOGP, OIL SOPs, DGMS standards.
3. Synthesizer for Investigation Briefs, Barrier Comparisons, and Standard Citations.
4. Safety Document Q&A assistant with authoritative references.
"""

from typing import List, Dict, Any, Optional
import re
import math
from pydantic import BaseModel, Field
from ml.rag.safety_corpus import APPROVED_SAFETY_CHUNKS


class SafetyCitation(BaseModel):
    standard: str
    section: str
    title: str
    citation_text: str
    relevance_score: float


class InvestigationBriefResponse(BaseModel):
    executive_summary: str
    risk_profile: str
    barrier_breakdown: List[Dict[str, str]]
    remedial_recommendations: List[str]
    citations: List[SafetyCitation]
    grounding_status: str = "FULLY_GROUNDED"
    prompt_injection_detected: bool = False


class SafetyQAResponse(BaseModel):
    query: str
    answer: str
    citations: List[SafetyCitation]
    grounded_standards: List[str]
    prompt_injection_detected: bool = False


class SafetyRAGEngine:
    """
    Authoritative safety assistant grounded in approved OIL & Indian/International HSSE standards.
    Guarantees that AI recommends/explains based on verified documentation without autonomous safety decisions.
    """

    # Prompt Injection Shield Patterns (Phase 22)
    INJECTION_PATTERNS = [
        r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"bypass\s+(safety|rule|security)",
        r"act\s+as\s+(dan|an\s+unrestricted|a\s+hacker)",
        r"system\s*prompt",
        r"<script.*?>",
        r"javascript:",
        r"(drop|delete|truncate)\s+(table|database|from)",
        r"eval\s*\(",
        r"reveal\s+(internal|secret|token|key)"
    ]

    def __init__(self, corpus: Optional[List[Dict[str, Any]]] = None):
        self.corpus = corpus or APPROVED_SAFETY_CHUNKS

    def sanitize_input(self, text: str) -> tuple[str, bool]:
        """
        Scans and sanitizes user input for prompt injection and XSS attempts.
        Returns: (sanitized_text, injection_detected)
        """
        if not text:
            return "", False

        injection_flagged = False
        lower = text.lower()
        for pattern in self.INJECTION_PATTERNS:
            if re.search(pattern, lower):
                injection_flagged = True
                # Neutralize adversarial instruction
                text = re.sub(pattern, "[FILTERED_ADVERSARIAL_INPUT]", text, flags=re.IGNORECASE)

        # Strip html/script tags
        cleaned = re.sub(r"<[^>]+>", "", text).strip()
        return cleaned, injection_flagged

    def retrieve_relevant_chunks(self, query: str, top_k: int = 3) -> List[tuple[Dict[str, Any], float]]:
        """
        Retrieves the top-k most relevant approved standard chunks using term-frequency and keyword matching.
        """
        sanitized_query, _ = self.sanitize_input(query)
        q_tokens = set(re.findall(r"\b[a-z]{3,}\b", sanitized_query.lower()))

        scored_chunks = []
        for chunk in self.corpus:
            chunk_text = f"{chunk['title']} {chunk['content']} {' '.join(chunk.get('mandatory_controls', []))}".lower()
            c_tokens = set(re.findall(r"\b[a-z]{3,}\b", chunk_text))

            overlap = len(q_tokens & c_tokens)
            if overlap == 0:
                score = 0.05
            else:
                score = round(overlap / (len(q_tokens) + 1e-5), 4)

            # Boost if category matches keywords
            cat = chunk.get("category", "").lower()
            if any(term in cat for term in q_tokens):
                score += 0.35

            # Boost for exact standard reference mentions
            if chunk["standard"].lower() in sanitized_query.lower():
                score += 0.50

            scored_chunks.append((chunk, round(score, 4)))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:top_k]

    def synthesize_investigation_brief(
        self,
        narrative: str,
        installation: str = "Duliajan Production Installation",
        psif_priority: str = "HIGH",
        primary_rules: Optional[List[str]] = None,
        failed_controls: Optional[List[str]] = None
    ) -> InvestigationBriefResponse:
        """
        Synthesizes an executive investigation brief by grounding extracted incident facts
        against approved safety standards (Phase 21).
        """
        clean_narrative, injection_flagged = self.sanitize_input(narrative)
        primary_rules = primary_rules or []
        failed_controls = failed_controls or []

        # Retrieve matching safety standards
        search_query = f"{clean_narrative} {' '.join(primary_rules)} {' '.join(failed_controls)}"
        top_matches = self.retrieve_relevant_chunks(search_query, top_k=3)

        citations: List[SafetyCitation] = []
        mandatory_controls_pool: List[str] = []
        for chunk, score in top_matches:
            citations.append(
                SafetyCitation(
                    standard=chunk["standard"],
                    section=chunk["section"],
                    title=chunk["title"],
                    citation_text=chunk["citations"],
                    relevance_score=score
                )
            )
            mandatory_controls_pool.extend(chunk.get("mandatory_controls", []))

        # 1. Executive Summary
        exec_summary = (
            f"Precursor incident documented at {installation}. Analysis indicates a {psif_priority} "
            f"potential Serious Injury and Fatality (SIF) exposure pathway. Primary operative hazards relate to "
            f"{', '.join(primary_rules) if primary_rules else 'Hazardous Energy and Operational Controls'}."
        )

        # 2. Barrier Breakdown
        breakdown = []
        if failed_controls:
            for fc in failed_controls[:4]:
                matched_rule = primary_rules[0] if primary_rules else "Safety Management System"
                std_ref = citations[0].citation_text if citations else "OIL HSSE SOP"
                breakdown.append({
                    "observed_failure": fc,
                    "applicable_rule": matched_rule,
                    "statutory_mandate": f"Violates {std_ref} requiring verified barrier integrity before execution."
                })
        else:
            breakdown.append({
                "observed_failure": "Control verification lapse or permit non-compliance",
                "applicable_rule": primary_rules[0] if primary_rules else "Work Authorization",
                "statutory_mandate": f"Mandates continuous monitoring under {citations[0].citation_text if citations else 'OISD-STD-105'}."
            })

        # 3. Remedial Recommendations
        recommendations = [
            f"Execute immediate field audit of {primary_rules[0] if primary_rules else 'work area'} controls at {installation}.",
            f"Verify all ongoing jobs adhere strictly to {citations[0].citation_text if citations else 'OISD-STD-105'}.",
            f"Mandate supervisory re-validation of active permits prior to resuming non-routine maintenance."
        ]
        if mandatory_controls_pool:
            recommendations.append(f"Statutory requirements to enforce: {', '.join(mandatory_controls_pool[:3])}.")

        return InvestigationBriefResponse(
            executive_summary=exec_summary,
            risk_profile=f"Calibrated Priority: {psif_priority} | Grounded against {len(citations)} statutory references.",
            barrier_breakdown=breakdown,
            remedial_recommendations=recommendations,
            citations=citations,
            grounding_status="FULLY_GROUNDED",
            prompt_injection_detected=injection_flagged
        )

    def answer_safety_query(self, query: str) -> SafetyQAResponse:
        """
        Answers operator safety inquiries grounded in approved standards with exact citations (Phase 21).
        """
        clean_query, injection_flagged = self.sanitize_input(query)
        top_matches = self.retrieve_relevant_chunks(clean_query, top_k=2)

        if not top_matches:
            return SafetyQAResponse(
                query=query,
                answer="No relevant approved safety standards found for the requested query.",
                citations=[],
                grounded_standards=[],
                prompt_injection_detected=injection_flagged
            )

        citations: List[SafetyCitation] = []
        grounded_standards: List[str] = []
        evidence_points: List[str] = []

        for chunk, score in top_matches:
            citations.append(
                SafetyCitation(
                    standard=chunk["standard"],
                    section=chunk["section"],
                    title=chunk["title"],
                    citation_text=chunk["citations"],
                    relevance_score=score
                )
            )
            grounded_standards.append(chunk["standard"])
            evidence_points.append(
                f"• According to **{chunk['citations']}** ({chunk['title']}):\n  \"{chunk['content']}\""
            )

        combined_answer = (
            f"Based on the approved Oil India Limited and statutory industry standards:\n\n"
            + "\n\n".join(evidence_points)
            + "\n\n**Mandatory Safety Rule:** Field operators must comply with documented supervisory sign-offs and verified barrier conditions before commencing work."
        )

        return SafetyQAResponse(
            query=clean_query,
            answer=combined_answer,
            citations=citations,
            grounded_standards=list(set(grounded_standards)),
            prompt_injection_detected=injection_flagged
        )


safety_rag_engine = SafetyRAGEngine()
