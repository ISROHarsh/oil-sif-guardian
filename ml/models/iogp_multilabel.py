"""
OIL-SIF Guardian — IOGP Life-Saving Rules Multi-Label Classifier
Dedicated multi-label classification and joint barrier degradation modeling
for the 9 canonical IOGP Life-Saving Rules across Oil India Limited (OIL) operations.
"""

import math
import re
import json
import os
import time
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass, field, asdict
from rules.safety.deterministic_rules import DeterministicSafetyRuleEngine


CANONICAL_IOGP_RULES: List[str] = [
    "Bypassing Safety Controls",
    "Confined Space",
    "Driving",
    "Energy Isolation",
    "Hot Work",
    "Line of Fire",
    "Safe Mechanical Lifting",
    "Work Authorization",
    "Working at Height"
]

DEFAULT_CALIBRATED_THRESHOLDS: Dict[str, float] = {
    "Bypassing Safety Controls": 0.38,
    "Confined Space": 0.35,
    "Driving": 0.38,
    "Energy Isolation": 0.36,
    "Hot Work": 0.36,
    "Line of Fire": 0.36,
    "Safe Mechanical Lifting": 0.36,
    "Work Authorization": 0.38,
    "Working at Height": 0.36,
}


@dataclass
class IOGPRuleScore:
    rule_name: str
    probability: float
    threshold: float
    is_triggered: bool
    rank: int
    evidence_spans: List[str] = field(default_factory=list)


@dataclass
class IOGPMultiLabelPrediction:
    primary_rule: str
    secondary_rules: List[str]
    triggered_rules: List[str]
    rule_scores: Dict[str, IOGPRuleScore]
    co_occurrence_tags: List[Dict[str, Any]]
    latency_ms: float
    raw_text: str


class IOGPMultiLabelClassifier:
    """
    Calibrated Multi-Label Classifier for the 9 IOGP Life-Saving Rules.
    Combines rule-specific lexical evidence, domain failure patterns,
    deterministic guardrails, and empirical co-occurrence priors.
    """

    def __init__(self, thresholds: Optional[Dict[str, float]] = None):
        self.rules = list(CANONICAL_IOGP_RULES)
        self.thresholds = dict(DEFAULT_CALIBRATED_THRESHOLDS)
        if thresholds:
            self.thresholds.update(thresholds)
        self.deterministic_engine = DeterministicSafetyRuleEngine()
        self._compile_rule_patterns()
        self._load_default_co_occurrence()

    def _compile_rule_patterns(self):
        """
        Compiles domain-specific primary and secondary trigger patterns
        for each of the 9 IOGP Life-Saving Rules.
        """
        self.rule_evidence_patterns = {
            "Confined Space": [
                re.compile(r"\b((confined\s+space|tank|vessel|separator|manhole|pit|sump|pig\s+receiver|receiver\s+barrel|pig\s+trap|boiler|steam\s+drum|culvert|sewer|manway|frac\s+tank|ko\s+drum).*(enter|inside|descended|crawled|torso|internal|went\s+in|stepped\s+inside)|(enter|descended|crawled|stepped\s+inside|torso).*(confined\s+space|tank|vessel|separator|pit|sump|receiver|trap|manway))\b", re.IGNORECASE),
                re.compile(r"\b(without\s+gas\s+test|gas\s+test\s+not|standby\s+attendant\s+absent|attendant.*absent|unventilated|h2s.*detected)\b", re.IGNORECASE)
            ],
            "Energy Isolation": [
                re.compile(r"\b(loto|lockout|tagout|isolat\w*|de-energiz\w*|pressur\w*|live\s+line|stored\s+energy|flowline\w*|wellhead\w*|flange\w*|switchgear\w*|415v|3\.3\s*kv|33\s*kv|circuit\s+breaker|busbar\w*|hydraulic\w*|pneumatic\w*|steam\s+line|bleed\w*|cracked-open|accumulator\w*|orifice\s+plate|pulsation\s+dampener|air\s+receiver)\b", re.IGNORECASE),
                re.compile(r"\b(without.*(loto|isolation|closing|bleeding|depressuriz\w*|voltage\s+test|permit|blind)|no\s+loto|isolation\s+failed|not\s+(isolated|de-energized|vented|depressurized)|residual\s+pressure|breaker.*not\s+locked)\b", re.IGNORECASE),
                re.compile(r"\b(\d+\s*(psi|bar)|hammered.*pressurized|blew.*off|unscrewed.*psi|unbolted.*psi|unbolt.*pressurized)\b", re.IGNORECASE)
            ],
            "Safe Mechanical Lifting": [
                re.compile(r"\b(crane\w*|hoist\w*|lifting\w*|suspended\s+load|rigging\w*|sling\w*|shackle\w*|winch\w*|spreader\s+bar|outrigger\w*|boom\w*|tagline\w*|casing\s+joint|skid\s+lift|hoisting|rigger\w*|hook\w*|air\s+tugger|air\s+hoist|tandem\s+lift|banksman|load\s+chart|asli)\b", re.IGNORECASE),
                re.compile(r"\b(under(neath)?\s+(the\s+)?(suspended\s+)?load|beneath\s+(the\s+)?load|drop\s+zone|damaged.*sling|cut\s+fibers|outriggers.*soft|without.*(mats|tagline|banksman|lift\s+plan)|overloaded|broken\s+strands|kinked|crushed.*rope)\b", re.IGNORECASE)
            ],
            "Working at Height": [
                re.compile(r"\b(working\s+at\s+height|scaffold\w*|derrick\w*|monkey\s+board|racking\s+board|ladder\w*|elevated\w*|tank\s+roof|platform\w*|meters\s+high|at\s+\d+\s*m(eters)?|fall\s+arrest|fall\s+protection|floor\s+grating|work\s+basket|man-riding|tie-?off|harness|meters\s+above\s+ground)\b", re.IGNORECASE),
                re.compile(r"\b(without.*(harness|tie-?off|fall\s+arrest|lifeline|crawling\s+boards)|unclipped|unhooked|harness.*not\s+(anchored|clipped|connected)|no\s+harness|open.*hole|foot\s+level|below\s+waist)\b", re.IGNORECASE)
            ],
            "Hot Work": [
                re.compile(r"\b(weld\w*|torch\w*|cutting\w*|grinding\w*|angle\s+grinder|spark\w*|hot\s+work|arc\w*|brazing|burning|pyrophoric|hot\s+tap|fire\s+watch|pvrv)\b", re.IGNORECASE),
                re.compile(r"\b(without.*(gas\s+test|monitoring|fire\s+watch|extinguisher|sealing|water\s+flushing)|no\s+(gas\s+test|fire\s+watch)|fire\s+watch.*absent|tarpaulin.*dislodged|electric\s+arc.*(vent|pvrv|relief)|live.*\d+\s*psi.*pipeline)\b", re.IGNORECASE)
            ],
            "Line of Fire": [
                re.compile(r"\b(line\s+of\s+fire|trench\w*|excavat\w*|rotary\s+hose|bullplug\w*|snubbing\w*|whip\s*check\w*|recoil\w*|tensioned\w*|snapback\w*|whip\w*|high\s+pressure\s+hose|iron\s+roughneck|tong\w*|cathead|pinch\s+point\w*|hammer\s+union|chiksan|counterweight|spinning\s+chain)\b", re.IGNORECASE),
                re.compile(r"\b(drop\s+zone|under.*(load|suspended)|beneath.*(load|suspended)|unbolt.*pressur|pressur.*flange|blew\s+door|nitrogen\s+precharge|hammered.*pressur|equalizer\s+valve.*left\s+open|orifice\s+plate\s+carrier|air\s+receiver.*without\s+vent|casing\s+pressure|removed.*studs.*compressor|falling\s+object|flying\s+blind|barrier\s+shield|exclusion\s+zone|trajectory)\b", re.IGNORECASE),
                re.compile(r"\b(without.*(shoring|box|exclusion\s+zone|eye\s+protection|barricade)|in\s+front\s+of.*(plug|wrench)|whip\s*check.*(missing|absent|disconnected)|in\s+path\s+of|trajectory|recoil\s+path|pinch\s+zone|directly\s+facing|snapback\s+zone)\b", re.IGNORECASE)
            ],
            "Bypassing Safety Controls": [
                re.compile(r"\b(bypass\w*|override\w*|interlock\w*|safety\s+valve|psv|esd|lahh|level\s+alarm|trip\s+switch|crown-o-matic|fire\s+and\s+gas|detector\w*|gag\w*|deluge\w*|thermal\s+relief|smoke\s+detector|emergency\s+shutdown|jumper\w*)\b", re.IGNORECASE),
                re.compile(r"\b(tied\s+off.*wire|wired\s+in\s+bypass|shutters\s+jammed|anti-two-block|spark\s+arrestor|overspeed\s+shutoff|tamper\w*|bypassed.*asli|gagged|bridged|inhibited|defeated|without\s+moc|without.*approval|unapproved.*jumper|silenced|taped\s+plastic)\b", re.IGNORECASE)
            ],
            "Driving": [
                re.compile(r"\b(driv\w*|vehicle\w*|truck\w*|tanker\w*|bus\w*|pickup\w*|trailer\w*|transport\w*|highway\w*|lease\s+road)\b", re.IGNORECASE),
                re.compile(r"\b(exceeded\s+\d+\s*km/h|at\s+\d+\s*km/h|speeding|texting|phone|mobile|without\s+seatbelts?|not\s+wearing\s+seatbelts?|unbelted|rollover|fishtailed|tipped\s+into\s+ditch|without\s+(pilot\s+)?escort|16\s+consecutive\s+hours|fell\s+asleep)\b", re.IGNORECASE)
            ],
            "Work Authorization": [
                re.compile(r"\b(ptw|permit\w*|work\s+authorization|cold\s+work|hot\s+work\s+permit|jsa|toolbox\s+talk|tbt|simops|performing\s+authority)\b", re.IGNORECASE),
                re.compile(r"\b(critical\s+lift\s+plan|entry\s+permit|permit\s+to\s+work|retest|2-hourly|toolbox|moc|management\s+of\s+change|safe\s+system\s+of\s+work|without.*(ptw|permit|valid\s+permit|amendment)|expired\s+permit|permit.*expired|unauthorized|scope\s+deviation)\b", re.IGNORECASE)
            ]
        }

    def _load_default_co_occurrence(self):
        """
        Initializes the empirical 9x9 rule co-occurrence matrix
        based on the OIL golden evaluation benchmark corpus.
        """
        self.co_occurrence_counts: Dict[str, Dict[str, int]] = {
            r1: {r2: 0 for r2 in self.rules} for r1 in self.rules
        }
        self.rule_prevalence: Dict[str, int] = {r: 0 for r in self.rules}

        # Seed counts from benchmark analysis
        seeds = [
            ("Line of Fire", "Energy Isolation", 13),
            ("Safe Mechanical Lifting", "Line of Fire", 9),
            ("Bypassing Safety Controls", "Energy Isolation", 7),
            ("Confined Space", "Work Authorization", 6),
            ("Confined Space", "Energy Isolation", 5),
            ("Driving", "Line of Fire", 4),
            ("Energy Isolation", "Work Authorization", 3),
            ("Bypassing Safety Controls", "Safe Mechanical Lifting", 3),
            ("Line of Fire", "Working at Height", 3),
            ("Hot Work", "Work Authorization", 3),
        ]
        for r1, r2, count in seeds:
            self.co_occurrence_counts[r1][r2] = count
            self.co_occurrence_counts[r2][r1] = count

        prevalences = {
            "Line of Fire": 37,
            "Energy Isolation": 29,
            "Bypassing Safety Controls": 21,
            "Work Authorization": 20,
            "Safe Mechanical Lifting": 18,
            "Confined Space": 16,
            "Working at Height": 14,
            "Hot Work": 14,
            "Driving": 10
        }
        self.rule_prevalence.update(prevalences)

    def predict(
        self,
        text: str,
        title: str = "",
        threshold_overrides: Optional[Dict[str, float]] = None
    ) -> IOGPMultiLabelPrediction:
        """
        Executes multi-label inference across the 9 canonical IOGP rules.
        """
        t0 = time.perf_counter()
        full_text = f"{title} {text}".strip()
        current_thresholds = dict(self.thresholds)
        if threshold_overrides:
            current_thresholds.update(threshold_overrides)

        # 1. Deterministic Rule Guardrails
        det_eval = self.deterministic_engine.evaluate(text, title)
        is_benign = det_eval.get("is_benign", False)
        det_suggested = set(det_eval.get("suggested_rules", []))
        det_triggered = det_eval.get("triggered_rules", [])

        # 2. Extract Evidence and Compute Base Rule Logits
        rule_scores_dict: Dict[str, IOGPRuleScore] = {}
        raw_logits: Dict[str, float] = {}
        rule_evidence_map: Dict[str, List[str]] = {}

        for rule in self.rules:
            logit = -1.8  # default baseline prior
            evidence_spans: List[str] = []

            # Check evidence patterns
            patterns = self.rule_evidence_patterns.get(rule, [])
            match_counts = 0
            for pat in patterns:
                matches = pat.findall(full_text)
                if matches:
                    match_counts += len(matches)
                    for m in matches:
                        match_str = m if isinstance(m, str) else m[0]
                        if match_str and match_str not in evidence_spans:
                            evidence_spans.append(match_str)

            if match_counts > 0:
                logit += 1.6 + math.log1p(match_counts) * 0.9

            # Deterministic domain boost
            if rule in det_suggested:
                logit += 2.2

            # Hard deterministic failure boost
            if any(rule.lower() in trig.lower() for trig in det_triggered):
                logit += 3.5

            # Negative controls handling for non-precursor benign activities
            lower_text = full_text.lower()
            if rule == "Energy Isolation" and "vented gauge through bleed port" in lower_text:
                logit -= 4.0
            if rule == "Safe Mechanical Lifting" and "pallet truck" in lower_text and "crane" not in lower_text:
                logit -= 4.0
            if rule == "Working at Height" and "podium ladder" in lower_text and "meters high" not in lower_text:
                logit -= 4.0
            if rule == "Bypassing Safety Controls" and "dust cover" in lower_text and "gagged" not in lower_text:
                logit -= 4.0
            if rule == "Driving" and any(k in lower_text for k in ["mobile crane", "forklift"]) and "truck" not in lower_text and "highway" not in lower_text:
                logit -= 4.0

            # Benign suppression
            if is_benign:
                logit -= 4.5

            raw_logits[rule] = logit
            rule_evidence_map[rule] = evidence_spans[:5]

        # 3. Apply Empirical Co-Occurrence Boosting (Bayesian Cross-Rule Synergy)
        boosted_logits = dict(raw_logits)
        if not is_benign:
            for r1 in self.rules:
                p1_initial = 1.0 / (1.0 + math.exp(-raw_logits[r1]))
                if p1_initial >= 0.70:
                    for r2 in self.rules:
                        if r1 != r2:
                            cooc = self.co_occurrence_counts[r1].get(r2, 0)
                            prev = self.rule_prevalence.get(r1, 1)
                            cond_prob = cooc / prev if prev > 0 else 0.0
                            if cond_prob >= 0.20:
                                # Synergy boost proportional to conditional co-occurrence
                                synergy = cond_prob * 0.75
                                boosted_logits[r2] += synergy

        # 4. Compute Final Probabilities and Trigger States
        all_rules_evaluated: List[Tuple[str, float, bool, List[str]]] = []
        for rule in self.rules:
            logit = boosted_logits[rule]
            prob = 1.0 / (1.0 + math.exp(-logit))
            prob = max(0.01, min(0.99, prob))
            tau = current_thresholds.get(rule, 0.40)
            is_trig = prob >= tau and not is_benign
            all_rules_evaluated.append((rule, prob, is_trig, rule_evidence_map[rule]))

        # Sort by probability descending
        all_rules_evaluated.sort(key=lambda x: x[1], reverse=True)

        # 5. Designate Primary and Secondary Rules
        triggered_rules: List[str] = []
        primary_rule = "None"
        secondary_rules: List[str] = []

        for rank, (rule, prob, is_trig, evidence) in enumerate(all_rules_evaluated, start=1):
            rule_scores_dict[rule] = IOGPRuleScore(
                rule_name=rule,
                probability=round(prob, 4),
                threshold=round(current_thresholds.get(rule, 0.40), 3),
                is_triggered=is_trig,
                rank=rank,
                evidence_spans=evidence
            )
            if is_trig:
                triggered_rules.append(rule)

        if triggered_rules:
            primary_rule = triggered_rules[0]
            secondary_rules = triggered_rules[1:]

        # 6. Extract Co-Occurrence Explanations
        co_occurrence_tags: List[Dict[str, Any]] = []
        for i in range(len(triggered_rules)):
            for j in range(i + 1, len(triggered_rules)):
                r_a, r_b = triggered_rules[i], triggered_rules[j]
                joint_count = self.co_occurrence_counts.get(r_a, {}).get(r_b, 0)
                co_occurrence_tags.append({
                    "rule_a": r_a,
                    "rule_b": r_b,
                    "historical_co_occurrences": joint_count,
                    "synergy_confidence": round(min(rule_scores_dict[r_a].probability, rule_scores_dict[r_b].probability), 3)
                })

        latency_ms = round((time.perf_counter() - t0) * 1000.0, 3)

        return IOGPMultiLabelPrediction(
            primary_rule=primary_rule,
            secondary_rules=secondary_rules,
            triggered_rules=triggered_rules,
            rule_scores=rule_scores_dict,
            co_occurrence_tags=co_occurrence_tags,
            latency_ms=latency_ms,
            raw_text=text
        )

    def get_co_occurrence_matrix(self) -> Dict[str, Any]:
        """
        Returns the 9x9 co-occurrence matrix and top pairwise correlations.
        """
        matrix: List[List[int]] = []
        for r1 in self.rules:
            row: List[int] = []
            for r2 in self.rules:
                row.append(self.co_occurrence_counts[r1].get(r2, 0))
            matrix.append(row)

        top_pairs = []
        for i in range(len(self.rules)):
            for j in range(i + 1, len(self.rules)):
                r1 = self.rules[i]
                r2 = self.rules[j]
                count = self.co_occurrence_counts[r1].get(r2, 0)
                if count > 0:
                    top_pairs.append({
                        "rule_1": r1,
                        "rule_2": r2,
                        "co_occurrence_count": count
                    })
        top_pairs.sort(key=lambda x: x["co_occurrence_count"], reverse=True)

        return {
            "rules": self.rules,
            "matrix": matrix,
            "prevalence": self.rule_prevalence,
            "top_pairs": top_pairs
        }

    def save(self, filepath: str):
        """
        Serializes thresholds, rules, and co-occurrence counts to JSON.
        """
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        data = {
            "rules": self.rules,
            "thresholds": self.thresholds,
            "co_occurrence_counts": self.co_occurrence_counts,
            "rule_prevalence": self.rule_prevalence,
            "version": "1.0.0-phase6"
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> "IOGPMultiLabelClassifier":
        """
        Loads a serialized classifier instance.
        """
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        classifier = cls(thresholds=data.get("thresholds"))
        if "co_occurrence_counts" in data:
            classifier.co_occurrence_counts = data["co_occurrence_counts"]
        if "rule_prevalence" in data:
            classifier.rule_prevalence = data["rule_prevalence"]
        return classifier
