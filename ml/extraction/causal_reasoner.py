"""
OIL-SIF Guardian — Causal Reasoning Synthesizer
Transforms extracted safety entities into an explainable, 5-stage causal chain:
  Activity -> Hazard & Energy -> Worker Exposure -> Barrier Failure -> Credible Consequence

Produces human-auditable safety rationales and structured node graphs for HSSE investigations.
Complies with Rule 2 of ENGINEERING_RULES.md: Deterministic Safety Guardrails Overrule Pure ML.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from ml.extraction.safety_ner import SafetyNER, SafetyEntityCategory, EntitySpan


@dataclass
class CausalStep:
    """Represents a discrete step in the safety precursor causal chain."""
    step_id: int
    node_key: str
    title: str
    category: str
    detected_entities: List[str]
    has_evidence: bool
    summary: str
    icon_hint: str
    severity_level: str  # CRITICAL, HIGH, MODERATE, LOW, INFO

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class CausalReasoningResult:
    """Complete causal flow synthesis for an HSSE incident narrative."""
    steps: List[CausalStep]
    completeness_score: float  # 0.0 to 1.0 (fraction of 5 nodes evidenced)
    risk_level: str  # HIGH_PSIF, MEDIUM_PSIF, LOW_PSIF, MONITORED
    causal_narrative: str
    key_failure_mechanism: str
    suggested_critical_controls: List[str]
    audit_grounding: Dict[str, List[Dict[str, Any]]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "steps": [s.to_dict() for s in self.steps],
            "completeness_score": self.completeness_score,
            "risk_level": self.risk_level,
            "causal_narrative": self.causal_narrative,
            "key_failure_mechanism": self.key_failure_mechanism,
            "suggested_critical_controls": self.suggested_critical_controls,
            "audit_grounding": self.audit_grounding,
        }


class CausalReasoner:
    """
    Constructs deterministic, explainable causal chains from extracted safety entities.
    """

    def __init__(self, ner_engine: Optional[SafetyNER] = None):
        self.ner_engine = ner_engine or SafetyNER()

    def analyze(self, narrative: str, activity_context: Optional[str] = None) -> CausalReasoningResult:
        """
        Extracts entities and constructs the 5-step causal sequence.
        """
        spans = self.ner_engine.extract_entities(narrative)

        # Bucket entities
        activities = [s.text for s in spans if s.label == SafetyEntityCategory.ACTIVITY]
        hazards = [s.text for s in spans if s.label == SafetyEntityCategory.HAZARD]
        energies = [s.text for s in spans if s.label == SafetyEntityCategory.HAZARDOUS_ENERGY]
        exposures = [s.text for s in spans if s.label == SafetyEntityCategory.WORKER_EXPOSURE]
        controls = [s.text for s in spans if s.label == SafetyEntityCategory.CRITICAL_CONTROL]
        failures = [s.text for s in spans if s.label == SafetyEntityCategory.CONTROL_FAILURE]
        equipment = [s.text for s in spans if s.label == SafetyEntityCategory.EQUIPMENT]
        consequences = [s.text for s in spans if s.label == SafetyEntityCategory.CREDIBLE_CONSEQUENCE]

        # Contextual activity fallback
        if not activities and activity_context:
            activities.append(activity_context)

        # Build 5 Causal Steps
        # Step 1: Operational Activity
        has_act = len(activities) > 0
        step1 = CausalStep(
            step_id=1,
            node_key="ACTIVITY",
            title="Operational Activity",
            category=SafetyEntityCategory.ACTIVITY,
            detected_entities=activities,
            has_evidence=has_act,
            summary=f"Conducting {', '.join(activities)}" if has_act else "Routine / unspecified oilfield operations",
            icon_hint="wrench",
            severity_level="INFO"
        )

        # Step 2: Hazard & Energy Vector
        hazard_energy_entities = list(dict.fromkeys(hazards + energies))
        has_hz = len(hazard_energy_entities) > 0
        step2 = CausalStep(
            step_id=2,
            node_key="HAZARD_ENERGY",
            title="Hazard & Energy Vector",
            category=SafetyEntityCategory.HAZARD,
            detected_entities=hazard_energy_entities,
            has_evidence=has_hz,
            summary=f"Presence of energetic vector / hazard: {', '.join(hazard_energy_entities)}" if has_hz else "No energetic hazard explicitly identified",
            icon_hint="zap",
            severity_level="HIGH" if has_hz else "LOW"
        )

        # Step 3: Worker Exposure & Line-of-Fire
        has_exp = len(exposures) > 0
        step3 = CausalStep(
            step_id=3,
            node_key="WORKER_EXPOSURE",
            title="Worker Exposure Position",
            category=SafetyEntityCategory.WORKER_EXPOSURE,
            detected_entities=exposures,
            has_evidence=has_exp,
            summary=f"Workers situated {', '.join(exposures)}" if has_exp else "Worker position not explicitly detailed in narrative",
            icon_hint="user",
            severity_level="HIGH" if has_exp else "MODERATE"
        )

        # Step 4: Barrier Breakdown / Control Failure
        barrier_failure_entities = list(dict.fromkeys(failures))
        has_fail = len(barrier_failure_entities) > 0
        step4 = CausalStep(
            step_id=4,
            node_key="BARRIER_FAILURE",
            title="Barrier Breakdown / Failure",
            category=SafetyEntityCategory.CONTROL_FAILURE,
            detected_entities=barrier_failure_entities,
            has_evidence=has_fail,
            summary=f"Critical barrier breakdown: {', '.join(barrier_failure_entities)}" if has_fail else "No direct barrier failure identified; potential latent condition",
            icon_hint="shield-alert",
            severity_level="CRITICAL" if has_fail else "LOW"
        )

        # Step 5: Credible Consequence / Outcome
        has_cons = len(consequences) > 0
        step5 = CausalStep(
            step_id=5,
            node_key="CREDIBLE_CONSEQUENCE",
            title="Credible Consequence",
            category=SafetyEntityCategory.CREDIBLE_CONSEQUENCE,
            detected_entities=consequences,
            has_evidence=has_cons,
            summary=f"Potential severe consequence: {', '.join(consequences)}" if has_cons else "Severe injury potential prevented or latent precursor",
            icon_hint="alert-triangle",
            severity_level="CRITICAL" if has_cons else "MODERATE"
        )

        steps = [step1, step2, step3, step4, step5]

        # Calculate Completeness Score
        evidenced_steps = sum(1 for s in steps if s.has_evidence)
        completeness = round(evidenced_steps / 5.0, 2)

        # Determine Risk Level
        if has_fail and (has_hz or has_exp or has_cons):
            risk_level = "HIGH_PSIF"
        elif has_hz and (has_exp or has_fail):
            risk_level = "HIGH_PSIF"
        elif has_hz or has_fail:
            risk_level = "MEDIUM_PSIF"
        else:
            risk_level = "LOW_PSIF"

        # Generate Explainable Synthesis Narrative
        act_phrase = f"during {activities[0]}" if activities else "during active operations"
        hz_phrase = f"exposing personnel to {', '.join(hazard_energy_entities[:2])}" if hazard_energy_entities else "under hazardous oilfield conditions"
        exp_phrase = f"while situated {exposures[0]}" if exposures else "in the immediate line-of-fire"
        fail_phrase = f"due to critical breakdown of safety controls ({failures[0]})" if failures else "under compromised barrier integrity"
        cons_phrase = f"presenting credible exposure to {consequences[0]}." if consequences else "which could result in serious harm without immediate intervention."

        narrative_synthesis = (
            f"Precursor sequence initiated {act_phrase}, {hz_phrase} {exp_phrase}. "
            f"The barrier defense failed {fail_phrase}, {cons_phrase}"
        )

        # Key failure mechanism
        key_failure = failures[0] if failures else (controls[0] if controls else "Unspecified procedural / hardware gap")

        # Suggested Critical Controls
        suggested = self._suggest_controls(hazards, energies, exposures, failures)

        # Audit Grounding
        audit_grounding = {
            "ACTIVITY": [s.to_dict() for s in spans if s.label == SafetyEntityCategory.ACTIVITY],
            "HAZARD": [s.to_dict() for s in spans if s.label == SafetyEntityCategory.HAZARD],
            "HAZARDOUS_ENERGY": [s.to_dict() for s in spans if s.label == SafetyEntityCategory.HAZARDOUS_ENERGY],
            "WORKER_EXPOSURE": [s.to_dict() for s in spans if s.label == SafetyEntityCategory.WORKER_EXPOSURE],
            "CRITICAL_CONTROL": [s.to_dict() for s in spans if s.label == SafetyEntityCategory.CRITICAL_CONTROL],
            "CONTROL_FAILURE": [s.to_dict() for s in spans if s.label == SafetyEntityCategory.CONTROL_FAILURE],
            "EQUIPMENT": [s.to_dict() for s in spans if s.label == SafetyEntityCategory.EQUIPMENT],
            "CREDIBLE_CONSEQUENCE": [s.to_dict() for s in spans if s.label == SafetyEntityCategory.CREDIBLE_CONSEQUENCE],
        }

        return CausalReasoningResult(
            steps=steps,
            completeness_score=completeness,
            risk_level=risk_level,
            causal_narrative=narrative_synthesis,
            key_failure_mechanism=key_failure,
            suggested_critical_controls=suggested,
            audit_grounding=audit_grounding
        )

    def _suggest_controls(self, hazards: List[str], energies: List[str], exposures: List[str], failures: List[str]) -> List[str]:
        """Provides deterministic control recommendations based on detected gap vectors."""
        suggestions = []
        combined_text = " ".join(hazards + energies + exposures + failures).lower()

        if any(w in combined_text for w in ["h2s", "gas", "toxic", "sour"]):
            suggestions.append("Enforce continuous multi-gas detection with audible/visual alarms (OISD-105)")
            suggestions.append("Position positive-pressure SCBA sets at the designated muster point")
        if any(w in combined_text for w in ["confined", "vessel", "tank", "separator"]):
            suggestions.append("Mandate Confined Space Entry Permit with continuous standby attendant / hole watcher")
            suggestions.append("Conduct atmospheric gas testing before entry and every 2 hours continuously")
        if any(w in combined_text for w in ["pressure", "kick", "burst", "blowout", "bleed"]):
            suggestions.append("Enforce Double Block and Bleed (DBB) isolation with verified zero-energy gauge bleedoff")
            suggestions.append("Install whip check safety cables on all temporary pressurized lines")
        if any(w in combined_text for w in ["suspended", "hoist", "crane", "tubular", "casing", "drop"]):
            suggestions.append("Establish and barricade red zone exclusion area under all suspended loads")
            suggestions.append("Assign a dedicated certified banksman with clear line-of-sight communication")
        if any(w in combined_text for w in ["fall", "height", "scaffold", "monkey board", "derrick"]):
            suggestions.append("Mandate 100% dual-lanyard full-body safety harness tie-off to rated anchor point")
            suggestions.append("Verify scaffold inspection green tag prior to any personnel access")
        if any(w in combined_text for w in ["electrical", "kv", "voltage", "cable", "switchgear"]):
            suggestions.append("Verify positive electrical LOTO isolation and test-before-touch with certified meter")

        if not suggestions:
            suggestions.append("Conduct comprehensive Job Safety Analysis (JHA) and Toolbox Talk (TBT) before restart")
            suggestions.append("Perform formal permit-to-work audit and barrier verification check")

        return suggestions[:4]
