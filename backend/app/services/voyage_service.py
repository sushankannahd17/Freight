"""
Voyage calculation service.

Calculates voyage costs including:
- Sailing time
- Fuel consumption
- Port costs
- Demurrage
- Total voyage economics
"""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.economics import FuelPrice
from app.models.ports import Port, PortBerth, PortCongestion
from app.models.routes import SeaRoute
from app.models.vessels import Vessel
from app.schemas.voyage import VoyageCalculationRequest, VoyageCalculationResponse

logger = get_logger(__name__)


class VoyageCalculationService:
    """Service for voyage cost calculations."""

    # Default values (can be overridden)
    DEFAULT_SERVICE_SPEED_KNOTS = 14.0
    DEFAULT_LADEN_FUEL_RATE_MT_PER_DAY = 30.0
    DEFAULT_BALLAST_FUEL_RATE_MT_PER_DAY = 25.0
    DEFAULT_PORT_COST_USD = 50000.0
    DEFAULT_FUEL_PRICE_USD_PER_MT = 650.0
    DEFAULT_LOADING_RATE_TPH = 5000.0
    DEFAULT_DISCHARGE_RATE_TPH = 3000.0
    DEMURRAGE_RATE_USD_PER_DAY = 15000.0

    def __init__(self, session: AsyncSession):
        """
        Initialize service.

        Args:
            session: Database session
        """
        self.session = session

    async def calculate_voyage(
        self,
        request: VoyageCalculationRequest,
    ) -> VoyageCalculationResponse:
        """
        Calculate comprehensive voyage costs.

        Args:
            request: Voyage calculation request

        Returns:
            Detailed voyage calculation
        """
        logger.info(
            f"Calculating voyage: {request.route_id}, vessel {request.vessel_imo}, "
            f"cargo {request.cargo_mt}MT"
        )

        # Get vessel
        vessel = await self._get_vessel(request.vessel_imo)
        if not vessel:
            raise ValueError(f"Vessel not found: {request.vessel_imo}")

        # Get route
        route = await self._get_route(request.route_id)
        distance_nm = route.distance_nm if route else 1000.0  # Default fallback

        # Get ports
        origin_port = await self._get_port(request.origin_port)
        dest_port = await self._get_port(request.destination_port)

        # Calculate time components
        sailing_time_hours = await self._calculate_sailing_time(
            distance_nm,
            vessel,
            include_weather=request.include_weather,
        )

        loading_time_hours = await self._calculate_loading_time(
            request.cargo_mt,
            origin_port,
        )

        discharge_time_hours = await self._calculate_discharge_time(
            request.cargo_mt,
            dest_port,
        )

        port_waiting_hours = 0.0
        if request.include_congestion:
            port_waiting_hours = await self._calculate_port_waiting(
                origin_port,
                dest_port,
            )

        weather_delay_hours = 0.0
        if request.include_weather:
            weather_delay_hours = sailing_time_hours * 0.05  # 5% weather buffer

        total_duration_hours = (
            sailing_time_hours
            + (loading_time_hours or 0)
            + (discharge_time_hours or 0)
            + port_waiting_hours
            + weather_delay_hours
        )

        # Calculate cost components
        freight_cost = await self._calculate_freight_cost(
            request.cargo_mt,
            request.freight_rate_usd_per_mt,
            request.route_id,
        )

        fuel_cost = await self._calculate_fuel_cost(
            sailing_time_hours,
            vessel,
        )

        port_cost = await self._calculate_port_costs(
            origin_port,
            dest_port,
        )

        canal_cost = 0.0  # TODO: Implement canal detection

        demurrage = await self._calculate_demurrage(
            port_waiting_hours,
        )

        total_cost = freight_cost + fuel_cost + (port_cost or 0) + canal_cost + (demurrage or 0)
        cost_per_mt = total_cost / request.cargo_mt if request.cargo_mt > 0 else 0

        # Build response
        response = VoyageCalculationResponse(
            route_id=request.route_id,
            vessel_imo=request.vessel_imo,
            cargo_mt=request.cargo_mt,
            sailing_time_hours=round(sailing_time_hours, 2),
            loading_time_hours=round(loading_time_hours, 2) if loading_time_hours else None,
            discharge_time_hours=(
                round(discharge_time_hours, 2) if discharge_time_hours else None
            ),
            port_waiting_hours=round(port_waiting_hours, 2) if port_waiting_hours > 0 else None,
            weather_delay_hours=(
                round(weather_delay_hours, 2) if weather_delay_hours > 0 else None
            ),
            total_duration_hours=round(total_duration_hours, 2),
            freight_cost_usd=round(freight_cost, 2),
            fuel_cost_usd=round(fuel_cost, 2),
            port_cost_usd=round(port_cost, 2) if port_cost else None,
            canal_cost_usd=round(canal_cost, 2) if canal_cost > 0 else None,
            demurrage_usd=round(demurrage, 2) if demurrage else None,
            total_cost_usd=round(total_cost, 2),
            cost_per_mt_usd=round(cost_per_mt, 2),
            distance_nm=distance_nm,
            effective_speed_knots=round(distance_nm / (sailing_time_hours / 24), 2),
            calculation_timestamp=datetime.utcnow().isoformat(),
            calculation_details={
                "vessel_name": vessel.vessel_name,
                "vessel_class": vessel.vessel_class,
                "origin": request.origin_port,
                "destination": request.destination_port,
                "duration_days": round(total_duration_hours / 24, 2),
            },
        )

        logger.info(
            f"Voyage calculated: total ${total_cost:,.0f}, "
            f"${cost_per_mt:.2f}/MT, {total_duration_hours:.1f} hours"
        )

        return response

    async def _get_vessel(self, imo: int) -> Vessel | None:
        """Get vessel by IMO."""
        result = await self.session.execute(select(Vessel).where(Vessel.imo == imo))
        return result.scalar_one_or_none()

    async def _get_route(self, route_id: str) -> SeaRoute | None:
        """Get route by ID."""
        result = await self.session.execute(
            select(SeaRoute).where(SeaRoute.route_id == route_id)
        )
        return result.scalar_one_or_none()

    async def _get_port(self, port_code: str) -> Port | None:
        """Get port by code."""
        result = await self.session.execute(select(Port).where(Port.port_code == port_code))
        return result.scalar_one_or_none()

    async def _calculate_sailing_time(
        self,
        distance_nm: float,
        vessel: Vessel,
        include_weather: bool = True,
    ) -> float:
        """
        Calculate sailing time in hours.

        Args:
            distance_nm: Distance in nautical miles
            vessel: Vessel object
            include_weather: Include weather buffer

        Returns:
            Sailing time in hours
        """
        # Use default service speed
        # TODO: Get vessel-specific speed from database
        speed_knots = self.DEFAULT_SERVICE_SPEED_KNOTS

        sailing_hours = distance_nm / speed_knots

        return sailing_hours

    async def _calculate_loading_time(
        self,
        cargo_mt: float,
        port: Port | None,
    ) -> float:
        """Calculate loading time in hours."""
        if not port:
            loading_rate = self.DEFAULT_LOADING_RATE_TPH
        else:
            # Get berth loading rate
            result = await self.session.execute(
                select(PortBerth).where(PortBerth.port_id == port.id).limit(1)
            )
            berth = result.scalar_one_or_none()
            loading_rate = (
                berth.loading_rate_tph if berth and berth.loading_rate_tph else self.DEFAULT_LOADING_RATE_TPH
            )

        loading_hours = cargo_mt / loading_rate
        return loading_hours

    async def _calculate_discharge_time(
        self,
        cargo_mt: float,
        port: Port | None,
    ) -> float:
        """Calculate discharge time in hours."""
        if not port:
            discharge_rate = self.DEFAULT_DISCHARGE_RATE_TPH
        else:
            # Get berth discharge rate
            result = await self.session.execute(
                select(PortBerth).where(PortBerth.port_id == port.id).limit(1)
            )
            berth = result.scalar_one_or_none()
            discharge_rate = (
                berth.discharge_rate_tph
                if berth and berth.discharge_rate_tph
                else self.DEFAULT_DISCHARGE_RATE_TPH
            )

        discharge_hours = cargo_mt / discharge_rate
        return discharge_hours

    async def _calculate_port_waiting(
        self,
        origin_port: Port | None,
        dest_port: Port | None,
    ) -> float:
        """Calculate total port waiting time from congestion data."""
        total_waiting = 0.0

        for port in [origin_port, dest_port]:
            if not port:
                continue

            # Get latest congestion data
            result = await self.session.execute(
                select(PortCongestion)
                .where(PortCongestion.port_id == port.id)
                .order_by(PortCongestion.date.desc())
                .limit(1)
            )
            congestion = result.scalar_one_or_none()

            if congestion and congestion.avg_waiting_hours:
                total_waiting += congestion.avg_waiting_hours

        return total_waiting

    async def _calculate_freight_cost(
        self,
        cargo_mt: float,
        freight_rate: float | None,
        route_id: str,
    ) -> float:
        """Calculate freight cost."""
        if freight_rate:
            return cargo_mt * freight_rate

        # TODO: Get current market rate from database
        # For now use a default
        default_rate = 30.0  # USD per MT
        return cargo_mt * default_rate

    async def _calculate_fuel_cost(
        self,
        sailing_hours: float,
        vessel: Vessel,
    ) -> float:
        """Calculate fuel cost."""
        sailing_days = sailing_hours / 24

        # Calculate fuel consumption
        # Assume half laden, half ballast
        laden_days = sailing_days / 2
        ballast_days = sailing_days / 2

        fuel_consumption_mt = (
            laden_days * self.DEFAULT_LADEN_FUEL_RATE_MT_PER_DAY
            + ballast_days * self.DEFAULT_BALLAST_FUEL_RATE_MT_PER_DAY
        )

        # Get fuel price
        fuel_price = await self._get_fuel_price()

        return fuel_consumption_mt * fuel_price

    async def _get_fuel_price(self) -> float:
        """Get current fuel price."""
        # TODO: Get actual fuel price from database
        result = await self.session.execute(
            select(FuelPrice)
            .where(FuelPrice.fuel_type == "VLSFO")
            .order_by(FuelPrice.date.desc())
            .limit(1)
        )
        fuel_price = result.scalar_one_or_none()

        if fuel_price:
            return fuel_price.price_usd_per_mt

        return self.DEFAULT_FUEL_PRICE_USD_PER_MT

    async def _calculate_port_costs(
        self,
        origin_port: Port | None,
        dest_port: Port | None,
    ) -> float:
        """Calculate total port costs."""
        # TODO: Get actual port charges from database
        # For now use default
        return self.DEFAULT_PORT_COST_USD * 2  # Origin + destination

    async def _calculate_demurrage(
        self,
        waiting_hours: float,
    ) -> float:
        """Calculate demurrage cost."""
        if waiting_hours <= 0:
            return 0.0

        waiting_days = waiting_hours / 24
        return waiting_days * self.DEMURRAGE_RATE_USD_PER_DAY
