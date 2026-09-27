"""
Vessel-port compatibility checking service.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.ports import Port, PortBerth
from app.models.vessels import Vessel
from app.schemas.voyage import VesselCompatibilityRequest, VesselCompatibilityResponse

logger = get_logger(__name__)


class VesselCompatibilityService:
    """Service for checking vessel-port compatibility."""

    def __init__(self, session: AsyncSession):
        """
        Initialize service.

        Args:
            session: Database session
        """
        self.session = session

    async def check_compatibility(
        self,
        request: VesselCompatibilityRequest,
    ) -> VesselCompatibilityResponse:
        """
        Check if vessel is compatible with port/berth.

        Args:
            request: Compatibility check request

        Returns:
            Compatibility response with detailed reasons
        """
        # Get vessel
        result = await self.session.execute(
            select(Vessel).where(Vessel.imo == request.vessel_imo)
        )
        vessel = result.scalar_one_or_none()

        if not vessel:
            return VesselCompatibilityResponse(
                compatible=False,
                vessel_imo=request.vessel_imo,
                port_code=request.port_code,
                reasons=["Vessel not found in database"],
            )

        # Get port
        result = await self.session.execute(
            select(Port).where(Port.port_code == request.port_code)
        )
        port = result.scalar_one_or_none()

        if not port:
            return VesselCompatibilityResponse(
                compatible=False,
                vessel_imo=request.vessel_imo,
                port_code=request.port_code,
                reasons=["Port not found in database"],
            )

        # Get berths
        if request.berth_name:
            result = await self.session.execute(
                select(PortBerth)
                .where(PortBerth.port_id == port.id)
                .where(PortBerth.berth_name == request.berth_name)
            )
            berths = [result.scalar_one_or_none()]
            if not berths[0]:
                return VesselCompatibilityResponse(
                    compatible=False,
                    vessel_imo=request.vessel_imo,
                    port_code=request.port_code,
                    berth_name=request.berth_name,
                    reasons=["Berth not found"],
                )
        else:
            result = await self.session.execute(
                select(PortBerth).where(PortBerth.port_id == port.id)
            )
            berths = list(result.scalars().all())

        if not berths:
            return VesselCompatibilityResponse(
                compatible=False,
                vessel_imo=request.vessel_imo,
                port_code=request.port_code,
                reasons=["No berth data available for port"],
            )

        # Check compatibility against each berth
        compatible_berths = []
        all_reasons = []

        for berth in berths:
            reasons = []

            # Check LOA
            if vessel.loa_m > berth.max_loa_m:
                reasons.append(
                    f"LOA exceeds berth limit: {vessel.loa_m:.1f}m > {berth.max_loa_m:.1f}m "
                    f"(excess: {vessel.loa_m - berth.max_loa_m:.1f}m)"
                )

            # Check beam
            if vessel.beam_m > berth.max_beam_m:
                reasons.append(
                    f"Beam exceeds berth limit: {vessel.beam_m:.1f}m > {berth.max_beam_m:.1f}m "
                    f"(excess: {vessel.beam_m - berth.max_beam_m:.1f}m)"
                )

            # Check draft
            if vessel.draft_m > berth.max_draft_m:
                reasons.append(
                    f"Draft exceeds berth limit: {vessel.draft_m:.1f}m > {berth.max_draft_m:.1f}m "
                    f"(excess: {vessel.draft_m - berth.max_draft_m:.1f}m)"
                )

            # Check DWT if available
            if berth.max_dwt and vessel.dwt > berth.max_dwt:
                reasons.append(
                    f"DWT exceeds berth limit: {vessel.dwt:,}t > {berth.max_dwt:,}t "
                    f"(excess: {vessel.dwt - berth.max_dwt:,}t)"
                )

            if not reasons:
                compatible_berths.append(berth)
            else:
                all_reasons.extend([f"{berth.berth_name}: {r}" for r in reasons])

        # Vessel is compatible if at least one berth works
        compatible = len(compatible_berths) > 0

        # Build response
        vessel_dimensions = {
            "imo": vessel.imo,
            "name": vessel.vessel_name,
            "class": vessel.vessel_class,
            "loa_m": vessel.loa_m,
            "beam_m": vessel.beam_m,
            "draft_m": vessel.draft_m,
            "dwt": vessel.dwt,
        }

        berth_constraints = None
        if compatible_berths:
            # Return most suitable berth
            best_berth = compatible_berths[0]
            berth_constraints = {
                "berth_name": best_berth.berth_name,
                "max_loa_m": best_berth.max_loa_m,
                "max_beam_m": best_berth.max_beam_m,
                "max_draft_m": best_berth.max_draft_m,
                "max_dwt": best_berth.max_dwt,
                "loading_rate_tph": best_berth.loading_rate_tph,
                "discharge_rate_tph": best_berth.discharge_rate_tph,
            }
        elif berths:
            # Return constraints of first berth for reference
            berth_constraints = {
                "berth_name": berths[0].berth_name,
                "max_loa_m": berths[0].max_loa_m,
                "max_beam_m": berths[0].max_beam_m,
                "max_draft_m": berths[0].max_draft_m,
                "max_dwt": berths[0].max_dwt,
            }

        response = VesselCompatibilityResponse(
            compatible=compatible,
            vessel_imo=request.vessel_imo,
            port_code=request.port_code,
            berth_name=compatible_berths[0].berth_name if compatible_berths else None,
            reasons=all_reasons if not compatible else [],
            vessel_dimensions=vessel_dimensions,
            berth_constraints=berth_constraints,
        )

        logger.info(
            f"Compatibility check: vessel {vessel.imo} -> port {port.port_code}: "
            f"{'COMPATIBLE' if compatible else 'INCOMPATIBLE'}"
        )

        return response

    async def get_compatible_vessels(
        self,
        port_code: str,
        berth_name: str | None = None,
    ) -> list[Vessel]:
        """
        Get all vessels compatible with a port/berth.

        Args:
            port_code: Port code
            berth_name: Optional berth name

        Returns:
            List of compatible vessels
        """
        # Get port and berth
        result = await self.session.execute(
            select(Port).where(Port.port_code == port_code)
        )
        port = result.scalar_one_or_none()

        if not port:
            return []

        # Get berth constraints
        if berth_name:
            result = await self.session.execute(
                select(PortBerth)
                .where(PortBerth.port_id == port.id)
                .where(PortBerth.berth_name == berth_name)
            )
            berth = result.scalar_one_or_none()
            if not berth:
                return []
        else:
            result = await self.session.execute(
                select(PortBerth).where(PortBerth.port_id == port.id)
            )
            berths = list(result.scalars().all())
            if not berths:
                return []
            # Use most restrictive constraints
            berth = min(
                berths,
                key=lambda b: (b.max_loa_m, b.max_beam_m, b.max_draft_m),
            )

        # Query vessels that meet constraints
        result = await self.session.execute(
            select(Vessel)
            .where(Vessel.loa_m <= berth.max_loa_m)
            .where(Vessel.beam_m <= berth.max_beam_m)
            .where(Vessel.draft_m <= berth.max_draft_m)
        )

        compatible_vessels = list(result.scalars().all())

        logger.info(
            f"Found {len(compatible_vessels)} compatible vessels for port {port_code}"
        )

        return compatible_vessels
