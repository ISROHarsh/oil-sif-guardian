"""
OIL-SIF Guardian — Unit Tests for Probability Calibration & Uncertainty Estimation
Tests Temperature Scaling, Platt Sigmoid Calibration, Expected Calibration Error (ECE),
Maximum Calibration Error (MCE), and Brier Score.
"""

import pytest
from ml.decision.calibration import ProbabilityCalibrator, CalibrationBinPoint, CalibrationMetrics


def test_temperature_scaling():
    calibrator = ProbabilityCalibrator(temperature=1.5)

    # Scaling with T > 1 softens extreme probabilities towards 0.5
    p_high = 0.90
    p_cal_high = calibrator.calibrate_probability(p_high)
    assert p_cal_high < p_high  # Softened down towards 0.5
    assert p_cal_high > 0.50

    p_low = 0.10
    p_cal_low = calibrator.calibrate_probability(p_low)
    assert p_cal_low > p_low  # Softened up towards 0.5
    assert p_cal_low < 0.50

    # Probability 0.5 stays exactly 0.5 under temperature scaling
    p_mid = 0.50
    p_cal_mid = calibrator.calibrate_probability(p_mid)
    assert abs(p_cal_mid - 0.50) < 1e-4

    # Monotonicity preserved
    assert calibrator.calibrate_probability(0.2) < calibrator.calibrate_probability(0.8)


def test_ece_and_brier_perfect_calibration():
    calibrator = ProbabilityCalibrator(temperature=1.0)
    # Perfectly calibrated synthetic batch: 10 samples at 0.8 with 8 positives, 10 samples at 0.2 with 2 positives
    probs = [0.8] * 10 + [0.2] * 10
    truths = [1] * 8 + [0] * 2 + [1] * 2 + [0] * 8

    metrics = calibrator.calculate_metrics(probabilities=probs, ground_truths=truths, n_bins=10)

    assert metrics.total_samples == 20
    assert metrics.ece < 0.05  # Near zero calibration error
    assert metrics.brier_score < 0.20
    assert len(metrics.bins) == 10


def test_ece_and_brier_overconfident_model():
    calibrator = ProbabilityCalibrator(temperature=1.0)
    # Severe overconfidence: predicts 0.95 probability but all samples are actually negative (0)
    probs = [0.95] * 20
    truths = [0] * 20

    metrics = calibrator.calculate_metrics(probabilities=probs, ground_truths=truths, n_bins=10)

    assert metrics.total_samples == 20
    # Expected Calibration Error should reflect the ~0.95 gap
    assert metrics.ece > 0.90
    assert metrics.mce > 0.90
    assert metrics.brier_score > 0.80


def test_binning_boundaries_and_empty_bins():
    calibrator = ProbabilityCalibrator(temperature=1.2)
    probs = [0.05, 0.15, 0.85, 0.95]
    truths = [0, 0, 1, 1]

    metrics = calibrator.calculate_metrics(probabilities=probs, ground_truths=truths, n_bins=10)

    assert len(metrics.bins) == 10
    total_binned = sum(b.sample_count for b in metrics.bins)
    assert total_binned == 4

    # Empty bins should be gracefully represented with sample_count == 0
    empty_bins = [b for b in metrics.bins if b.sample_count == 0]
    assert len(empty_bins) > 0
