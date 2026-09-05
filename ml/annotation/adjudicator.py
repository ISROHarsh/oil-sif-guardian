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
