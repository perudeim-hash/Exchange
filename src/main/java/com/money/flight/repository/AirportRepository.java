package com.money.flight.repository;

import com.money.exchange.entity.Country;
import com.money.flight.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AirportRepository extends JpaRepository<Airport, Long> {

    Optional<Airport> findByCode(String code);

    List<Airport> findByEnabledTrueOrderByDisplayOrderAsc();

    List<Airport> findByCountryAndEnabledTrueOrderByDisplayOrderAsc(Country country);


}
