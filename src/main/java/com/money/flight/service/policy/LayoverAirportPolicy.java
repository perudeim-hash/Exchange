package com.money.flight.service.policy;

import com.money.flight.entity.Airport;
import com.money.flight.entity.FlightRoute;
import com.money.flight.repository.AirportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class LayoverAirportPolicy {
    private final AirportRepository airportRepository;

    private Map<String,Airport> airportByCode;

    public Airport selectLayoverAirport(FlightRoute route, Random random) {

        loadAirportCacheIfNeeded();

        List<String> candidateCodes = resolveLayoverCandidateCodes(route);
        Collections.shuffle(candidateCodes, random);

        for (String code : candidateCodes) {
            if (code.equals(route.getOriginAirport().getCode())) {
                continue;
            }
            if (code.equals(route.getDestinationAirport().getCode())) {
                continue;
            }
            Airport airport = airportByCode.get(code);

            if (airport != null) {
                return airport;
            }

        }
        return null;
    }

    private void loadAirportCacheIfNeeded(){
        if (airportByCode != null) {
            return;
        }
        airportByCode = new HashMap<>();
        List<Airport> airports = airportRepository.findAll();
        for (Airport airport : airports) {
            airportByCode.put(airport.getCode(), airport);
        }
    }

    private List<String> resolveLayoverCandidateCodes(FlightRoute route) {
        String region = route.getDestinationAirport().getCountry().getRegion();
        String destinationCountryCode = route.getDestinationAirport().getCountry().getCode();

        if ("PT".equalsIgnoreCase(destinationCountryCode)) {
            return new ArrayList<>(List.of("FRA", "CDG", "AMS", "DXB"));
        }
        if ("EUROPE".equalsIgnoreCase(region)) {
            return new ArrayList<>(List.of("DXB", "SIN", "HKG", "FRA", "CDG", "AMS", "VIE"));
        }
        if ("AMERICA".equalsIgnoreCase(region) || "NORTH_AMERICA".equalsIgnoreCase(region)) {
            return new ArrayList<>(List.of("NRT", "HND", "YVR", "LAX", "SFO"));
        }
        if ("OCEANIA".equalsIgnoreCase(region))  {
            return new ArrayList<>(List.of("SIN", "HKG", "BKK", "KUL"));
        }
        if ("ASIA".equalsIgnoreCase(region)) {
            return new ArrayList<>(List.of("HKG", "TPE", "SIN", "BKK"));
        }
        if ("MIDDLE_EAST".equalsIgnoreCase(region) || "MIDDLE EAST".equalsIgnoreCase(region)) {
            return new ArrayList<>(List.of("HKG", "SIN","BKK"));
        }
        return new ArrayList<>(List.of("DXB", "SIN", "HKG"));




    }



}
