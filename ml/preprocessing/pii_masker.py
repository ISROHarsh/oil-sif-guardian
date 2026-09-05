"""
OIL-SIF Guardian — PII Detection & Redaction Engine.
Sanitizes personal worker names, mobile numbers, email addresses,
and employee badge numbers to protect worker privacy.
"""

import re
from typing import Tuple, List, Dict, Any


class PIIMasker:
    def __init__(self):
        self._compile_regexes()

    def _compile_regexes(self):
        # Indian Mobile & International Phone numbers
        # Matches: +91 9876543210, 98765-43210, 09876543210, (123) 456-7890
        self.re_phone = re.compile(
            r"(?:(?:\+?91[\s-]?)?(?:0)?[6789]\d{9})|(?:\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b)",
            re.IGNORECASE
        )

        # Email addresses
        self.re_email = re.compile(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"
        )

        # Employee & Contractor Badge IDs
        # Matches: EMP-12345, Badge #9081, ID: 44219, Contractor ID-881
        # Employee & Contractor Badge IDs (requires at least one digit in identifier)
        # Matches: EMP-12345, Badge #9081, ID: 44219, Contractor ID-881, EMP-9081, ID-4421
        self.re_badge = re.compile(
            r"\b(?:(?:emp(?:loyee)?|badge|worker|contractor)[\s\-:]*#?\s*(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{3,10})|(?:\b(?:id|badge|#)\s*[:\-]?\s*(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{3,10}\b)",
            re.IGNORECASE
        )

        # Common Person Name patterns preceded by titles or role prefixes
        # Matches: Mr. Sharma, Ms. Baruah, Contractor Rajesh, Technician John Doe
        self.re_named_person = re.compile(
            r"\b(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Er\.?|Engineer|Officer|Technician|Operator|Contractor|Fitter|Roustabout|Driller|Helper)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b"
        )

    def mask(self, text: str) -> Tuple[str, bool, List[Dict[str, Any]]]:
        """
        Scans text for PII entities, substitutes them with standardized tokens,
        and returns: (masked_text, pii_detected_bool, audit_log_of_redactions).
        """
        if not text:
            return "", False, []

        masked = text
        redactions = []

        # 1. Mask Email Addresses
        for match in self.re_email.finditer(masked):
            redactions.append({"category": "EMAIL", "original": match.group(0)})
        masked = self.re_email.sub("[EMAIL_REDACTED]", masked)

        # 2. Mask Phone Numbers
        for match in self.re_phone.finditer(masked):
            redactions.append({"category": "PHONE", "original": match.group(0)})
        masked = self.re_phone.sub("[PHONE_REDACTED]", masked)

        # 3. Mask Employee / Badge IDs
        for match in self.re_badge.finditer(masked):
            matched_text = match.group(0)
            if not matched_text.startswith("["):
                redactions.append({"category": "EMPLOYEE_ID", "original": matched_text})
        masked = self.re_badge.sub("[ID_REDACTED]", masked)

        # 4. Mask Titled Person Names (preserve the role title, mask the name)
        def replace_name(match):
            full_match = match.group(0)
            name_part = match.group(1)
            # Avoid masking if name_part is already a token or oil term
            if name_part.upper() in ["OIL", "PTW", "LOTO", "BOP", "H2S"]:
                return full_match
            role = full_match[:full_match.rfind(name_part)].strip()
            redactions.append({"category": "PERSON_NAME", "original": name_part})
            return f"{role} [WORKER_NAME]"

        masked = self.re_named_person.sub(replace_name, masked)

        has_pii = len(redactions) > 0
        return masked, has_pii, redactions

    def mask_pii(self, text: str) -> Tuple[str, List[Dict[str, Any]]]:
        masked, _, redactions = self.mask(text)
        return masked, redactions

