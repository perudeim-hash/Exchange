package com.money.flight.service.generator;

import com.money.flight.entity.Airline;
import com.money.flight.entity.Airport;
import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.AirlineTier;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.RouteConnectionPolicy;
import com.money.flight.enums.SeatClass;
import com.money.flight.service.calculator.FlightDurationCalculator;
import com.money.flight.service.calculator.FlightPriceCalculator;
import com.money.flight.service.policy.LayoverAirportPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class FlightOptionGenerator {

    private static final int MAX_AIRLINES_PER_ROUTE_AND_CONNECTION = 4;

    private final FlightPriceCalculator flightPriceCalculator;
    private final FlightDurationCalculator flightDurationCalculator;
    private final LayoverAirportPolicy layoverAirportPolicy;

    public List<FlightOption> generate(FlightRoute route, LocalDate departureDate, List<Airline> airlines) {
        List<FlightOption> options = new ArrayList<>();
        List<ConnectionType> connectionTypes = resolveConnectionTypes(route);

        for (ConnectionType connectionType : connectionTypes) {
            if (!canGenerateByDuration(route, connectionType)) {
                continue;
            }
            List<Airline> selectedAirlines = selectAirLines(route, connectionType, departureDate, airlines);

            for (Airline airline : selectedAirlines) {
                List<SeatClass> seatClasses = resolveSeatClasses(airline);

                for (SeatClass seatClass : seatClasses) {
                    Random random = new Random(Objects.hash(route.getId(), departureDate, connectionType, airline.getCode(), seatClass));
                    int variantCount = 1 + random.nextInt(2);
                    for (int variant = 0; variant < variantCount; variant++) {
                        FlightOption option = createOption(route, airline, seatClass, connectionType, departureDate, variant, random);
                        if (option != null){
                            options.add(option);
                        }
                    }
                }
            }
        }
        return options;
    }

    private List<ConnectionType> resolveConnectionTypes(FlightRoute route) {
        RouteConnectionPolicy policy = route.getRouteConnectionPolicy();

        return switch (policy) {
            case DIRECT_ONLY -> List.of(ConnectionType.DIRECT);
            case ONE_STOP_ONLY -> List.of(ConnectionType.ONE_STOP);
            case DIRECT_AND_ONE_STOP -> List.of(ConnectionType.DIRECT,ConnectionType.ONE_STOP);
        };
    }

    private boolean canGenerateByDuration(FlightRoute route, ConnectionType connectionType) {
        if (connectionType == ConnectionType.DIRECT) {
            return route.getDirectBaseDurationMinutes() != null;
        }
        return route.getOneStopBaseDurationMinutes() != null;
    }

    private List<Airline> selectAirLines(FlightRoute route, ConnectionType connectionType, LocalDate departureDate, List<Airline> airlines) {
        List<Airline> candidates = new ArrayList<>();
        for (Airline airline : airlines) {
            if (isAirlineAvailableForRoute(route, airline, connectionType)) {
                candidates.add(airline);
            }
        }
        Random random = new Random(Objects.hash(route.getId(), departureDate, connectionType));

        Collections.shuffle(candidates, random);
        int limit = Math.min(MAX_AIRLINES_PER_ROUTE_AND_CONNECTION, candidates.size());
        return candidates.subList(0, limit);
    }

    private boolean isAirlineAvailableForRoute(FlightRoute route, Airline airline, ConnectionType connectionType) {
        Integer directDuration = route.getDirectBaseDurationMinutes();
        if (airline.getTier() == AirlineTier.LOW_COST && connectionType == ConnectionType.DIRECT) {
            return directDuration != null && directDuration <= 430;
        }
        return true;
    }


    private List<SeatClass> resolveSeatClasses(Airline airline) {
        return switch (airline.getTier()) {
            case PREMIUM -> List.of(SeatClass.ECONOMY, SeatClass.PREMIUM_ECONOMY, SeatClass.BUSINESS, SeatClass.FIRST);
            case STANDARD -> List.of(SeatClass.ECONOMY, SeatClass.PREMIUM_ECONOMY, SeatClass.BUSINESS);
            case LOW_COST -> List.of(SeatClass.ECONOMY, SeatClass.EXTRA_LEGROOM);
        };
    }

    private FlightOption createOption(FlightRoute route, Airline airline, SeatClass seatClass, ConnectionType connectionType, LocalDate departureDate, int variant, Random random) {
        LocalTime departureTime = createDepartureTime(random);

        Integer totalDurationMinutes = flightDurationCalculator.createTotalDurationMinutes(route, connectionType, random);
        if (totalDurationMinutes == null) {
            return null;
        }
        Integer layoverDurationMinutes = null;
        Integer flightDurationMinutes = totalDurationMinutes;
        Airport layoverAirport = null;

        if (connectionType == ConnectionType.ONE_STOP) {
            layoverAirport = layoverAirportPolicy.selectLayoverAirport(route, random);

            if (layoverAirport == null) {
                return null;
            }
            layoverDurationMinutes = flightDurationCalculator.createLayoverDurationMinutes(random);
            flightDurationMinutes = flightDurationCalculator.calculateFlightDurationMinutes(totalDurationMinutes, layoverDurationMinutes);
        }
        LocalDateTime departureDateTime = LocalDateTime.of(departureDate, departureTime);
        LocalDateTime arrivalDateTime = departureDateTime.plusMinutes(totalDurationMinutes);

        return new FlightOption(route, airline, layoverAirport, seatClass, connectionType, departureDate, departureTime,
                arrivalDateTime.toLocalDate(), arrivalDateTime.toLocalTime(), flightDurationMinutes, layoverDurationMinutes, totalDurationMinutes,
                flightPriceCalculator.createPrice(route, airline, seatClass, connectionType, departureDate, departureTime, variant, random),true);
    }

    private LocalTime createDepartureTime(Random random) {
        int[] hours = {6, 8, 10, 13, 16, 19, 22, 23};
        int hour = hours[random.nextInt(hours.length)];
        int minute = random.nextBoolean() ? 0 : 30;
        return LocalTime.of(hour, minute);
    }

}
