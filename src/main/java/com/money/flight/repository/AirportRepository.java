package com.money.flight.repository;

import com.money.exchange.entity.Country;
import com.money.flight.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AirportRepository extends JpaRepository<Airport, Long> {

    Optional<Airport> findByCode(String code);

    List<Airport> findByEnabledTrueOrderByDisplayOrderAsc();

    List<Airport> findByCountryAndEnabledTrueOrderByDisplayOrderAsc(Country country);

    @Query("""
            select a from Airport a
            join fetch a.country c where a.enabled = true
            order by a.displayOrder asc
            """)
    List<Airport> findEnabledAirportsWithCountry();

}
