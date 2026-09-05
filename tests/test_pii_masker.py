"""
Unit Tests for PIIMasker (Mobile, Email, Employee Badge, Worker Names).
"""

import pytest
from ml.preprocessing.pii_masker import PIIMasker


@pytest.fixture
def masker():
    return PIIMasker()


def test_masks_phone_numbers(masker):
    text1 = "Contact field supervisor at +91 9876543210 immediately."
    masked1, has_pii1, redactions1 = masker.mask(text1)
    assert "[PHONE_REDACTED]" in masked1
    assert "9876543210" not in masked1
    assert has_pii1 is True

    text2 = "Call emergency line 123-456-7890 if pressure increases."
    masked2, _, _ = masker.mask(text2)
    assert "[PHONE_REDACTED]" in masked2


def test_masks_email_addresses(masker):
    text = "Report forwarded to safety.officer@oilindia.in and lead.engineer@gmail.com for review."
    masked, has_pii, redactions = masker.mask(text)
    assert "[EMAIL_REDACTED]" in masked
    assert "safety.officer@oilindia.in" not in masked
    assert "lead.engineer@gmail.com" not in masked
    assert len(redactions) == 2


def test_masks_employee_badge_numbers(masker):
    text = "Permit issued to EMP-9081 and Contractor ID-4421."
    masked, has_pii, redactions = masker.mask(text)
    assert "[ID_REDACTED]" in masked
    assert "EMP-9081" not in masked
    assert has_pii is True


def test_masks_worker_names_with_titles(masker):
    text = "Mr. Sharma instructed Technician Ramesh to bypass the safety interlock."
    masked, has_pii, redactions = masker.mask(text)
    assert "[WORKER_NAME]" in masked
    assert "Mr. [WORKER_NAME]" in masked
    assert "Technician [WORKER_NAME]" in masked
    assert "Sharma" not in masked
    assert "Ramesh" not in masked


def test_does_not_mask_technical_acronyms(masker):
    text = "OIL management audited the BOP and verified PTW on the rig."
    masked, _, redactions = masker.mask(text)
    assert "OIL" in masked
    assert "BOP" in masked
    assert "PTW" in masked
