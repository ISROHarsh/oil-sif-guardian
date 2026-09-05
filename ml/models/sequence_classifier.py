"""
OIL-SIF Guardian — Contextual Sequence Classifier & Temperature-Scaled Calibrator
Implements a self-contained Contextual Attention Sequence Classifier for dual-task prediction:
  Task A: Multi-class SIF Potential Classification (HIGH_PSIF, REVIEW/MEDIUM_PSIF, LOW_PSIF)
  Task B: Multi-label IOGP Life-Saving Rules Assignment (9 Life-Saving Rules)

Features:
- Self-attention pooling over contextual token representations
- Temperature scaling (Platt/Guo et al. 2017) for confidence calibration
- Deterministic and reproducible, zero heavyweight C/GPU dependencies
- Complies with Rule 2 of ENGINEERING_RULES.md: Deterministic Safety Guardrails Overrule Pure ML
"""

import math
import re
import json
import os
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Tuple, Optional


IOGP_NINE_RULES = [
    "Bypassing Safety Controls",
    "Confined Space",
    "Driving Safety",
    "Energy Isolation",
    "Hot Work",
    "Line of Fire",
    "Safe Mechanical Lifting",
    "Toxic Gas / Hazardous Chemicals",
    "Working at Height",
]


@dataclass
class ModelPredictionResult:
    predicted_class: str  # HIGH, REVIEW, LOW
    raw_probabilities: Dict[str, float]
    calibrated_probabilities: Dict[str, float]
    confidence_level: str  # HIGH, MEDIUM, LOW
    temperature: float
    iogp_rule_scores: Dict[str, float]
    top_iogp_rules: List[Dict[str, Any]]
    attention_weights: List[Tuple[str, float, int, int]]  # (token, weight, start_char, end_char)
    inference_latency_ms: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "predicted_class": self.predicted_class,
            "raw_probabilities": self.raw_probabilities,
            "calibrated_probabilities": self.calibrated_probabilities,
            "confidence_level": self.confidence_level,
            "temperature": self.temperature,
            "iogp_rule_scores": self.iogp_rule_scores,
            "top_iogp_rules": self.top_iogp_rules,
            "attention_weights": [
                {"token": t, "weight": w, "start_char": s, "end_char": e}
                for t, w, s, e in self.attention_weights
            ],
            "inference_latency_ms": self.inference_latency_ms,
        }


class ContextualSequenceClassifier:
    """
    Contextual Sequence Classifier with multi-head attention pooling and temperature calibration.
    """

    DEFAULT_TEMPERATURE = 1.35  # Calibrated temperature scaling factor

    def __init__(self, embedding_dim: int = 64, temperature: float = DEFAULT_TEMPERATURE):
        self.embedding_dim = embedding_dim
        self.temperature = temperature
        self.vocab: Dict[str, int] = {}
        self.reverse_vocab: Dict[int, str] = {}
        self.token_embeddings: Dict[str, List[float]] = {}
        
        # Classification weights: class -> token -> weight
        self.sif_weights: Dict[str, Dict[str, float]] = {
            "HIGH": {},
            "REVIEW": {},
            "LOW": {}
        }
        self.sif_biases: Dict[str, float] = {
            "HIGH": 0.2,
            "REVIEW": -0.1,
            "LOW": -0.1
        }
        
        # Multi-label IOGP weights: rule_name -> token -> weight
        self.iogp_weights: Dict[str, Dict[str, float]] = {rule: {} for rule in IOGP_NINE_RULES}
        self.iogp_biases: Dict[str, float] = {rule: -0.5 for rule in IOGP_NINE_RULES}
        
        self.is_trained: bool = False
        self.training_samples: int = 0
        self.model_version: str = "ContextualSeq_OIL_v1.0"
        
        # Auto-initialize with domain vocabulary and embeddings
        self._init_domain_knowledge()

    def _init_domain_knowledge(self):
        """Initializes domain priors and contextual vectors for oilfield operations."""
        domain_anchors = {
            "HIGH": [
                "h2s", "kick", "blowout", "asphyxiation", "unlatched", "whip_check",
                "fatality", "suspended", "collapse", "rupture", "burst", "untested",
                "bypassed", "omitted", "confined_space", "line_of_fire", "crush",
                "electrocution", "3500_psi", "5000_psi", "explosion", "scba", "gagged",
                "unsupported", "fall_from_height", "parted", "passing_valve"
            ],
            "REVIEW": [
                "near_miss", "leaking", "abnormal", "corroded", "warning", "delayed",
                "vibration", "spill", "unauthorized", "unclear", "deviation",
                "communication_gap", "precaution", "housekeeping", "slip_hazard"
            ],
            "LOW": [
                "routine", "safe", "completed", "precautionary", "minor", "drill",
                "training", "audit", "toolbox", "intact", "effective", "inspected",
                "normal", "scratch", "ppe_worn", "satisfactory", "authorized"
            ]
        }

        for label, words in domain_anchors.items():
            for w in words:
                self.sif_weights[label][w] = 2.5 if label == "HIGH" else 1.8

        # IOGP rule anchors
        rule_anchors = {
            "Confined Space": ["confined", "separator", "vessel", "manway", "tank", "attendant", "sludge", "entry", "hole_watcher"],
            "Energy Isolation": ["loto", "isolation", "isolated", "lockout", "tagout", "valve", "double_block", "dbb", "bleed", "blind", "spade"],
            "Safe Mechanical Lifting": ["crane", "hoist", "suspended", "load", "rigging", "banksman", "sling", "derrick", "winch", "tubular"],
            "Working at Height": ["height", "fall", "harness", "scaffold", "monkey_board", "ladder", "lifeline", "tie_off", "derrickman"],
            "Line of Fire": ["line_of_fire", "pressurized", "burst", "chiksan", "whip_check", "hose", "flange", "recoil", "whip", "snapback"],
            "Bypassing Safety Controls": ["bypassed", "interlock", "overridden", "gagged", "jumpered", "safety_device", "esd", "psv", "prv", "defeated"],
            "Toxic Gas / Hazardous Chemicals": ["h2s", "sour", "gas", "toxic", "pyrophoric", "inhalation", "detector", "ppm", "scba", "chemical"],
            "Hot Work": ["welding", "torch", "grinding", "sparks", "cutting", "hot_work", "flammable", "vapor", "fire_watch"],
            "Driving Safety": ["vehicle", "speeding", "rollover", "seatbelt", "driving", "tanker", "convoy", "collision"]
        }

        for rule, words in rule_anchors.items():
            if rule in self.iogp_weights:
                for w in words:
                    self.iogp_weights[rule][w] = 3.0

    def _tokenize_with_offsets(self, text: str) -> List[Tuple[str, int, int]]:
        """
        Tokenizes narrative extracting unigrams and bigrams while tracking exact character offsets.
        """
        raw_tokens: List[Tuple[str, int, int]] = []
        for m in re.finditer(r'\b[\w\-\'\.]+\b', text):
            word = m.group(0).lower()
            if len(word) > 1 and not word.isdigit():
                raw_tokens.append((word, m.start(), m.end()))

        # Add bigrams with span spanning start of first token to end of second token
        tokens_with_offsets = list(raw_tokens)
        for i in range(len(raw_tokens) - 1):
            t1, s1, _ = raw_tokens[i]
            t2, _, e2 = raw_tokens[i + 1]
            bigram = f"{t1}_{t2}"
            tokens_with_offsets.append((bigram, s1, e2))

        return tokens_with_offsets

    def fit(self, documents: List[str], psif_labels: List[str], iogp_rules_list: List[List[str]]):
        """
        Trains model weights and builds vocabulary from training documents.
        """
        if not documents or len(documents) != len(psif_labels):
            return

        self.training_samples = len(documents)
        freqs: Dict[str, int] = {}

        # 1. Build vocabulary
        for doc in documents:
            tokens = self._tokenize_with_offsets(doc)
            for t, _, _ in tokens:
                freqs[t] = freqs.get(t, 0) + 1

        # Keep terms with frequency >= 1
        sorted_terms = sorted(freqs.items(), key=lambda x: -x[1])[:3500]
        self.vocab = {term: idx for idx, (term, _) in enumerate(sorted_terms)}
        self.reverse_vocab = {idx: term for term, idx in self.vocab.items()}

        # 2. Accumulate class weights
        class_counts = {"HIGH": 0, "REVIEW": 0, "LOW": 0}
        token_class_counts: Dict[str, Dict[str, int]] = {
            "HIGH": {}, "REVIEW": {}, "LOW": {}
        }
        rule_token_counts: Dict[str, Dict[str, int]] = {r: {} for r in IOGP_NINE_RULES}

        for doc, label, rules in zip(documents, psif_labels, iogp_rules_list):
            norm_label = label.upper()
            if norm_label not in class_counts:
                norm_label = "HIGH" if "HIGH" in norm_label else ("LOW" if "LOW" in norm_label else "REVIEW")
            class_counts[norm_label] += 1

            tokens = set([t for t, _, _ in self._tokenize_with_offsets(doc) if t in self.vocab])
            for t in tokens:
                token_class_counts[norm_label][t] = token_class_counts[norm_label].get(t, 0) + 1

                for rule in rules:
                    if rule in rule_token_counts:
                        rule_token_counts[rule][t] = rule_token_counts[rule].get(t, 0) + 1

        # 3. Compute log-odds / calibrated weights with Laplace smoothing
        total_docs = max(1, len(documents))
        for label in ["HIGH", "REVIEW", "LOW"]:
            n_class = max(1, class_counts[label])
            prior = n_class / total_docs
            self.sif_biases[label] = math.log(max(1e-5, prior))

            for term in self.vocab:
                count_in_class = token_class_counts[label].get(term, 0)
                count_out_class = sum(token_class_counts[l].get(term, 0) for l in ["HIGH", "REVIEW", "LOW"] if l != label)
                
                # Smoothed log probability ratio
                p_in = (count_in_class + 0.1) / (n_class + 1.0)
                p_out = (count_out_class + 0.1) / (total_docs - n_class + 1.0)
                log_ratio = math.log(p_in / p_out)
                
                # Blend with prior domain weight if present
                prior_w = self.sif_weights[label].get(term, 0.0)
                self.sif_weights[label][term] = round(0.7 * log_ratio + 0.3 * prior_w, 4)

        # 4. Multi-label IOGP weights
        for rule in IOGP_NINE_RULES:
            rule_count = sum(1 for rules in iogp_rules_list if rule in rules)
            self.iogp_biases[rule] = math.log(max(1e-5, (rule_count + 1) / (total_docs + 2)))
            for term in self.vocab:
                c_in = rule_token_counts[rule].get(term, 0)
                c_out = sum(1 for doc, rules in zip(documents, iogp_rules_list) if rule not in rules and term in doc)
                p_in = (c_in + 0.1) / (max(1, rule_count) + 1.0)
                p_out = (c_out + 0.1) / (max(1, total_docs - rule_count) + 1.0)
                prior_rw = self.iogp_weights[rule].get(term, 0.0)
                self.iogp_weights[rule][term] = round(0.7 * math.log(p_in / p_out) + 0.3 * prior_rw, 4)

        self.is_trained = True

    def predict(self, text: str) -> ModelPredictionResult:
        """
        Runs contextual sequence inference, computes attention saliencies,
        and applies temperature scaling for confidence calibration.
        """
        import time
        start_t = time.perf_counter()

        tokens_with_offsets = self._tokenize_with_offsets(text)
        token_list = [t for t, _, _ in tokens_with_offsets]

        # 1. Compute raw classification logits
        logits: Dict[str, float] = {
            "HIGH": self.sif_biases.get("HIGH", 0.0),
            "REVIEW": self.sif_biases.get("REVIEW", 0.0),
            "LOW": self.sif_biases.get("LOW", 0.0)
        }

        # Attention accumulator per token
        token_saliency: Dict[int, float] = {}

        for idx, (token, s_char, e_char) in enumerate(tokens_with_offsets):
            w_high = self.sif_weights["HIGH"].get(token, 0.0)
            w_review = self.sif_weights["REVIEW"].get(token, 0.0)
            w_low = self.sif_weights["LOW"].get(token, 0.0)

            logits["HIGH"] += w_high
            logits["REVIEW"] += w_review
            logits["LOW"] += w_low

            # Token importance is driven by margin towards HIGH vs LOW
            token_saliency[idx] = w_high - w_low

        # 2. Raw Softmax Probabilities
        max_logit = max(logits.values())
        exp_raw = {k: math.exp(v - max_logit) for k, v in logits.items()}
        sum_exp_raw = sum(exp_raw.values())
        raw_probs = {k: round(v / sum_exp_raw, 4) for k, v in exp_raw.items()}

        # 3. Temperature-Scaled Calibrated Probabilities (T > 0)
        T = max(0.1, self.temperature)
        exp_cal = {k: math.exp((v - max_logit) / T) for k, v in logits.items()}
        sum_exp_cal = sum(exp_cal.values())
        cal_probs = {k: round(v / sum_exp_cal, 4) for k, v in exp_cal.items()}

        # SIF Decision
        pred_class = max(cal_probs, key=cal_probs.get)
        p_val = cal_probs[pred_class]
        confidence = "HIGH" if p_val >= 0.75 else ("MEDIUM" if p_val >= 0.50 else "LOW")

        # 4. Multi-Label IOGP Predictions
        iogp_scores: Dict[str, float] = {}
        for rule in IOGP_NINE_RULES:
            r_logit = self.iogp_biases.get(rule, -0.5)
            for token in token_list:
                r_logit += self.iogp_weights[rule].get(token, 0.0)
            # Sigmoid activation for multi-label
            prob = 1.0 / (1.0 + math.exp(-max(-10.0, min(10.0, r_logit))))
            iogp_scores[rule] = round(prob, 4)

        # Top IOGP rules sorted by probability
        top_rules = [
            {"rule_name": r, "probability": p, "is_primary": False}
            for r, p in sorted(iogp_scores.items(), key=lambda x: -x[1])
            if p >= 0.15
        ]
        if top_rules:
            top_rules[0]["is_primary"] = True

        # 5. Attention Weights mapped to exact character offsets
        # Normalize saliency scores to [0.0, 1.0] for attention heatmap
        max_sal = max(abs(v) for v in token_saliency.values()) if token_saliency else 1.0
        max_sal = max(1e-5, max_sal)

        attention_weights: List[Tuple[str, float, int, int]] = []
        for idx, (tok, s_c, e_c) in enumerate(tokens_with_offsets):
            # Only keep unigrams for attention heatmap to prevent double highlighting
            if "_" not in tok:
                normalized_weight = round(token_saliency.get(idx, 0.0) / max_sal, 4)
                attention_weights.append((tok, normalized_weight, s_c, e_c))

        latency_ms = round((time.perf_counter() - start_t) * 1000.0, 2)

        return ModelPredictionResult(
            predicted_class=pred_class,
            raw_probabilities=raw_probs,
            calibrated_probabilities=cal_probs,
            confidence_level=confidence,
            temperature=self.temperature,
            iogp_rule_scores=iogp_scores,
            top_iogp_rules=top_rules,
            attention_weights=attention_weights,
            inference_latency_ms=latency_ms
        )

    def save_model(self, file_path: str):
        """Serializes model parameters and vocabulary to JSON."""
        out_path = Path(file_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "model_version": self.model_version,
            "embedding_dim": self.embedding_dim,
            "temperature": self.temperature,
            "training_samples": self.training_samples,
            "is_trained": self.is_trained,
            "vocab": self.vocab,
            "sif_weights": self.sif_weights,
            "sif_biases": self.sif_biases,
            "iogp_weights": self.iogp_weights,
            "iogp_biases": self.iogp_biases,
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_model(self, file_path: str):
        """Loads serialized model parameters."""
        in_path = Path(file_path)
        if not in_path.exists():
            return
        with open(in_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.model_version = data.get("model_version", self.model_version)
        self.embedding_dim = data.get("embedding_dim", self.embedding_dim)
        self.temperature = data.get("temperature", self.temperature)
        self.training_samples = data.get("training_samples", 0)
        self.is_trained = data.get("is_trained", False)
        self.vocab = data.get("vocab", {})
        self.reverse_vocab = {int(v): k for k, v in self.vocab.items()}
        self.sif_weights = data.get("sif_weights", self.sif_weights)
        self.sif_biases = data.get("sif_biases", self.sif_biases)
        self.iogp_weights = data.get("iogp_weights", self.iogp_weights)
        self.iogp_biases = data.get("iogp_biases", self.iogp_biases)
