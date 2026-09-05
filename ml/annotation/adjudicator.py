"""
OIL-SIF Guardian — Adjudication Engine.
Identifies disagreements between dual annotators, routes them to HSE Lead review,
and produces finalized, audit-logged consensus annotations for the Gold Dataset.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


class AdjudicationEngine:
    """
    Automates consensus identification and human-in-the-loop expert adjudication
    for dual-annotated safety reports according to docs/ANNOTATION_GUIDELINES.md.
    """

    @staticmethod
    def adjudicate_pair(
        item_id: str,
        ann_a: Dict[str, Any],
        ann_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compares two annotations for a single item.
        If in full agreement, marks as CONSENSUS_APPROVED.
        If any conflict exists, flags as REQUIRES_LEAD_ADJUDICATION.
        """
        raw_text = ann_a.get("raw_text") or ann_b.get("raw_text") or ""
        metadata = ann_a.get("metadata") or ann_b.get("metadata") or {}

        psif_a = bool(ann_a.get("is_psif", False))
        psif_b = bool(ann_b.get("is_psif", False))
        psif_match = (psif_a == psif_b)

        prio_a = str(ann_a.get("priority", "REVIEW")).upper()
        prio_b = str(ann_b.get("priority", "REVIEW")).upper()
        prio_match = (prio_a == prio_b)

        rule_a = str(ann_a.get("primary_rule") or "").strip()
        rule_b = str(ann_b.get("primary_rule") or "").strip()
        rule_match = (rule_a == rule_b)

        conflicts = []
        if not psif_match:
            conflicts.append(f"PSIF Status Conflict: Annotator A={psif_a} vs Annotator B={psif_b}")
        if not prio_match:
            conflicts.append(f"Priority Conflict: Annotator A={prio_a} vs Annotator B={prio_b}")
        if not rule_match:
            conflicts.append(f"IOGP Rule Conflict: Annotator A='{rule_a}' vs Annotator B='{rule_b}'")

        if not conflicts:
            # Full consensus reached automatically
            combined_spans = ann_a.get("evidence_spans", [])
            return {
                "item_id": item_id,
                "status": "CONSENSUS_APPROVED",
                "raw_text": raw_text,
                "metadata": metadata,
                "is_psif": psif_a,
                "priority": prio_a,
                "primary_rule": rule_a,
                "evidence_spans": combined_spans,
                "adjudicated_by": "AUTOMATED_CONSENSUS",
                "adjudication_notes": "Annotator A and Annotator B in 100% agreement.",
                "conflicts": [],
                "adjudicated_at": datetime.now(timezone.utc).isoformat()
            }
        else:
            return {
                "item_id": item_id,
                "status": "REQUIRES_LEAD_ADJUDICATION",
                "raw_text": raw_text,
                "metadata": metadata,
                "annotator_a": {
                    "annotator_id": ann_a.get("annotator_id", "A"),
                    "is_psif": psif_a,
                    "priority": prio_a,
                    "primary_rule": rule_a,
                    "evidence_spans": ann_a.get("evidence_spans", []),
                    "notes": ann_a.get("notes")
                },
                "annotator_b": {
                    "annotator_id": ann_b.get("annotator_id", "B"),
                    "is_psif": psif_b,
                    "priority": prio_b,
                    "primary_rule": rule_b,
                    "evidence_spans": ann_b.get("evidence_spans", []),
                    "notes": ann_b.get("notes")
                },
                "conflicts": conflicts,
                "adjudicated_by": None,
                "adjudication_notes": None,
                "adjudicated_at": None
            }

    @staticmethod
    def resolve_dispute(
        dispute_item: Dict[str, Any],
        lead_id: str,
        final_is_psif: bool,
        final_priority: str,
        final_primary_rule: str,
        final_spans: Optional[List[Dict[str, Any]]] = None,
        rationale: str = ""
    ) -> Dict[str, Any]:
        """
        Executes expert HSE Lead resolution on a disputed annotation item,
        finalizing ground-truth labels with complete justification.
        """
        return {
            "item_id": dispute_item["item_id"],
            "status": "LEAD_ADJUDICATED",
            "raw_text": dispute_item.get("raw_text", ""),
            "metadata": dispute_item.get("metadata", {}),
            "is_psif": final_is_psif,
            "priority": final_priority.upper(),
            "primary_rule": final_primary_rule,
            "evidence_spans": final_spans or [],
            "adjudicated_by": lead_id,
            "adjudication_notes": rationale or "Resolved by Senior HSE Lead Adjudicator.",
            "conflicts_resolved": dispute_item.get("conflicts", []),
            "adjudicated_at": datetime.now(timezone.utc).isoformat()
        }

    def process_batch(
        self,
        batch_a: List[Dict[str, Any]],
        batch_b: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Processes two full batches of annotations, splitting them into
        approved consensus items and pending adjudication queues.
        """
        map_a = {item["item_id"]: item for item in batch_a}
        map_b = {item["item_id"]: item for item in batch_b}

        common_ids = sorted(list(set(map_a.keys()).intersection(set(map_b.keys()))))
        consensus_items = []
        pending_disputes = []

        for item_id in common_ids:
            res = self.adjudicate_pair(item_id, map_a[item_id], map_b[item_id])
            if res["status"] == "CONSENSUS_APPROVED":
                consensus_items.append(res)
            else:
                pending_disputes.append(res)

        return {
            "total_processed": len(common_ids),
            "consensus_count": len(consensus_items),
            "dispute_count": len(pending_disputes),
            "consensus_rate": round(len(consensus_items) / len(common_ids), 4) if common_ids else 0.0,
            "approved_items": consensus_items,
            "pending_disputes": pending_disputes
        }


adjudication_engine = AdjudicationEngine()


class HITLAdjudicationEngine:
    """
    Core engine for Human-in-the-Loop (HITL) HSE Adjudication and Calibration.
    Enforces Rule 2 (Deterministic Veto Guardrail) Invariant:
    A high-risk deterministic veto cannot be casually downgraded without
    Senior HSE Lead authority and verifiable engineering justification.
    Tracks human-AI agreement rates, priority confusion matrices, and drift status.
    """

    ALLOWED_SENIOR_ROLES = {
        "HSE_LEAD",
        "SAFETY_MANAGER",
        "CHIEF_SAFETY_OFFICER",
        "VP_HSSE",
        "LEAD_AUDITOR",
        "SUPERINTENDENT",
        "ASSET_HEAD"
    }

    VALID_DECISIONS = {"CONFIRMED", "MODIFIED", "REJECTED", "ESCALATED"}
    VALID_PRIORITIES = {"HIGH", "REVIEW", "LOW"}
    VALID_REASON_CODES = {
        "ENERGY_MITIGATED",
        "FALSE_POSITIVE_KEYWORD",
        "INCORRECT_ATTRIBUTION",
        "ADMINISTRATIVE_ONLY",
        "EQUIPMENT_DECOMMISSIONED",
        "PHYSICAL_ISOLATION_CONFIRMED",
        "PRECURSOR_CONFIRMED",
        "IMMEDIATE_STAND_DOWN",
        "SCOPE_MISMATCH",
        "OTHER"
    }

    @classmethod
    def validate_adjudication(
        cls,
        ai_priority: str,
        is_veto_enforced: bool,
        requested_priority: str,
        decision: str,
        reviewer_role: str,
        reviewer_notes: str,
        senior_signoff_by: Optional[str] = None,
        override_reason_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates an HSE human adjudication against statutory safety constraints.
        Raises ValueError if statutory guardrails or integrity criteria are violated.
        """
        decision_upper = (decision or "").strip().upper()
        prio_upper = (requested_priority or "").strip().upper()
        role_upper = (reviewer_role or "HSE_OFFICER").strip().upper()
        notes = (reviewer_notes or "").strip()
        code_upper = (override_reason_code or "").strip().upper()

        if decision_upper not in cls.VALID_DECISIONS:
            raise ValueError(f"Invalid decision '{decision}'. Must be one of: {sorted(cls.VALID_DECISIONS)}.")

        if prio_upper not in cls.VALID_PRIORITIES:
            raise ValueError(f"Invalid priority '{requested_priority}'. Must be one of: {sorted(cls.VALID_PRIORITIES)}.")

        is_veto_downgrade = is_veto_enforced and (prio_upper in ["LOW", "REVIEW"] or decision_upper == "REJECTED")

        # RULE 2 INVARIANT: Deterministic Safety Veto Protection
        if is_veto_downgrade:
            is_senior = role_upper in cls.ALLOWED_SENIOR_ROLES or bool(senior_signoff_by and senior_signoff_by.strip())
            if not is_senior:
                raise ValueError(
                    f"Statutory Safety Veto Invariant: Deterministic guardrail cannot be downgraded "
                    f"by role '{role_upper}' without authorized Senior HSE Lead sign-off "
                    f"(HSE_LEAD / SAFETY_MANAGER)."
                )

            if len(notes) < 30:
                raise ValueError(
                    f"Statutory Safety Veto Invariant: Overriding a codified safety veto requires at least "
                    f"30 characters of engineering rationale detailing physical hazard mitigation "
                    f"(provided {len(notes)} chars)."
                )

            if not code_upper or code_upper not in cls.VALID_REASON_CODES:
                raise ValueError(
                    f"Statutory Safety Veto Invariant: A valid override_reason_code is required "
                    f"when modifying a deterministic veto. Allowed: {sorted(cls.VALID_REASON_CODES)}."
                )

        # Standard modification check: require at least 10 chars explanation
        if decision_upper in ["MODIFIED", "REJECTED"]:
            if len(notes) < 10:
                raise ValueError(
                    f"Adjudication modifications require at least 10 characters of reviewer explanation "
                    f"(provided {len(notes)} chars)."
                )

        veto_override_approved = bool(is_veto_downgrade)
        recalibration_flag = (ai_priority.upper() != prio_upper) or (decision_upper in ["MODIFIED", "REJECTED"])

        return {
            "is_valid": True,
            "decision": decision_upper,
            "final_priority": prio_upper,
            "reviewer_role": role_upper,
            "veto_override_approved": veto_override_approved,
            "recalibration_flag": recalibration_flag,
            "override_reason_code": code_upper or ("PRECURSOR_CONFIRMED" if decision_upper == "CONFIRMED" else "OTHER")
        }

    @classmethod
    def compute_metrics(
        cls,
        total_reports: int,
        pending_count: int,
        high_pending_count: int,
        adjudicated_records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Computes Human-AI agreement metrics, priority shift confusion matrix,
        override reason distribution, and calibration drift status.
        """
        adjudicated_count = len(adjudicated_records)
        if adjudicated_count == 0:
            return {
                "total_reports": total_reports,
                "pending_count": pending_count,
                "high_priority_pending": high_pending_count,
                "adjudicated_count": 0,
                "agreement_rate": 1.0,
                "high_psif_agreement_rate": 1.0,
                "priority_transitions": {
                    "HIGH_TO_HIGH": 0, "HIGH_TO_REVIEW": 0, "HIGH_TO_LOW": 0,
                    "REVIEW_TO_HIGH": 0, "REVIEW_TO_REVIEW": 0, "REVIEW_TO_LOW": 0,
                    "LOW_TO_HIGH": 0, "LOW_TO_REVIEW": 0, "LOW_TO_LOW": 0,
                },
                "override_reasons": {},
                "drift_status": "NORMAL",
                "drift_alert_message": "Awaiting initial adjudications to compute baseline drift.",
                "reviewer_velocity_daily": 0.0,
                "recommendations": ["Queue operational; route initial high-priority reports to HSE officers."]
            }

        # Compute transitions & agreements
        agreed_count = 0
        ai_high_count = 0
        ai_high_agreed = 0
        transitions: Dict[str, int] = {
            "HIGH_TO_HIGH": 0, "HIGH_TO_REVIEW": 0, "HIGH_TO_LOW": 0,
            "REVIEW_TO_HIGH": 0, "REVIEW_TO_REVIEW": 0, "REVIEW_TO_LOW": 0,
            "LOW_TO_HIGH": 0, "LOW_TO_REVIEW": 0, "LOW_TO_LOW": 0,
        }
        override_reasons: Dict[str, int] = {}

        for rec in adjudicated_records:
            ai_prio = str(rec.get("ai_priority") or "REVIEW").upper()
            final_prio = str(rec.get("final_priority") or "REVIEW").upper()
            key = f"{ai_prio}_TO_{final_prio}"
            transitions[key] = transitions.get(key, 0) + 1

            if ai_prio == final_prio:
                agreed_count += 1

            if ai_prio == "HIGH":
                ai_high_count += 1
                if final_prio == "HIGH":
                    ai_high_agreed += 1

            reason = rec.get("override_reason_code")
            if reason:
                override_reasons[reason] = override_reasons.get(reason, 0) + 1

        overall_agreement = round(agreed_count / adjudicated_count, 4)
        high_agreement = round(ai_high_agreed / ai_high_count, 4) if ai_high_count > 0 else 1.0

        # Assess calibration drift status
        recommendations = []
        if adjudicated_count >= 5 and high_agreement < 0.80:
            drift_status = "DRIFT_DETECTED"
            drift_message = (
                f"CRITICAL DRIFT ALERT: Human-AI High-PSIF agreement is {round(high_agreement * 100, 1)}% "
                f"(below 80% threshold). Field officers are frequently reclassifying AI high-priority events."
            )
            recommendations.append("Recalibrate temperature scaling factor (T) in Hybrid Decision Studio.")
            recommendations.append("Inspect override reason codes for recurring false-positive keywords.")
            recommendations.append("Audit deterministic veto rule regex triggers against operational changes.")
        elif adjudicated_count >= 5 and overall_agreement < 0.85:
            drift_status = "WARNING"
            drift_message = (
                f"MODERATE DRIFT WARNING: Overall agreement is {round(overall_agreement * 100, 1)}% "
                f"(below 85% target). Priority boundary drift observed."
            )
            recommendations.append("Fine-tune ensemble model weights (w_seq, w_iogp, w_tfidf).")
            recommendations.append("Review borderline cases with calibrated probabilities between 0.40 and 0.65.")
        else:
            drift_status = "NORMAL"
            drift_message = (
                f"OPTIMAL ALIGNMENT: Human-AI concordance is {round(overall_agreement * 100, 1)}% "
                f"(High-PSIF agreement: {round(high_agreement * 100, 1)}%). Models well-calibrated."
            )
            recommendations.append("Maintain standard adjudication protocol. Zero drift detected.")

        return {
            "total_reports": total_reports,
            "pending_count": pending_count,
            "high_priority_pending": high_pending_count,
            "adjudicated_count": adjudicated_count,
            "agreement_rate": overall_agreement,
            "high_psif_agreement_rate": high_agreement,
            "priority_transitions": transitions,
            "override_reasons": override_reasons,
            "drift_status": drift_status,
            "drift_alert_message": drift_message,
            "reviewer_velocity_daily": round(adjudicated_count / max(1, 7), 1),
            "recommendations": recommendations
        }


hitl_adjudication_engine = HITLAdjudicationEngine()

