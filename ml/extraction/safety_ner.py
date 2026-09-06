"""
OIL-SIF Guardian — Safety Information Extraction Engine (NER & Domain Gazetteers)
Extracts 8 safety entity categories with exact character offsets from unstructured HSSE narratives:
1. ACTIVITY
2. HAZARD
3. HAZARDOUS_ENERGY
4. WORKER_EXPOSURE
5. CRITICAL_CONTROL
6. CONTROL_FAILURE
7. EQUIPMENT
8. CREDIBLE_CONSEQUENCE

Also produces token-level BIO sequence tagging (B-, I-, O) and gazetteer taxonomies.
Complies with Rule 2 of ENGINEERING_RULES.md: Deterministic Safety Guardrails Overrule Pure ML.
"""

import re
import json
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Tuple, Optional, Any, Set


class SafetyEntityCategory:
    ACTIVITY = "ACTIVITY"
    HAZARD = "HAZARD"
    HAZARDOUS_ENERGY = "HAZARDOUS_ENERGY"
    WORKER_EXPOSURE = "WORKER_EXPOSURE"
    CRITICAL_CONTROL = "CRITICAL_CONTROL"
    CONTROL_FAILURE = "CONTROL_FAILURE"
    EQUIPMENT = "EQUIPMENT"
    CREDIBLE_CONSEQUENCE = "CREDIBLE_CONSEQUENCE"

    ALL_CATEGORIES = [
        ACTIVITY,
        HAZARD,
        HAZARDOUS_ENERGY,
        WORKER_EXPOSURE,
        CRITICAL_CONTROL,
        CONTROL_FAILURE,
        EQUIPMENT,
        CREDIBLE_CONSEQUENCE,
    ]


@dataclass
class EntitySpan:
    """Represents an extracted entity span grounded in the raw text narrative."""
    text: str
    label: str
    start_char: int
    end_char: int
    confidence: float = 1.0
    source: str = "GAZETTEER"  # GAZETTEER, PATTERN, CONTEXTUAL
    category_description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class BIOTag:
    """Token-level BIO representation."""
    token: str
    tag: str
    start_char: int
    end_char: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TrieNode:
    def __init__(self):
        self.children: Dict[str, 'TrieNode'] = {}
        self.is_end_of_word: bool = False
        self.label: Optional[str] = None
        self.original_term: Optional[str] = None
        self.confidence: float = 1.0


class SafetyGazetteerTrie:
    """Trie structure for fast multi-token longest match extraction."""
    def __init__(self):
        self.root = TrieNode()
        self.total_entries = 0

    def insert(self, phrase: str, label: str, confidence: float = 1.0):
        cleaned = phrase.strip().lower()
        if not cleaned:
            return
        tokens = cleaned.split()
        node = self.root
        for token in tokens:
            if token not in node.children:
                node.children[token] = TrieNode()
            node = node.children[token]
        node.is_end_of_word = True
        node.label = label
        node.original_term = phrase.strip()
        node.confidence = confidence
        self.total_entries += 1


class SafetyNER:
    """
    High-precision domain extractor and BIO sequence tagger for oilfield HSSE incident reports.
    """

    # Category descriptions for UI tooltips and auditability
    CATEGORY_DESCRIPTIONS = {
        SafetyEntityCategory.ACTIVITY: "Operational task or maintenance process underway",
        SafetyEntityCategory.HAZARD: "Physical source of danger, toxic gas, or uncontrolled release",
        SafetyEntityCategory.HAZARDOUS_ENERGY: "Energy vector (pressure, mechanical, gravity, chemical, etc.)",
        SafetyEntityCategory.WORKER_EXPOSURE: "Worker physical positioning, location in drop zone, or line-of-fire",
        SafetyEntityCategory.CRITICAL_CONTROL: "Mandatory preventative or mitigative safety barrier",
        SafetyEntityCategory.CONTROL_FAILURE: "Omission, degradation, failure, or bypass of a critical barrier",
        SafetyEntityCategory.EQUIPMENT: "Oilfield machinery, wellhead, piping, or rig component",
        SafetyEntityCategory.CREDIBLE_CONSEQUENCE: "Catastrophic or severe potential outcome / fatal injury mode",
    }

    # Built-in Domain Gazetteers tailored for Oil India Limited (OIL) upstream operations
    BUILTIN_GAZETTEERS: Dict[str, List[str]] = {
        SafetyEntityCategory.ACTIVITY: [
            "vessel cleanout", "vessel cleaning", "separator entry", "confined space entry",
            "hydrotesting", "hydro test", "pressure test", "pressure testing", "leak test",
            "casing hoisting", "casing makeup", "tripping pipe", "tripping in", "tripping out",
            "hot work", "welding", "gas cutting", "grinding", "torch cutting",
            "cold cutting", "flange unbolting", "flange torqueing", "spading", "line breaking",
            "pigging", "pig launching", "pig receiving", "wireline logging", "slickline operation",
            "well servicing", "well workover", "workover operation", "drilling", "snubbing",
            "scaffolding erection", "scaffold dismantling", "scaffolding modification",
            "excavation", "trenching", "crane lifting", "heavy lift", "tandem lift",
            "rig rigging up", "rig moving", "skidding rig", "chemical flushing", "acidizing",
            "cementing", "coiled tubing cleanout", "swabbing", "well killing", "bullheading",
            "nipple up bop", "nipple down bop", "pulling tubing", "running casing",
            "loading crude tanker", "transferring condensate", "sand jetting"
        ],
        SafetyEntityCategory.HAZARD: [
            "h2s gas", "h2s", "hydrogen sulfide", "sour gas", "sour crude", "pyrophoric iron",
            "flammable vapor", "hydrocarbon gas", "crude oil vapor", "natural gas cloud",
            "high pressure gas kick", "gas kick", "well kick", "underbalanced kick",
            "uncontrolled pressure release", "trapped pressure", "residual pressure",
            "unvented pressure", "annular pressure buildup", "hydraulic pressure surge",
            "suspended load", "unsupported drill string", "swinging tubular",
            "unsupported trench", "soil collapse", "excavation wall collapse",
            "high voltage overhead line", "live electrical cable", "open switchgear busbar",
            "toxic atmosphere", "oxygen deficient atmosphere", "asphyxiating atmosphere",
            "slippery rig floor", "open edge without railing", "unguarded opening",
            "blind corner", "congested well pad", "line snapback", "whip check failure",
            "explosive gas accumulation", "condensate mist", "hot crude spill"
        ],
        SafetyEntityCategory.HAZARDOUS_ENERGY: [
            "high pressure", "stored hydraulic pressure", "pneumatic pressure", "line pack",
            "wellhead pressure", "reservoir pressure", "hydrostatic head", "annular pressure",
            "mechanical energy", "rotating drill string", "spinning cathead", "moving sheaves",
            "drawworks drum", "iron roughneck jaws", "crushing points", "pinch point",
            "gravity energy", "suspended weight", "drop energy", "falling tubular",
            "chemical energy", "toxic exposure", "corrosive chemical", "flammable hydrocarbon",
            "thermal energy", "hot steam", "pyrophoric heat", "flash fire", "furnace flame",
            "electrical energy", "3.3 kv", "415 v", "high voltage", "static electrical charge",
            "kinetic energy", "whipping hose", "parted wire rope", "snapping line"
        ],
        SafetyEntityCategory.WORKER_EXPOSURE: [
            "inside separator vessel", "inside confined space", "inside storage tank",
            "inside excavation pit", "in trenches deeper than 1.5m", "inside mud tank",
            "under suspended load", "in drop zone", "under drill collar string",
            "directly in line of fire", "in line of fire", "adjacent to pressurized flange",
            "standing in front of bleed valve", "on monkey board without tie-off",
            "working aloft on derrick", "working at height without harness",
            "near rotating table", "on cathead deck", "straddling high pressure flowline",
            "in toxic vapor plume", "downwind of flare stack", "unventilated valve chamber",
            "unauthorized zone", "red zone of rig floor", "crane slew radius"
        ],
        SafetyEntityCategory.CRITICAL_CONTROL: [
            "continuous gas testing", "atmospheric gas test", "gas monitoring", "multi-gas detector",
            "permit to work", "ptw", "cold work permit", "hot work permit", "vessel entry permit",
            "double block and bleed", "dbb", "positive isolation", "spade blind", "slip blind",
            "lockout tagout", "loto", "safety padlock", "lockout hasp",
            "100% full body harness", "safety harness tie-off", "self-retracting lifeline",
            "certified banksman", "signalman", "flagman", "rigging supervisor",
            "standby attendant", "hole watcher", "confined space safety watcher",
            "blowout preventer", "bop stack", "annular preventer", "pipe rams", "shear rams",
            "whip check safety cable", "hobble clamp", "snubbing line", "safety sling",
            "calibrated psv", "pressure safety valve", "flame arrestor", "emergency shutdown esd",
            "self-contained breathing apparatus", "scba", "airline respirator", "supplied air",
            "trench shoring", "trench box", "soil benching", "asli load indicator",
            "toolbox talk", "tbt", "jsa review", "pre-job safety meeting"
        ],
        SafetyEntityCategory.CONTROL_FAILURE: [
            "gas test omitted", "no gas test", "gas detector not calibrated", "gas test skipped",
            "permit not issued", "unauthorized work", "ptw expired", "no hot work permit",
            "loto omitted", "loto not applied", "no locks hung", "valve not isolated",
            "single isolation failed", "isolation valve passing", "spade not inserted",
            "standby attendant absent", "standby watcher left post", "hole watcher missing",
            "harness not clipped", "harness not anchored", "failed to tie off", "100% tie-off ignored",
            "banksman absent", "no signalman", "lift performed blind", "overload alarm disabled",
            "whip check unlatched", "whip check missing", "whip check broken", "safety pin sheared",
            "bop failed test", "shear rams not tested", "annular packing leaking",
            "safety interlock bypassed", "crown-o-matic bypassed", "esd jumpered", "psv gagged",
            "shore box omitted", "no trench shoring", "excavation unsloped",
            "scba not worn", "breathing apparatus out of air", "ventilation fan turned off"
        ],
        SafetyEntityCategory.EQUIPMENT: [
            "separator vessel", "crude separator", "test separator", "flare knock-out drum",
            "ko drum", "blowout preventer", "bop", "bop stack", "annular bop", "blind rams",
            "shear rams", "choke manifold", "kill manifold", "wellhead", "christmas tree",
            "flowline", "gathering line", "chiksan line", "hammer union", "swivel joint",
            "mud pump", "shale shaker", "poor boy degasser", "mud gas separator",
            "top drive", "rotary table", "kelly", "kelly hose", "standpipe", "iron roughneck",
            "casing tongs", "power tongs", "cathead", "air tugger", "air hoist",
            "derrick", "mast", "monkey board", "catwalk", "pipe rack", "v-door",
            "crane", "winch", "wire rope", "sling", "spreader bar", "hoist line",
            "drilling rig oil-45", "drilling rig oil-78", "drilling rig oil-12",
            "workover unit wou-12", "workover unit wou-24", "early production system eps-1",
            "oil collecting station ocs-4", "gas compressor plant gcp", "ctf duliajan",
            "compressor", "scrubber", "beam pump", "sucker rod", "stuffing box",
            "pig launcher", "pig receiver", "scaffold", "diesel generator", "switchgear"
        ],
        SafetyEntityCategory.CREDIBLE_CONSEQUENCE: [
            "fatal asphyxiation", "fatal toxic inhalation", "fatal h2s poisoning", "toxic gas death",
            "crushed by dropped tubular", "crush fatality", "crushed by falling casing",
            "fatal fall from height", "fatal fall", "death from fall",
            "catastrophic blowout", "uncontrolled well blowout", "fire and explosion",
            "vapor cloud explosion", "flash fire fatality", "fatal burn", "severe thermal burn",
            "electrocution", "fatal electric shock", "trench cave-in fatality", "suffocation",
            "traumatic amputation", "amputation of limb", "severed hand", "skull fracture",
            "multiple fatalities", "loss of well containment", "environmental catastrophe"
        ]
    }

    def __init__(self, custom_terms_path: Optional[str] = None):
        self.trie = SafetyGazetteerTrie()
        self.custom_terms_path = custom_terms_path
        self._load_gazetteers()
        self._compile_patterns()

    def _load_gazetteers(self):
        """Loads built-in gazetteers and supplements them with safety_terms.json if present."""
        # 1. Load built-ins
        for category, terms in self.BUILTIN_GAZETTEERS.items():
            for term in terms:
                self.trie.insert(term, category, confidence=1.0)

        # 2. Try loading from safety_terms.json
        dict_path = None
        if self.custom_terms_path:
            dict_path = Path(self.custom_terms_path)
        else:
            default_path = Path(__file__).resolve().parents[2] / "rules" / "dictionaries" / "safety_terms.json"
            if default_path.exists():
                dict_path = default_path

        if dict_path and dict_path.exists():
            try:
                with open(dict_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                # Equipment
                for eq in data.get("equipment", []):
                    self.trie.insert(eq, SafetyEntityCategory.EQUIPMENT, confidence=1.0)
                # Hazards
                for hz in data.get("hazards", []):
                    self.trie.insert(hz, SafetyEntityCategory.HAZARD, confidence=1.0)
                # Failure modes -> CONTROL_FAILURE
                for fm in data.get("failure_modes", []):
                    self.trie.insert(fm, SafetyEntityCategory.CONTROL_FAILURE, confidence=0.98)
                # Energy sources -> HAZARDOUS_ENERGY
                energy_dict = data.get("energy_sources", {})
                for source_name, keywords in energy_dict.items():
                    for kw in keywords:
                        self.trie.insert(kw, SafetyEntityCategory.HAZARDOUS_ENERGY, confidence=0.95)
                # Facilities -> EQUIPMENT
                for fac in data.get("oil_facilities", []):
                    self.trie.insert(fac, SafetyEntityCategory.EQUIPMENT, confidence=1.0)
            except Exception as e:
                # Fall back to built-ins if JSON read fails
                pass

    def _compile_patterns(self):
        """Compiles regex patterns for pattern-based extraction."""
        self.regex_extractors = [
            # High pressure psi/bar values
            (re.compile(r'\b\d+(?:,\d+)?\s*(?:psi|bar|kg/cm2|mpa)\b', re.IGNORECASE),
             SafetyEntityCategory.HAZARDOUS_ENERGY, "PRESSURE_VALUE", 0.95),
            # High voltage values
            (re.compile(r'\b\d+(?:\.\d+)?\s*(?:kv|volts?|v)\b', re.IGNORECASE),
             SafetyEntityCategory.HAZARDOUS_ENERGY, "VOLTAGE_VALUE", 0.95),
            # Specific OIL rig / facility designations (e.g. OIL-45, WOU-12, EPS-1, OCS-4, BGH-17)
            (re.compile(r'\b(?:RIG\s*)?OIL-\d+\b|\bWOU-\d+\b|\bEPS-[12]\b|\bOCS-[148]\b|\bNHK-\d+\b|\bMOR-\d+\b|\bBGH-\d+\b', re.IGNORECASE),
             SafetyEntityCategory.EQUIPMENT, "FACILITY_DESIGNATION", 1.0),
            # OISD / DGMS regulatory references
            (re.compile(r'\bOISD(?:-STD)?-\d+\b|\bDGMS(?:-OMR)?-\d+\b|\bPNGRB-[A-Z0-9]+\b', re.IGNORECASE),
             SafetyEntityCategory.CRITICAL_CONTROL, "REGULATORY_STANDARD", 1.0),
            # Specific gas concentrations
            (re.compile(r'\b\d+(?:\.\d+)?\s*(?:ppm|%?\s*lel|%?\s*vol)\b', re.IGNORECASE),
             SafetyEntityCategory.HAZARD, "GAS_CONCENTRATION", 0.95),
            # Confined space dimensions / depth
            (re.compile(r'\b\d+(?:\.\d+)?\s*(?:meters?|m|ft|feet)\s+deep\b', re.IGNORECASE),
             SafetyEntityCategory.HAZARD, "DEPTH_DIMENSION", 0.90),
        ]

    def _tokenize(self, text: str) -> List[Tuple[str, int, int]]:
        """
        Tokenizes text into words while recording precise start and end character offsets.
        Returns list of (token_str, start_char, end_char).
        """
        tokens = []
        for match in re.finditer(r'\b[\w\-\'\.]+\b', text):
            tokens.append((match.group(0), match.start(), match.end()))
        return tokens

    def extract_entities(self, narrative: str) -> List[EntitySpan]:
        """
        Extracts all grounded safety entities with exact character offsets from the raw narrative.
        Resolves overlaps by giving priority to:
        1. Longer span length
        2. Specific critical categories: CONTROL_FAILURE > CREDIBLE_CONSEQUENCE > CRITICAL_CONTROL > HAZARD
        3. Confidence
        """
        if not narrative or not narrative.strip():
            return []

        extracted_spans: List[EntitySpan] = []
        tokens = self._tokenize(narrative)
        num_tokens = len(tokens)

        # 1. Multi-token Trie Matching (Longest Match)
        i = 0
        while i < num_tokens:
            node = self.trie.root
            longest_match = None
            j = i
            while j < num_tokens:
                token_clean = tokens[j][0].lower()
                if token_clean in node.children:
                    node = node.children[token_clean]
                    if node.is_end_of_word:
                        start_c = tokens[i][1]
                        end_c = tokens[j][2]
                        matched_text = narrative[start_c:end_c]
                        longest_match = EntitySpan(
                            text=matched_text,
                            label=node.label,
                            start_char=start_c,
                            end_char=end_c,
                            confidence=node.confidence,
                            source="GAZETTEER",
                            category_description=self.CATEGORY_DESCRIPTIONS.get(node.label, "")
                        )
                    j += 1
                else:
                    break
            if longest_match:
                extracted_spans.append(longest_match)
                # Advance past the matched tokens
                # To capture overlapping or nested spans, we can advance by 1
            i += 1

        # 2. Regex Pattern Matching
        for pattern, label, source, conf in self.regex_extractors:
            for match in pattern.finditer(narrative):
                start_c = match.start()
                end_c = match.end()
                matched_text = narrative[start_c:end_c]
                extracted_spans.append(EntitySpan(
                    text=matched_text,
                    label=label,
                    start_char=start_c,
                    end_char=end_c,
                    confidence=conf,
                    source=f"PATTERN_{source}",
                    category_description=self.CATEGORY_DESCRIPTIONS.get(label, "")
                ))

        # 3. Contextual and Grammar Heuristics
        extracted_spans.extend(self._extract_contextual_heuristics(narrative))

        # 4. Resolve overlapping spans
        resolved_spans = self._resolve_overlaps(narrative, extracted_spans)

        return resolved_spans

    def _extract_contextual_heuristics(self, narrative: str) -> List[EntitySpan]:
        """Applies specialized oilfield contextual cues (e.g. negated controls = CONTROL_FAILURE)."""
        heuristic_spans = []
        lower = narrative.lower()

        # "without [X]" / "no [X]" / "omitted [X]" / "failure to [X]"
        negation_patterns = [
            (re.compile(r'\b(?:without|no|lacked|omitted|failed to conduct|absence of)\s+([a-zA-Z0-9\s\-]+?)(?=[,\.;]|\bwhile\b|\band\b|\bwhen\b|$)', re.IGNORECASE),
             SafetyEntityCategory.CONTROL_FAILURE),
            (re.compile(r'\b(?:unauthorized|uncalibrated|defective|gagged|bypassed)\s+([a-zA-Z0-9\s\-]+?)(?=[,\.;]|\bwhile\b|\band\b|\bwhen\b|$)', re.IGNORECASE),
             SafetyEntityCategory.CONTROL_FAILURE),
        ]

        for pat, label in negation_patterns:
            for match in pat.finditer(narrative):
                full_phrase = match.group(0).strip()
                start_c = match.start()
                end_c = start_c + len(full_phrase)
                # Keep span reasonable length (< 60 chars)
                if len(full_phrase) <= 60 and len(full_phrase.split()) <= 7:
                    heuristic_spans.append(EntitySpan(
                        text=narrative[start_c:end_c],
                        label=label,
                        start_char=start_c,
                        end_char=end_c,
                        confidence=0.92,
                        source="CONTEXTUAL_NEGATION",
                        category_description=self.CATEGORY_DESCRIPTIONS.get(label, "")
                    ))

        return heuristic_spans

    def _resolve_overlaps(self, narrative: str, spans: List[EntitySpan]) -> List[EntitySpan]:
        """
        Deduplicates and resolves overlapping spans deterministically.
        Strictly guarantees:
        1. No two spans overlap in character indices.
        2. raw_text[start_char:end_char] == span.text.
        3. Ordered by start_char ascending.
        """
        if not spans:
            return []

        # Validate exact substring match against raw narrative
        valid_spans = []
        for s in spans:
            if narrative[s.start_char:s.end_char] == s.text:
                valid_spans.append(s)

        # Priority score function
        category_weights = {
            SafetyEntityCategory.CONTROL_FAILURE: 10,
            SafetyEntityCategory.CREDIBLE_CONSEQUENCE: 9,
            SafetyEntityCategory.WORKER_EXPOSURE: 8,
            SafetyEntityCategory.CRITICAL_CONTROL: 7,
            SafetyEntityCategory.HAZARDOUS_ENERGY: 6,
            SafetyEntityCategory.HAZARD: 5,
            SafetyEntityCategory.ACTIVITY: 4,
            SafetyEntityCategory.EQUIPMENT: 3,
        }

        def score(s: EntitySpan):
            span_len = s.end_char - s.start_char
            cat_prio = category_weights.get(s.label, 1)
            return (cat_prio, span_len, s.confidence)

        # Sort spans by start_char, then by score descending
        valid_spans.sort(key=lambda s: (s.start_char, -score(s)[0], -score(s)[1]))

        # Greedy non-overlapping selection
        chosen_spans: List[EntitySpan] = []
        for candidate in valid_spans:
            # Check overlap with already chosen spans
            overlap = False
            for chosen in chosen_spans:
                if not (candidate.end_char <= chosen.start_char or candidate.start_char >= chosen.end_char):
                    # Overlap detected
                    overlap = True
                    # If candidate has strictly higher priority and longer span, replace
                    if score(candidate) > score(chosen):
                        chosen_spans.remove(chosen)
                        chosen_spans.append(candidate)
                    break
            if not overlap:
                chosen_spans.append(candidate)

        chosen_spans.sort(key=lambda s: s.start_char)
        return chosen_spans

    def extract_entities_by_category(self, narrative: str) -> Dict[str, List[Dict[str, Any]]]:
        """Extracts entities grouped by category."""
        spans = self.extract_entities(narrative)
        grouped = {cat: [] for cat in SafetyEntityCategory.ALL_CATEGORIES}
        for s in spans:
            if s.label in grouped:
                grouped[s.label].append(s.to_dict())
            else:
                grouped[s.label] = [s.to_dict()]
        return grouped

    def generate_bio_tags(self, narrative: str) -> List[BIOTag]:
        """
        Converts narrative into standard tokenized BIO format (B-TAG, I-TAG, O).
        Strictly guarantees:
        - Every token offset matches narrative[start:end].
        - An I-TAG is always preceded by B-TAG or I-TAG of the same category.
        """
        if not narrative or not narrative.strip():
            return []

        tokens = self._tokenize(narrative)
        spans = self.extract_entities(narrative)

        bio_tags: List[BIOTag] = []

        for token_text, t_start, t_end in tokens:
            assigned_tag = "O"

            # Check if this token falls inside any extracted span
            for span in spans:
                if span.start_char <= t_start and t_end <= span.end_char:
                    # Token is within span
                    # Check if it's the first token of the span
                    if t_start == span.start_char or (bio_tags and bio_tags[-1].tag == "O") or (bio_tags and not bio_tags[-1].tag.endswith(span.label)):
                        assigned_tag = f"B-{span.label}"
                    else:
                        assigned_tag = f"I-{span.label}"
                    break

            bio_tags.append(BIOTag(
                token=token_text,
                tag=assigned_tag,
                start_char=t_start,
                end_char=t_end
            ))

        # Enforce BIO consistency (safety check)
        for idx in range(len(bio_tags)):
            current_tag = bio_tags[idx].tag
            if current_tag.startswith("I-"):
                label = current_tag[2:]
                if idx == 0:
                    bio_tags[idx].tag = f"B-{label}"
                else:
                    prev_tag = bio_tags[idx - 1].tag
                    if not (prev_tag == f"B-{label}" or prev_tag == f"I-{label}"):
                        bio_tags[idx].tag = f"B-{label}"

        return bio_tags

    def get_taxonomy_statistics(self) -> Dict[str, Any]:
        """Returns statistics of the loaded gazetteers and supported labels."""
        category_counts = {cat: len(terms) for cat, terms in self.BUILTIN_GAZETTEERS.items()}
        return {
            "supported_categories": SafetyEntityCategory.ALL_CATEGORIES,
            "category_descriptions": self.CATEGORY_DESCRIPTIONS,
            "builtin_terms_count": sum(category_counts.values()),
            "terms_by_category": category_counts,
            "trie_entries_loaded": self.trie.total_entries,
            "regex_patterns_count": len(self.regex_extractors),
            "engine": "SafetyNER_OIL_v1.0"
        }
