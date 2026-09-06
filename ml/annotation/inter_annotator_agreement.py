"""
OIL-SIF Guardian — Inter-Annotator Agreement Engine.
Computes statistical reliability metrics (Cohen's Kappa, Krippendorff's Alpha,
and Evidence Span Jaccard / F1) between independent safety annotators.
"""

from typing import List, Dict, Any, Optional, Set, Tuple
from collections import Counter
import math


class InterAnnotatorAgreement:
    """
    Computes rigorous inter-rater reliability metrics for safety annotations.
    Strictly adheres to docs/ANNOTATION_GUIDELINES.md quality targets.
    """

    @staticmethod
    def calculate_cohens_kappa(labels_a: List[str], labels_b: List[str]) -> float:
        """
        Calculates Cohen's Kappa (kappa) between two annotators on categorical data.
        Returns a float between -1.0 and 1.0.
        """
        if not labels_a or not labels_b or len(labels_a) != len(labels_b):
            return 0.0

        n = len(labels_a)
        if n == 0:
            return 0.0

        # Observed agreement Po
        agreements = sum(1 for a, b in zip(labels_a, labels_b) if a == b)
        p_o = agreements / n

        # Marginal distributions
        categories = list(set(labels_a).union(set(labels_b)))
        count_a = Counter(labels_a)
        count_b = Counter(labels_b)

        # Expected agreement Pe
        p_e = sum((count_a[c] / n) * (count_b[c] / n) for c in categories)

        if math.isclose(p_e, 1.0):
            return 1.0

        kappa = (p_o - p_e) / (1.0 - p_e)
        return round(float(kappa), 4)

    @staticmethod
    def interpret_kappa(kappa: float) -> str:
        """Standard Landis & Koch interpretation scale for Cohen's Kappa."""
        if kappa < 0:
            return "Poor (Disagreement)"
        elif kappa <= 0.20:
            return "Slight Agreement"
        elif kappa <= 0.40:
            return "Fair Agreement"
        elif kappa <= 0.60:
            return "Moderate Agreement"
        elif kappa <= 0.80:
            return "Substantial Agreement (Valid)"
        else:
            return "Almost Perfect Agreement (Gold Grade)"

    @staticmethod
    def calculate_krippendorffs_alpha_nominal(matrix: List[List[Optional[str]]]) -> float:
        """
        Calculates Krippendorff's Alpha for nominal categories across items.
        matrix format: rows = items, columns = annotators.
        Values can be None if an annotator skipped an item.
        """
        if not matrix:
            return 0.0

        # Count category pairs per item
        coincidence_matrix: Dict[Tuple[str, str], float] = Counter()
        all_categories: Set[str] = set()
        n_total_pairs = 0.0

        for row in matrix:
            valid_values = [v for v in row if v is not None]
            m_u = len(valid_values)
            if m_u < 2:
                continue  # Need at least 2 annotators for an item to evaluate pair

            factor = 1.0 / (m_u - 1)
            for i in range(m_u):
                val_i = str(valid_values[i])
                all_categories.add(val_i)
                for j in range(m_u):
                    if i != j:
                        val_j = str(valid_values[j])
                        coincidence_matrix[(val_i, val_j)] += factor
                        n_total_pairs += factor

        if n_total_pairs == 0:
            return 0.0

        # Observed disagreement Do
        d_o = sum(count for (c1, c2), count in coincidence_matrix.items() if c1 != c2) / n_total_pairs

        # Marginal category frequencies
        marginal_counts: Dict[str, float] = Counter()
        for (c1, _), count in coincidence_matrix.items():
            marginal_counts[c1] += count

        # Expected disagreement De
        d_e = 0.0
        for c1 in all_categories:
            for c2 in all_categories:
                if c1 != c2:
                    d_e += marginal_counts[c1] * marginal_counts[c2]

        denominator = n_total_pairs * (n_total_pairs - 1.0)
        if denominator <= 0:
            return 1.0

        d_e = d_e / denominator

        if math.isclose(d_e, 0.0):
            return 1.0 if math.isclose(d_o, 0.0) else 0.0

        alpha = 1.0 - (d_o / d_e)
        return round(float(alpha), 4)

    @staticmethod
    def calculate_span_overlap(
        spans_a: List[Dict[str, Any]],
        spans_b: List[Dict[str, Any]],
        text_length: int = 1000
    ) -> Dict[str, float]:
        """
        Calculates Character-level Jaccard Index (IoU) and Span F1 between two annotators.
        Spans are list of dicts with 'start_char', 'end_char', and optional 'category'.
        """
        mask_a: Set[int] = set()
        for span in spans_a:
            s, e = span.get("start_char", 0), span.get("end_char", 0)
            mask_a.update(range(s, max(s, e)))

        mask_b: Set[int] = set()
        for span in spans_b:
            s, e = span.get("start_char", 0), span.get("end_char", 0)
            mask_b.update(range(s, max(s, e)))

        if not mask_a and not mask_b:
            return {"char_iou": 1.0, "char_f1": 1.0, "char_precision": 1.0, "char_recall": 1.0}

        intersection = len(mask_a.intersection(mask_b))
        union = len(mask_a.union(mask_b))

        iou = intersection / union if union > 0 else 0.0
        precision = intersection / len(mask_b) if mask_b else 0.0
        recall = intersection / len(mask_a) if mask_a else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        return {
            "char_iou": round(iou, 4),
            "char_f1": round(f1, 4),
            "char_precision": round(precision, 4),
            "char_recall": round(recall, 4),
        }

    def generate_full_report(
        self,
        batch_a: List[Dict[str, Any]],
        batch_b: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates full inter-annotator evaluation report between Annotator A and Annotator B.
        Each item requires: 'item_id', 'is_psif', 'priority', 'primary_rule', 'evidence_spans'.
        """
        map_a = {item["item_id"]: item for item in batch_a}
        map_b = {item["item_id"]: item for item in batch_b}

        common_ids = sorted(list(set(map_a.keys()).intersection(set(map_b.keys()))))
        if not common_ids:
            return {
                "total_items": 0,
                "error": "No overlapping item IDs between Annotator A and Annotator B."
            }

        psif_a = [str(map_a[i].get("is_psif", False)) for i in common_ids]
        psif_b = [str(map_b[i].get("is_psif", False)) for i in common_ids]
        kappa_psif = self.calculate_cohens_kappa(psif_a, psif_b)

        prio_a = [str(map_a[i].get("priority", "REVIEW")).upper() for i in common_ids]
        prio_b = [str(map_b[i].get("priority", "REVIEW")).upper() for i in common_ids]
        kappa_prio = self.calculate_cohens_kappa(prio_a, prio_b)

        rule_a = [str(map_a[i].get("primary_rule", "None")) for i in common_ids]
        rule_b = [str(map_b[i].get("primary_rule", "None")) for i in common_ids]
        kappa_rule = self.calculate_cohens_kappa(rule_a, rule_b)

        # Krippendorff's alpha for priority
        matrix_prio = [[prio_a[idx], prio_b[idx]] for idx in range(len(common_ids))]
        alpha_prio = self.calculate_krippendorffs_alpha_nominal(matrix_prio)

        # Average span agreement
        span_metrics = []
        disagreements = []

        for i in common_ids:
            item_a = map_a[i]
            item_b = map_b[i]

            spans_a = item_a.get("evidence_spans", [])
            spans_b = item_b.get("evidence_spans", [])
            overlap = self.calculate_span_overlap(spans_a, spans_b)
            span_metrics.append(overlap)

            # Check disagreement
            diffs = []
            if str(item_a.get("is_psif")) != str(item_b.get("is_psif")):
                diffs.append(f"PSIF status mismatch: {item_a.get('is_psif')} vs {item_b.get('is_psif')}")
            if str(item_a.get("priority")).upper() != str(item_b.get("priority")).upper():
                diffs.append(f"Priority mismatch: {item_a.get('priority')} vs {item_b.get('priority')}")
            if str(item_a.get("primary_rule")) != str(item_b.get("primary_rule")):
                diffs.append(f"Rule mismatch: {item_a.get('primary_rule')} vs {item_b.get('primary_rule')}")

            if diffs:
                disagreements.append({
                    "item_id": i,
                    "annotator_a": {
                        "is_psif": item_a.get("is_psif"),
                        "priority": item_a.get("priority"),
                        "primary_rule": item_a.get("primary_rule")
                    },
                    "annotator_b": {
                        "is_psif": item_b.get("is_psif"),
                        "priority": item_b.get("priority"),
                        "primary_rule": item_b.get("primary_rule")
                    },
                    "reasons": diffs
                })

        avg_span_f1 = round(sum(m["char_f1"] for m in span_metrics) / len(span_metrics), 4) if span_metrics else 1.0
        avg_span_iou = round(sum(m["char_iou"] for m in span_metrics) / len(span_metrics), 4) if span_metrics else 1.0

        target_met = kappa_psif >= 0.75 and kappa_rule >= 0.70

        return {
            "total_items": len(common_ids),
            "disagreement_count": len(disagreements),
            "disagreement_rate": round(len(disagreements) / len(common_ids), 4) if common_ids else 0.0,
            "metrics": {
                "cohens_kappa_psif": kappa_psif,
                "cohens_kappa_psif_interpretation": self.interpret_kappa(kappa_psif),
                "cohens_kappa_priority": kappa_prio,
                "cohens_kappa_priority_interpretation": self.interpret_kappa(kappa_prio),
                "cohens_kappa_iogp_rule": kappa_rule,
                "cohens_kappa_iogp_rule_interpretation": self.interpret_kappa(kappa_rule),
                "krippendorffs_alpha_priority": alpha_prio,
                "evidence_span_f1": avg_span_f1,
                "evidence_span_iou": avg_span_iou,
                "meets_quality_targets": target_met
            },
            "disagreements": disagreements
        }


agreement_engine = InterAnnotatorAgreement()
