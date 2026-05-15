package com.money.flight.config;

import com.money.exchange.entity.Country;
import com.money.exchange.repository.CountryRepository;
import com.money.flight.entity.Airline;
import com.money.flight.entity.Airport;
import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.AirlineTier;
import com.money.flight.enums.RouteConnectionPolicy;
import com.money.flight.repository.AirlineRepository;
import com.money.flight.repository.AirportRepository;
import com.money.flight.repository.FlightRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class FlightDataInitializer implements CommandLineRunner {
    private final AirlineRepository airlineRepository;
    private final CountryRepository countryRepository;
    private final FlightRouteRepository flightRouteRepository;
    private final AirportRepository airportRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        initAirlinesFromCsv();
        initAirportFromCsv();
        initRoutesFromCsv();
    }


    private void initAirlinesFromCsv() throws Exception {
        ClassPathResource resource = new ClassPathResource("data/airline.csv");
        try (BufferedReader br = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;

            while ((line = br.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                if (line.isBlank()) {
                    continue;
                }

                String[] values = line.split(",");

                if (values.length < 5) {
                    throw new IllegalArgumentException("airline.csv 형식이 올바르지 않다.");
                }

                String code = values[0].trim();
                String name = values[1].trim();
                AirlineTier tier = AirlineTier.valueOf(values[2].trim());
                Boolean enabled = Boolean.parseBoolean(values[3].trim());
                Integer displayOrder = Integer.parseInt(values[4].trim());

                saveAirlineIfNotExists(code, name, tier, enabled, displayOrder);
            }
        }
    }

    private void saveAirlineIfNotExists(String code, String name, AirlineTier tier, Boolean enabled, Integer displayOrder) {
        if (airlineRepository.findByCode(code).isPresent()) {
            return;
        }
        Airline airline = new Airline(code, name, tier, enabled, displayOrder);
        airlineRepository.save(airline);
    }

    private void initRoutesFromCsv() throws IOException {
        ClassPathResource resource = new ClassPathResource("data/routes.csv");
        try (BufferedReader br = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;

            while ((line = br.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                if (line.isBlank()) {
                    continue;
                }

                String[] values = line.split(",");

                if (values.length < 7) {
                    throw new IllegalArgumentException("routes.csv 형식이 올바르지 않다.");
                }

                String originAirportCode = values[0].trim();
                String destinationAirportCode = values[1].trim();
                RouteConnectionPolicy policy = RouteConnectionPolicy.valueOf(values[2].trim());
                Integer directBaseDurationMinutes = parseNullableInteger(values[3].trim());
                Integer oneStopBaseDurationMinutes = parseNullableInteger(values[4].trim());
                Boolean enabled = Boolean.parseBoolean(values[5].trim());
                Integer displayOrder = Integer.parseInt(values[6].trim());

                saveRoutePairIfNotExists(originAirportCode, destinationAirportCode, policy,directBaseDurationMinutes,oneStopBaseDurationMinutes, enabled, displayOrder);
            }
        }
    }

    private void saveRoutePairIfNotExists(String originAirportCode, String destinationAirportCode, RouteConnectionPolicy policy, Integer directBaseDurationMinutes, Integer oneStopBaseDurationMinutes, Boolean enabled, Integer displayOrder) {
        saveRouteIfNotExists(originAirportCode, destinationAirportCode, policy, directBaseDurationMinutes, oneStopBaseDurationMinutes, enabled, displayOrder);

        saveRouteIfNotExists(destinationAirportCode, originAirportCode, policy, directBaseDurationMinutes, oneStopBaseDurationMinutes, enabled, displayOrder + 10000);
    }


    private void saveRouteIfNotExists(String originAirportCode, String destinationAirportCode, RouteConnectionPolicy policy,Integer directBaseDurationMinutes,Integer oneStopBaseDurationMinutes, Boolean enabled, Integer displayOrder) {
        Airport originAirport = airportRepository.findByCode(originAirportCode)
                .orElseThrow(() -> new IllegalArgumentException("출발 공항이 존재하지 않습니다. code = " + originAirportCode));

        Airport destinationAirport = airportRepository.findByCode(destinationAirportCode)
                .orElseThrow(() -> new IllegalArgumentException("도착 공항이 존재하지 않습니다. code = " + destinationAirportCode));

        if (flightRouteRepository.findByOriginAirportAndDestinationAirport(originAirport, destinationAirport).isPresent()) {
            return;
        }

        FlightRoute flightRoute = new FlightRoute(originAirport, destinationAirport, policy, directBaseDurationMinutes, oneStopBaseDurationMinutes, enabled, displayOrder);

        flightRouteRepository.save(flightRoute);
    }


    private void initAirportFromCsv() throws IOException {
        ClassPathResource resource = new ClassPathResource("data/airports.csv");
        try (BufferedReader br = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;

            while ((line = br.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                if (line.isBlank()) {
                    continue;
                }

                String[] values = line.split(",");

                if (values.length < 6) {
                    throw new IllegalArgumentException("airports.csv 형식이 올바르지 않다.");
                }
                String code = values[0].trim();
                String name = values[1].trim();
                String cityName = values[2].trim();
                String countryCode = (values[3].trim());
                Boolean enabled = Boolean.parseBoolean(values[4].trim());
                Integer displayOrder = Integer.parseInt(values[5].trim());

                saveAirportIfNotExists(code, name, cityName, countryCode, enabled, displayOrder);
            }
        }
    }

    private void saveAirportIfNotExists(String code, String name, String cityName, String countryCode, Boolean enabled, Integer displayOrder) {
        if (airportRepository.findByCode(code).isPresent()) {
            return;
        }
        Country country = countryRepository.findByCode(countryCode)
                .orElseThrow(() -> new IllegalArgumentException("공항 국가가 존재하지 않습니다. countryCode = " + countryCode));

        Airport airport = new Airport(code, name, cityName, country, enabled, displayOrder);

        airportRepository.save(airport);
    }


    private Integer parseNullableInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Integer.parseInt(value);
    }
}


