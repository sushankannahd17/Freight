"""
Charter optimization engine.

Optimizes vessel selection and charter timing for minimum cost.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.vessels import Vessel
from app.schemas.voyage import VoyageCalculationRequest
from app.services.vessel_compatibility import VesselCompatibilityService
from app.services.voyage_service import VoyageCalculationService

logger = get_logger(__name__)


@dataclass
class VesselOption:
    """Vessel charter option."""

    vessel_imo: int
    vessel_name: str
    vessel_class: str
    dwt: int
    vessels_needed: int
    cost_per_mt: float
    total_cost: float
    duration_days: float
    compatible: bool
    reasons: list[str]


@dataclass
class CharterScenario:
    """Charter timing scenario."""

    timing: str  # NOW, 7D, 14D, 30D
    days_delay: int
    expected_rate: float
    forecast_lower: float
    forecast_upper: float
    cost_per_mt: float
    total_cost: float
    risk_level: str  # LOW, MEDIUM, HIGH


@dataclass
class CharterRecommendation:
    """Charter recommendation with reasoning."""

    action: str  # CHARTER, WAIT
    best_option: VesselOption | None
    best_timing: CharterScenario
    alternative_options: list[VesselOption]
    timing_scenarios: list[CharterScenario]
    reasoning: list[str]
    confidence: float
    generated_at: datetime


class CharterOptimizer:
    """Charter optimization engine."""

    VESSEL_CLASSES = ["Handysize", "Supramax", "Panamax", "Capesize"]

    def __init__(self, session: AsyncSession):
        """
        Initialize optimizer.

        Args:
            session: Database session
        """
        self.session = session
        self.compatibility_service = VesselCompatibilityService(session)
        self.voyage_service = VoyageCalculationService(session)

    async def optimize_charter(
        self,
        route_id: str,
        cargo_mt: float,
        origin_port: str,
        destination_port: str,
        max_vessels: int = 3,
    ) -> CharterRecommendation:
        """
        Optimize vessel charter selection.

        Args:
            route_id: Route identifier
            cargo_mt: Cargo quantity in MT
            origin_port: Origin port code
            destination_port: Destination port code
            max_vessels: Maximum vessel options to evaluate

        Returns:
            Charter recommendation
        """
        logger.info(
            f"Optimizing charter for {cargo_mt}MT on route {route_id}"
        )

        # Evaluate vessel options
        vessel_options = await self._evaluate_vessel_options(
            route_id=route_id,
            cargo_mt=cargo_mt,
            origin_port=origin_port,
            destination_port=destination_port,
            max_vessels=max_vessels,
        )

        # Find best option
        compatible_options = [v for v in vessel_options if v.compatible]

        if not compatible_options:
            logger.warning("No compatible vessels found")
            return self._create_no_vessels_recommendation(vessel_options)

        # Sort by cost per MT
        best_option = min(compatible_options, key=lambda v: v.cost_per_mt)

        # Generate timing scenarios
        timing_scenarios = await self._generate_timing_scenarios(
            best_option=best_option,
            route_id=route_id,
        )

        # Find best timing
        best_timing = min(timing_scenarios, key=lambda s: s.cost_per_mt)

        # Generate reasoning
        reasoning = self._generate_reasoning(
            best_option=best_option,
            best_timing=best_timing,
            all_options=vessel_options,
        )

        # Calculate confidence
        confidence = self._calculate_confidence(
            best_option=best_option,
            alternatives=compatible_options,
        )

        return CharterRecommendation(
            action="CHARTER" if confidence > 0.7 else "WAIT",
            best_option=best_option,
            best_timing=best_timing,
            alternative_options=compatible_options[:3],
            timing_scenarios=timing_scenarios,
            reasoning=reasoning,
            confidence=confidence,
            generated_at=datetime.utcnow(),
        )

    async def _evaluate_vessel_options(
        self,
        route_id: str,
        cargo_mt: float,
        origin_port: str,
        destination_port: str,
        max_vessels: int = 3,
    ) -> list[VesselOption]:
        """Evaluate different vessel class options."""
        options = []

        for vessel_class in self.VESSEL_CLASSES:
            try:
                # Get representative vessel for class
                result = await self.session.execute(
                    select(Vessel)
                    .where(Vessel.vessel_class == vessel_class)
                    .limit(1)
                )
                vessel = result.scalar_one_or_none()

                if not vessel:
                    continue

                # Check compatibility with destination port
                compat_result = await self.compatibility_service.check_compatibility(
                    VesselCompatibilityRequest(
                        vessel_imo=vessel.imo,
                        port_code=destination_port,
                    )
                )

                # Calculate how many vessels needed
                vessels_needed = max(1, int(cargo_mt / vessel.dwt) + 1)

                # Calculate voyage cost
                voyage_result = await self.voyage_service.calculate_voyage(
                    VoyageCalculationRequest(
                        route_id=route_id,
                        vessel_imo=vessel.imo,
                        cargo_mt=min(cargo_mt, vessel.dwt),
                        origin_port=origin_port,
                        destination_port=destination_port,
                    )
                )

                # Total cost for multiple vessels if needed
                total_cost = voyage_result.total_cost_usd * vessels_needed
                cost_per_mt = total_cost / cargo_mt

                option = VesselOption(
                    vessel_imo=vessel.imo,
                    vessel_name=vessel.vessel_name,
                    vessel_class=vessel.vessel_class,
                    dwt=vessel.dwt,
                    vessels_needed=vessels_needed,
                    cost_per_mt=cost_per_mt,
                    total_cost=total_cost,
                    duration_days=voyage_result.total_duration_hours / 24,
                    compatible=compat_result.compatible,
                    reasons=compat_result.reasons,
                )

                options.append(option)

                logger.info(
                    f"Evaluated {vessel_class}: ${cost_per_mt:.2f}/MT, "
                    f"{vessels_needed} vessels needed"
                )

            except Exception as e:
                logger.error(f"Failed to evaluate {vessel_class}: {e}")
                continue

        return options

    async def _generate_timing_scenarios(
        self,
        best_option: VesselOption,
        route_id: str,
    ) -> list[CharterScenario]:
        """Generate charter timing scenarios."""
        scenarios = []

        timings = [
            ("NOW", 0),
            ("7D", 7),
            ("14D", 14),
            ("30D", 30),
        ]

        for timing_name, days_delay in timings:
            # TODO: Get actual forecast rates
            # For now use simple simulation
            base_rate = best_option.cost_per_mt

            if timing_name == "NOW":
                expected_rate = base_rate
                forecast_lower = base_rate * 0.95
                forecast_upper = base_rate * 1.05
                risk_level = "MEDIUM"
            else:
                # Simulate rate volatility
                volatility = 0.02 * days_delay  # 2% per week
                expected_rate = base_rate * (1 + volatility)
                forecast_lower = expected_rate * 0.9
                forecast_upper = expected_rate * 1.15
                risk_level = "HIGH" if days_delay > 14 else "MEDIUM"

            scenario = CharterScenario(
                timing=timing_name,
                days_delay=days_delay,
                expected_rate=expected_rate,
                forecast_lower=forecast_lower,
                forecast_upper=forecast_upper,
                cost_per_mt=expected_rate,
                total_cost=expected_rate * best_option.dwt * best_option.vessels_needed,
                risk_level=risk_level,
            )

            scenarios.append(scenario)

        return scenarios

    def _generate_reasoning(
        self,
        best_option: VesselOption,
        best_timing: CharterScenario,
        all_options: list[VesselOption],
    ) -> list[str]:
        """Generate human-readable reasoning."""
        reasoning = []

        # Vessel selection reasoning
        if best_option.compatible:
            reasoning.append(
                f"{best_option.vessel_class} vessels are compatible with port constraints"
            )

        if best_option.vessels_needed == 1:
            reasoning.append(
                f"Single vessel sufficient for cargo capacity ({best_option.dwt}MT DWT)"
            )
        else:
            reasoning.append(
                f"{best_option.vessels_needed} vessels required for cargo volume"
            )

        # Cost competitiveness
        compatible_options = [v for v in all_options if v.compatible]
        if len(compatible_options) > 1:
            cost_savings_pct = (
                (max(v.cost_per_mt for v in compatible_options) - best_option.cost_per_mt)
                / best_option.cost_per_mt
                * 100
            )
            if cost_savings_pct > 5:
                reasoning.append(
                    f"Offers {cost_savings_pct:.1f}% cost advantage over alternatives"
                )

        # Timing reasoning
        if best_timing.timing == "NOW":
            reasoning.append("Current market conditions favorable for immediate charter")
        else:
            reasoning.append(
                f"Consider delaying {best_timing.days_delay} days "
                f"(forecast uncertainty: ±{abs(best_timing.forecast_upper - best_timing.forecast_lower):.1f})"
            )

        return reasoning

    def _calculate_confidence(
        self,
        best_option: VesselOption,
        alternatives: list[VesselOption],
    ) -> float:
        """Calculate recommendation confidence (0-1)."""
        confidence = 0.5  # Base confidence

        # High compatibility increases confidence
        if best_option.compatible and not best_option.reasons:
            confidence += 0.2

        # Cost advantage increases confidence
        if len(alternatives) > 1:
            cost_spread = max(v.cost_per_mt for v in alternatives) - best_option.cost_per_mt
            if cost_spread > best_option.cost_per_mt * 0.1:  # 10% advantage
                confidence += 0.2

        # Single vessel preferred over multiple
        if best_option.vessels_needed == 1:
            confidence += 0.1

        return min(1.0, confidence)

    def _create_no_vessels_recommendation(
        self,
        evaluated_options: list[VesselOption],
    ) -> CharterRecommendation:
        """Create recommendation when no compatible vessels found."""
        return CharterRecommendation(
            action="WAIT",
            best_option=None,
            best_timing=CharterScenario(
                timing="WAIT",
                days_delay=0,
                expected_rate=0,
                forecast_lower=0,
                forecast_upper=0,
                cost_per_mt=0,
                total_cost=0,
                risk_level="HIGH",
            ),
            alternative_options=[],
            timing_scenarios=[],
            reasoning=[
                "No compatible vessels found for current port constraints",
                "Review port/berth selection or consider smaller cargo volumes",
            ],
            confidence=0.0,
            generated_at=datetime.utcnow(),
        )
