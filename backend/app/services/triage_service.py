"""
OIL-SIF Guardian — Safety Triage & Information Extraction Service.
Transforms raw narratives into calibrated safety intelligence.
"""

import re
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
from rules.safety.deterministic_rules import DeterministicSafetyRuleEngine
from backend.app.schemas.prediction import (
    SafetyTriageResponse,
    PSIFSchema,
    IOGPRulePredictionSchema,
    EntitiesSchema,
    EvidenceSpanSchema
)


class SafetyTriageService:
    def __init__(self):
        self.rules_engine = DeterministicSafetyRuleEngine()
        self._load_dictionaries()

    def _load_dictionaries(self):
        root_dir = Path(__file__).resolve().parents[3]
        dict_path = root_dir / "rules" / "dictionaries" / "safety_terms.json"
        lsr_path = root_dir / "rules" / "iogp" / "life_saving_rules.json"

        if dict_path.exists():
            with open(dict_path, "r", encoding="utf-8") as f:
                self.safety_terms = json.load(f)
        else:
            self.safety_terms = {"abbreviations": {}, "equipment": [], "hazards": [], "energy_sources": {}}

        if lsr_path.exists():
            with open(lsr_path, "r", encoding="utf-8") as f:
                self.iogp_rules = json.load(f)
        else:
            self.iogp_rules = []

    def normalize_text(self, text: str) -> str:
        """
        Normalizes incident text, standardizes abbreviations, and redacts PII.
        """
        # Redact phone numbers (e.g. 10 digits or with dashes)
        sanitized = re.sub(r"\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b", "[PHONE_REDACTED]", text)
        # Redact email addresses
        sanitized = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b", "[EMAIL_REDACTED]", sanitized)
        # Clean extra whitespace
        sanitized = re.sub(r"\s+", " ", sanitized).strip()
        return sanitized

    def extract_entities(self, text: str) -> EntitiesSchema:
        """
        Extracts structured safety entities (hazards, energy, exposure, controls, failures).
        """
        lower_text = text.lower()
        hazards = []
        energy_sources = []
        exposures = []
        controls = []
        control_failures = []
        consequences = []

        # Energy sources
        for energy_cat, keywords in self.safety_terms.get("energy_sources", {}).items():
            for kw in keywords:
                if kw in lower_text:
                    energy_sources.append(energy_cat.capitalize())
                    break

        # Hazards & Exposures
        if "tank" in lower_text or "confined space" in lower_text or "vessel" in lower_text:
            hazards.append("Confined Space / Flammable Atmosphere")
            if any(w in lower_text for w in ["entered", "inside", "went in", "entry"]):
                exposures.append("Worker entered inside confined vessel")

        if any(w in lower_text for w in ["suspended", "crane", "load", "lifting"]):
            hazards.append("Suspended Mechanical Load")
            if any(w in lower_text for w in ["under", "beneath", "drop zone", "struck by"]):
                exposures.append("Worker positioned in load drop zone")

        if any(w in lower_text for w in ["height", "scaffold", "derrick", "monkey board"]):
            hazards.append("Elevated Fall from Height (>1.8m)")
            exposures.append("Worker at elevated position without barrier")

        if any(w in lower_text for w in ["pressurized", "gas line", "pressure", "hydrocarbon"]):
            hazards.append("Pressurized Hydrocarbon Release")

        if any(w in lower_text for w in ["h2s", "toxic", "sour gas"]):
            hazards.append("H2S / Toxic Gas Pocket")

        # Controls & Control Failures
        if any(w in lower_text for w in ["no gas test", "gas testing was not", "without gas test"]):
            controls.append("Atmospheric Gas Testing")
            control_failures.append("Gas testing was not recorded / absent")
            consequences.append("Credible fatal asphyxiation / toxic shock")

        if any(w in lower_text for w in ["expired permit", "permit had expired", "without ptw", "no permit"]):
            controls.append("Permit to Work (PTW)")
            control_failures.append("Entry permit expired / unauthorized work")

        if any(w in lower_text for w in ["no attendant", "without an attendant", "unattended"]):
            controls.append("Standby Safety Attendant")
            control_failures.append("No attendant positioned outside for rescue")

        if any(w in lower_text for w in ["no loto", "not isolated", "isolation failed"]):
            controls.append("Lockout / Tagout (LOTO) Energy Isolation")
            control_failures.append("Line isolation not verified / zero energy unconfirmed")
            consequences.append("Uncontrolled high-pressure release / impact")

        if any(w in lower_text for w in ["no harness", "unhooked", "unclipped"]):
            controls.append("Fall Arrest System / Harness")
            control_failures.append("100% tie-off not maintained at height")
            consequences.append("Fatal impact from elevated fall")

        return EntitiesSchema(
            hazards=list(dict.fromkeys(hazards)),
            energy_sources=list(dict.fromkeys(energy_sources)),
            exposures=list(dict.fromkeys(exposures)),
            controls=list(dict.fromkeys(controls)),
            control_failures=list(dict.fromkeys(control_failures)),
            consequences=list(dict.fromkeys(consequences))
        )

    def extract_evidence_spans(self, text: str) -> List[EvidenceSpanSchema]:
        """
        Locates key risk evidence spans with exact character offsets in the narrative.
        """
        spans = []
        patterns = [
            (r"\b(entered\s+the\s+tank|inside\s+the\s+vessel|entered\s+to\s+inspect)\b", "EXPOSURE"),
            (r"\b(under(neath)?\s+(the\s+)?suspended\s+load|in\s+line\s+of\s+fire|drop\s+zone)\b", "EXPOSURE"),
            (r"\b(working\s+at\s+height|on\s+the\s+derrick|on\s+scaffold)\b", "EXPOSURE"),
            (r"\b(gas\s+testing\s+was\s+not\s+recorded|no\s+gas\s+test|without\s+gas\s+test)\b", "CONTROL_FAILURE"),
            (r"\b(permit\s+(had\s+)?expired|expired\s+permit|without\s+(a\s+)?ptw)\b", "CONTROL_FAILURE"),
            (r"\b(no\s+attendant\s+was\s+positioned\s+outside|no\s+attendant|unattended)\b", "CONTROL_FAILURE"),
            (r"\b(isolation\s+failed|not\s+isolated|without\s+loto|no\s+loto)\b", "CONTROL_FAILURE"),
            (r"\b(without\s+safety\s+harness|harness\s+not\s+anchored|unclipped)\b", "CONTROL_FAILURE"),
            (r"\b(pressurized\s+gas\s+line|stored\s+energy|high\s+pressure)\b", "HAZARD"),
            (r"\b(welding|hot\s+work|torch)\b", "HAZARD")
        ]

        for pattern, category in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                spans.append(EvidenceSpanSchema(
                    text=match.group(0),
                    start_char=match.start(),
                    end_char=match.end(),
                    category=category
                ))

        return spans

    def predict_iogp_rules(self, text: str, suggested_rules: List[str]) -> List[IOGPRulePredictionSchema]:
        """
        Maps the 9 IOGP Life-Saving Rules with probabilities.
        """
        lower_text = text.lower()
        rule_scores: Dict[str, float] = {}

        # Default low probabilities
        for r in self.iogp_rules:
            rule_scores[r["name"]] = 0.05

        # Check keywords
        for r in self.iogp_rules:
            name = r["name"]
            score = 0.05
            for kw in r.get("keywords", []):
                if kw in lower_text:
                    score = max(score, 0.75)
            if name in suggested_rules:
                score = max(score, 0.92)
            rule_scores[name] = score

        results = []
        sorted_rules = sorted(rule_scores.items(), key=lambda x: x[1], reverse=True)
        primary_assigned = False

        for name, prob in sorted_rules:
            if prob >= 0.40:
                is_prim = (not primary_assigned and prob >= 0.70)
                if is_prim:
                    primary_assigned = True
                results.append(IOGPRulePredictionSchema(
                    rule_name=name,
                    probability=round(prob, 2),
                    is_primary=is_prim
                ))

        return results

    def build_fingerprint(self, activity: str, entities: EntitiesSchema, primary_rule: str) -> str:
        """
        Builds standardized SIF Exposure Fingerprint tuple.
        """
        act = (activity or "OPERATIONS").upper().replace(" ", "_")
        energy = (entities.energy_sources[0] if entities.energy_sources else "ENERGY_HAZARD").upper()
        hazard = (entities.hazards[0] if entities.hazards else "HAZARD").upper().replace(" ", "_")[:20]
        failure = (entities.control_failures[0] if entities.control_failures else "BARRIER_FAILURE").upper().replace(" ", "_")[:24]
        rule = (primary_rule or "IOGP_RULE").upper().replace(" ", "_")
        return f"{act}|{energy}|{hazard}|{failure}|{rule}"

    def triage(self, narrative: str, activity: str = "Maintenance") -> SafetyTriageResponse:
        """
        Executes complete hybrid triage pipeline.
        """
        normalized = self.normalize_text(narrative)
        entities = self.extract_entities(normalized)
        spans = self.extract_evidence_spans(normalized)
        rule_eval = self.rules_engine.evaluate(normalized)

        iogp_preds = self.predict_iogp_rules(normalized, rule_eval["suggested_rules"])
        primary_rule = iogp_preds[0].rule_name if iogp_preds else "Work Authorization"

        # Calculate hybrid PSIF probability
        if rule_eval["mandatory_high_psif"]:
            psif_prob = 0.94
            priority = "HIGH"
            confidence = "HIGH"
        elif len(entities.control_failures) > 0 and len(entities.energy_sources) > 0:
            psif_prob = 0.82
            priority = "HIGH"
            confidence = "HIGH"
        elif len(entities.control_failures) > 0 or len(entities.hazards) > 0:
            psif_prob = 0.58
            priority = "REVIEW"
            confidence = "MEDIUM"
        else:
            psif_prob = 0.15
            priority = "LOW"
            confidence = "HIGH"

        # Construct structured safety reasoning
        reasoning = []
        if entities.hazards:
            reasoning.append(f"Hazard context identified: {', '.join(entities.hazards)}.")
        if entities.energy_sources:
            reasoning.append(f"Hazardous energy vectors involved: {', '.join(entities.energy_sources)}.")
        if entities.exposures:
            reasoning.append(f"Direct personnel exposure: {', '.join(entities.exposures)}.")
        if entities.control_failures:
            reasoning.append(f"Critical barrier breakdown: {', '.join(entities.control_failures)}.")
        if rule_eval["rule_reasons"]:
            reasoning.extend(rule_eval["rule_reasons"])
        if not reasoning:
            reasoning.append("Routine operational narrative with no critical control breakdown identified.")

        fingerprint = self.build_fingerprint(activity, entities, primary_rule)

        return SafetyTriageResponse(
            psif=PSIFSchema(
                probability=psif_prob,
                priority=priority,
                confidence=confidence,
                calibration_factor=1.0
            ),
            life_saving_rules=iogp_preds,
            entities=entities,
            evidence_spans=spans,
            triggered_rules=rule_eval["triggered_rules"],
            safety_reasoning=reasoning,
            exposure_fingerprint=fingerprint,
            model_version="psif-v1.0"
        )


triage_service = SafetyTriageService()
