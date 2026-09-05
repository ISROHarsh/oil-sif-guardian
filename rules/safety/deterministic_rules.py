"""
OIL-SIF Guardian — Deterministic Safety Rule Engine
Codified industrial safety guardrails for fatal precursor detection.
"""

from typing import List, Dict, Any
import re


class DeterministicSafetyRuleEngine:
    """
    Evaluates safety incident narratives against codified zero-tolerance
    industrial precursor rules to surface critical safety signals.
    """

    def __init__(self):
        self._compile_patterns()

    def _compile_patterns(self):
        # Confined Space patterns
        self.re_confined = re.compile(
            r"\b(confined\s+space|tank|vessel|separator|manhole|column|pit|sump)\b",
            re.IGNORECASE,
        )
        self.re_entry = re.compile(
            r"\b(enter(ed|ing)?|inside|went\s+in|inspection\s+inside)\b",
            re.IGNORECASE,
        )
        self.re_no_gas_test = re.compile(
            r"\b(no\s+gas\s+test|gas\s+testing\s+was\s+not|without\s+gas\s+test|gas\s+test\s+(missing|skipped|absent|not\s+recorded))\b",
            re.IGNORECASE,
        )
        self.re_no_attendant = re.compile(
            r"\b(no\s+attendant|without\s+(an\s+)?attendant|standby\s+person\s+absent|unattended)\b",
            re.IGNORECASE,
        )

        # Work Authorization / Expired Permit
        self.re_permit_expired = re.compile(
            r"\b(permit\s+(had\s+)?expired|expired\s+permit|without\s+(a\s+)?(ptw|permit)|unauthorized\s+work|no\s+ptw)\b",
            re.IGNORECASE,
        )

        # Energy Isolation / LOTO
        self.re_pressurized = re.compile(
            r"\b(pressurized|live\s+line|stored\s+energy|high\s+pressure|gas\s+line|steam\s+line)\b",
            re.IGNORECASE,
        )
        self.re_loto_fail = re.compile(
            r"\b((no|without)\s+loto(\s+verification)?|isolation\s+failed|(not|without)\s+isolat(ed|ing|ion)|before\s+closing\s+isolation|bleed(ing)?\s+failed|lockout\s+(skipped|missing))\b",
            re.IGNORECASE,
        )

        # Lifting / Line of Fire
        self.re_lifting = re.compile(
            r"\b(crane|hoist|lifting|suspended\s+load|rigging|sling|slewing)\b",
            re.IGNORECASE,
        )
        self.re_under_load = re.compile(
            r"\b(under(neath)?\s+(the\s+)?(suspended\s+)?load|drop\s+zone|line\s+of\s+fire|beneath\s+(the\s+)?load|in\s+path\s+of)\b",
            re.IGNORECASE,
        )

        # Working at Height
        self.re_height = re.compile(
            r"\b(working\s+at\s+height|scaffold|derrick|mast|monkey\s+board|ladder|elevated\s+platform)\b",
            re.IGNORECASE,
        )
        self.re_no_harness = re.compile(
            r"\b((no|without)\s+(safety\s+)?harness|unhooked|unclipped|(no|without)\s+fall\s+arrest|(no|without)\s+(100%\s+)?tie-?off|harness\s+not\s+(anchored|connected)|without\s+safety\s+harness\s+lanyard)\b",
            re.IGNORECASE,
        )

        # Hot Work
        self.re_hot_work = re.compile(
            r"\b(welding|cutting|grinding|torch|hot\s+work)\b",
            re.IGNORECASE,
        )
        self.re_flammable_env = re.compile(
            r"\b(zone\s+[01]|hazardous\s+area|gas\s+present|near\s+separator|hydrocarbon\s+vapor)\b",
            re.IGNORECASE,
        )
        self.re_no_fire_watch = re.compile(
            r"\b(no\s+fire\s+watch|fire\s+extinguisher\s+missing|gas\s+check\s+omitted|without\s+continuous\s+(lel\s+)?gas\s+test)\b",
            re.IGNORECASE,
        )

        # Bypassing controls
        self.re_bypassing = re.compile(
            r"\b(bypass(ed)?|override|interlock\s+defeated|safety\s+valve\s+gagged|jumper\s+installed|bypass\s+the\s+emergency)\b",
            re.IGNORECASE,
        )

        # Driving / Road Transport
        self.re_driving = re.compile(
            r"\b(driving|driven|truck|tanker|vehicle|carrier|transporter)\b",
            re.IGNORECASE,
        )
        self.re_driving_risk = re.compile(
            r"\b(speeding|not\s+wearing\s+seatbelts?|without\s+seatbelts?|unbelted|rollover|reckless)\b",
            re.IGNORECASE,
        )

        # Toxic / H2S Gas Release
        self.re_toxic_release = re.compile(
            r"\b(h2s|sour\s+gas|toxic\s+gas|gas\s+leak|pinhole\s+leak)\b",
            re.IGNORECASE,
        )

    def evaluate(self, text: str) -> Dict[str, Any]:
        """
        Evaluate a narrative against safety rules and return triggered signals.
        """
        triggered_rules: List[str] = []
        rule_reasons: List[str] = []
        mandatory_high_psif = False
        suggested_rules: List[str] = []

        # Rule 1: Confined Space Critical Breach
        has_confined = bool(self.re_confined.search(text))
        has_entry = bool(self.re_entry.search(text))
        has_no_gas = bool(self.re_no_gas_test.search(text))
        has_no_attendant = bool(self.re_no_attendant.search(text))
        has_expired_permit = bool(self.re_permit_expired.search(text))

        if (has_confined or has_entry) and (has_no_gas or has_no_attendant):
            triggered_rules.append("RULE-CS-001: Confined Space Entry with Critical Control Compromise")
            rule_reasons.append("Worker entered a confined space without recorded atmospheric gas testing or standby attendant.")
            mandatory_high_psif = True
            suggested_rules.append("Confined Space")

        if has_expired_permit:
            triggered_rules.append("RULE-WA-001: Work Performed Without Valid Work Authorization")
            rule_reasons.append("High hazard task commenced or continued under an expired or missing Permit to Work (PTW).")
            suggested_rules.append("Work Authorization")

        # Rule 2: Energy Isolation Failure
        has_pressurized = bool(self.re_pressurized.search(text))
        has_loto_fail = bool(self.re_loto_fail.search(text))
        if has_pressurized and has_loto_fail:
            triggered_rules.append("RULE-EI-001: Live Energy Source Intervention Without Verified Isolation")
            rule_reasons.append("Work performed on pressurized/energized equipment without verified Lockout/Tagout (LOTO) or bleed-off.")
            mandatory_high_psif = True
            suggested_rules.append("Energy Isolation")

        # Rule 3: Line of Fire / Lifting
        has_lifting = bool(self.re_lifting.search(text))
        has_under_load = bool(self.re_under_load.search(text))
        if has_lifting and has_under_load:
            triggered_rules.append("RULE-LIFT-001: Personnel Positioned Directly Under Suspended Load")
            rule_reasons.append("Personnel entered active drop zone or stood beneath suspended load without exclusion barriers.")
            mandatory_high_psif = True
            suggested_rules.extend(["Safe Mechanical Lifting", "Line of Fire"])

        # Rule 4: Working at Height
        has_height = bool(self.re_height.search(text))
        has_no_harness = bool(self.re_no_harness.search(text))
        if has_height and has_no_harness:
            triggered_rules.append("RULE-WAH-001: Elevated Work Without Fall Arrest Protection")
            rule_reasons.append("Worker at elevated position without certified full-body harness or 100% tie-off.")
            mandatory_high_psif = True
            suggested_rules.append("Working at Height")

        # Rule 5: Hot Work in Flammable Zone
        has_hot_work = bool(self.re_hot_work.search(text))
        has_flammable = bool(self.re_flammable_env.search(text))
        has_no_fire_watch = bool(self.re_no_fire_watch.search(text))
        if has_hot_work and (has_flammable or has_no_fire_watch):
            triggered_rules.append("RULE-HW-001: Hot Work in Hazardous Environment Without Fire Safeguards")
            rule_reasons.append("Open spark or thermal cutting performed in hydrocarbon area without verified continuous gas testing or fire watch.")
            mandatory_high_psif = True
            suggested_rules.append("Hot Work")

        # Rule 6: Bypassing Safety Controls
        if self.re_bypassing.search(text):
            triggered_rules.append("RULE-BSC-001: Unauthorized Safety Control Defeat")
            rule_reasons.append("Safety-critical instrument, relief device, or interlock was intentionally defeated or bypassed.")
            mandatory_high_psif = True
            suggested_rules.append("Bypassing Safety Controls")

        # Rule 7: Driving / Passenger Safety
        has_driving = bool(self.re_driving.search(text))
        has_driving_risk = bool(self.re_driving_risk.search(text))
        if has_driving and has_driving_risk:
            triggered_rules.append("RULE-DRIVE-001: Reckless Transport / Seatbelt Non-Compliance")
            rule_reasons.append("Vehicle operated at dangerous speed or occupants unbelted on hazardous operational lease road.")
            mandatory_high_psif = True
            suggested_rules.append("Driving")

        # Rule 8: Toxic H2S / Sour Gas Release
        if self.re_toxic_release.search(text):
            triggered_rules.append("RULE-TOXIC-001: Toxic Atmosphere / Sour Gas Release")
            rule_reasons.append("Hydrogen Sulfide (H2S) or toxic gas escape detected, posing credible acute poisoning or fatality threat.")
            mandatory_high_psif = True

        return {
            "mandatory_high_psif": mandatory_high_psif,
            "triggered_rules": triggered_rules,
            "rule_reasons": rule_reasons,
            "suggested_rules": list(dict.fromkeys(suggested_rules)),
        }
