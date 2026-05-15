package com.money.flight.service.generator;

import com.money.flight.entity.*;
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
                        if (option != null) {
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
            case DIRECT_AND_ONE_STOP -> List.of(ConnectionType.DIRECT, ConnectionType.ONE_STOP);
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
            totalDurationMinutes = flightDurationMinutes + layoverDurationMinutes;
        }
        LocalDateTime departureDateTime = LocalDateTime.of(departureDate, departureTime);
        LocalDateTime arrivalDateTime = departureDateTime.plusMinutes(totalDurationMinutes);

        FlightOption option = new FlightOption(route, airline, layoverAirport, seatClass,
                connectionType, departureDate, departureTime, arrivalDateTime.toLocalDate(), arrivalDateTime.toLocalTime(),
                flightDurationMinutes, layoverDurationMinutes, totalDurationMinutes, flightPriceCalculator.createPrice(
                route, airline, seatClass, connectionType, departureDate, departureTime, variant, random
        ), true);
        addSegments(option, route, connectionType, layoverAirport, departureDateTime, flightDurationMinutes, layoverDurationMinutes, random);

        return option;
    }

    private void addSegments(FlightOption option, FlightRoute route, ConnectionType connectionType, Airport layoverAirport, LocalDateTime departureDateTime, Integer flightDurationMinutes, Integer layoverDurationMinutes, Random random) {
        if (connectionType == ConnectionType.DIRECT) {
            addDirectSegment(
                    option, route, departureDateTime, flightDurationMinutes);
            return;
        }
        if (connectionType == ConnectionType.ONE_STOP) {
            addOneStopSegment(
                    option, route,layoverAirport, departureDateTime, flightDurationMinutes,layoverDurationMinutes,random);
            return;
        }

    }


    private void addDirectSegment(FlightOption option, FlightRoute route, LocalDateTime departureDateTime, int durationMinutes) {
        LocalDateTime arrivalDateTime = departureDateTime.plusMinutes(durationMinutes);

        FlightSegment segment = FlightSegment.create(option,1,
                route.getOriginAirport(), route.getDestinationAirport(), departureDateTime.toLocalDate(),
                departureDateTime.toLocalTime(), arrivalDateTime.toLocalDate(),arrivalDateTime.toLocalTime(),durationMinutes,null);
        option.addSegment(segment);
    }

    private void addOneStopSegment(FlightOption option, FlightRoute route, Airport layoverAirport, LocalDateTime departureDateTime, Integer flightDurationMinutes, Integer layoverDurationMinutes, Random random) {
        if (layoverAirport == null) {
            throw new IllegalArgumentException("1회 경유 항공권의 경유 공항은 필수입니다.");
        }
        if (layoverDurationMinutes <= 0) {
            throw new IllegalArgumentException("1회 경유 항공권의 경유 대기 시간은 0보다 커야 합니다.");
        }
        int firstSegmentDurationMinutes = createFirstSegmentDurationMinutes(flightDurationMinutes, random);

        int secondSegmentDurationMinutes = flightDurationMinutes - firstSegmentDurationMinutes;

        if (secondSegmentDurationMinutes <= 0) {
            throw new IllegalArgumentException("두 번째 비행 구간 시간은 0보다 커야 합니다.");
        }
        LocalDateTime firstDepartureDateTime = departureDateTime;
        LocalDateTime firstArrivalDateTime = firstDepartureDateTime.plusMinutes(firstSegmentDurationMinutes);

        LocalDateTime secondDepartureDateTime = firstArrivalDateTime.plusMinutes(layoverDurationMinutes);
        LocalDateTime secondArrivalDateTime = secondDepartureDateTime.plusMinutes(secondSegmentDurationMinutes);

        FlightSegment firstSegment = FlightSegment.create(option, 1, route.getOriginAirport(),
                layoverAirport, firstDepartureDateTime.toLocalDate(), firstDepartureDateTime.toLocalTime(), firstArrivalDateTime.toLocalDate(), firstArrivalDateTime.toLocalTime(),
                firstSegmentDurationMinutes, layoverDurationMinutes);

        FlightSegment secondSegment = FlightSegment.create(option, 2, layoverAirport, route.getDestinationAirport(),
                secondDepartureDateTime.toLocalDate(), secondDepartureDateTime.toLocalTime(), secondArrivalDateTime.toLocalDate(), secondArrivalDateTime.toLocalTime(),
                secondSegmentDurationMinutes, null);

        option.addSegment(firstSegment);
        option.addSegment(secondSegment);
        
    }

    private int createFirstSegmentDurationMinutes(int flightDurationMinutes, Random random) {
        if (flightDurationMinutes <= 1) {
            throw new IllegalArgumentException("실제 비행 시간은 1분보다 커야 합니다.");
        }
        int minFirstSegmentMinutes = Math.max(30, flightDurationMinutes / 3);
        int maxFirstSegmentMinutes = Math.min(flightDurationMinutes - 30, (flightDurationMinutes * 2) / 3);

        if (maxFirstSegmentMinutes <= minFirstSegmentMinutes) {
            return flightDurationMinutes / 2;
        }
        return minFirstSegmentMinutes + random.nextInt(maxFirstSegmentMinutes - minFirstSegmentMinutes + 1);
    }


    private LocalTime createDepartureTime(Random random) {
        int[] hours = {6, 8, 10, 13, 16, 19, 22, 23};
        int hour = hours[random.nextInt(hours.length)];
        int minute = random.nextBoolean() ? 0 : 30;
        return LocalTime.of(hour, minute);
    }

}
