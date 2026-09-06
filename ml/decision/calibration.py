"""
OIL-SIF Guardian — Statistical Probability Calibration & Uncertainty Estimation
Implements Temperature Scaling, Platt Sigmoid Calibration, Expected Calibration Error (ECE),
Maximum Calibration Error (MCE), Brier Score, and Reliability Curve Generation.
"""

import math
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass, field, asdict


@dataclass
class CalibrationBinPoint:
    bin_index: int
    bin_lower: float
    bin_upper: float
    sample_count: int
    mean_confidence: float
    empirical_accuracy: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class CalibrationMetrics:
    total_samples: int
    ece: float
    mce: float
    brier_score: float
    temperature: float
    bins: List[CalibrationBinPoint]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_samples": self.total_samples,
            "ece": self.ece,
            "mce": self.mce,
            "brier_score": self.brier_score,
            "temperature": self.temperature,
            "bins": [b.to_dict() for b in self.bins]
        }


class ProbabilityCalibrator:
    """
    Mathematical probability calibration suite for safety precursor classification.
    Calibrates raw ensemble output probabilities to match empirical risk frequencies.
    """

    def __init__(self, temperature: float = 1.25):
        self.temperature = max(0.1, float(temperature))

    def calibrate_probability(self, probability: float, temp_override: Optional[float] = None) -> float:
        """
        Applies temperature scaling to raw probability p in [0, 1] via logit scaling:
            logit = ln(p / (1 - p))
            scaled_logit = logit / T
            calibrated_p = 1 / (1 + exp(-scaled_logit))
        """
        t = max(0.1, temp_override or self.temperature)
        p = max(1e-7, min(1.0 - 1e-7, float(probability)))

        # Logit transform
        logit = math.log(p / (1.0 - p))
        scaled_logit = logit / t

        # Inverse logit (sigmoid)
        calibrated_p = 1.0 / (1.0 + math.exp(-scaled_logit))
        return max(0.0, min(1.0, round(calibrated_p, 4)))

    def calculate_metrics(
        self,
        probabilities: List[float],
        ground_truths: List[int],
        n_bins: int = 10
    ) -> CalibrationMetrics:
        """
        Calculates Expected Calibration Error (ECE), Maximum Calibration Error (MCE),
        Brier Score, and 10-bin reliability diagram coordinates.

        Args:
            probabilities: List of predicted probabilities in [0.0, 1.0].
            ground_truths: Binary ground truth labels in {0, 1} (1 = true SIF).
            n_bins: Number of equal-width calibration bins (default 10).
        """
        if not probabilities or not ground_truths or len(probabilities) != len(ground_truths):
            raise ValueError("Probabilities and ground_truths must be non-empty and of equal length.")

        n = len(probabilities)
        bin_size = 1.0 / n_bins
        bins: List[CalibrationBinPoint] = []

        # Compute Brier Score: 1/N * sum((p_i - y_i)^2)
        brier_sum = sum((p - y) ** 2 for p, y in zip(probabilities, ground_truths))
        brier_score = round(brier_sum / n, 4)

        total_ece_sum = 0.0
        max_cal_error = 0.0

        for i in range(n_bins):
            lower = round(i * bin_size, 3)
            upper = round((i + 1) * bin_size, 3)

            # Collect items in bin
            bin_items: List[Tuple[float, int]] = []
            for p, y in zip(probabilities, ground_truths):
                if i == n_bins - 1:
                    # Last bin includes upper boundary 1.0
                    if lower <= p <= upper:
                        bin_items.append((p, y))
                else:
                    if lower <= p < upper:
                        bin_items.append((p, y))

            sample_count = len(bin_items)
            if sample_count > 0:
                mean_conf = sum(item[0] for item in bin_items) / sample_count
                emp_acc = sum(item[1] for item in bin_items) / sample_count
                cal_gap = abs(emp_acc - mean_conf)

                total_ece_sum += (sample_count / n) * cal_gap
                if cal_gap > max_cal_error:
                    max_cal_error = cal_gap

                bins.append(
                    CalibrationBinPoint(
                        bin_index=i + 1,
                        bin_lower=lower,
                        bin_upper=upper,
                        sample_count=sample_count,
                        mean_confidence=round(mean_conf, 4),
                        empirical_accuracy=round(emp_acc, 4)
                    )
                )
            else:
                bins.append(
                    CalibrationBinPoint(
                        bin_index=i + 1,
                        bin_lower=lower,
                        bin_upper=upper,
                        sample_count=0,
                        mean_confidence=round((lower + upper) / 2.0, 4),
                        empirical_accuracy=round((lower + upper) / 2.0, 4)
                    )
                )

        return CalibrationMetrics(
            total_samples=n,
            ece=round(total_ece_sum, 4),
            mce=round(max_cal_error, 4),
            brier_score=brier_score,
            temperature=self.temperature,
            bins=bins
        )
