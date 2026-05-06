package com.money.flight.repository;

import com.money.flight.entity.Airport;
import com.money.flight.entity.FlightRoute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlightRouteRepository extends JpaRepository<FlightRoute, Long> {
    Optional<FlightRoute> findByOriginAirportAndDestinationAirport(Airport originAirport, Airport destinationAirport);

    List<FlightRoute> findByEnabledTrueOrderByDisplayOrderAsc();
}
