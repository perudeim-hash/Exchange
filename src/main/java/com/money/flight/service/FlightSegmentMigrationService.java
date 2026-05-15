package com.money.flight.service;

import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightSegment;
import com.money.flight.enums.ConnectionType;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.repository.FlightSegmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightSegmentMigrationService {
    private final FlightOptionRepository flightOptionRepository;
    private final FlightSegmentRepository flightSegmentRepository;

    @Transactional
    public int createMissingSegments(int size) {
        List<Long> optionIds = flightOptionRepository.findIdsWithoutSegments(PageRequest.of(0, size));
        if (optionIds.isEmpty()) {
            return 0;
        }
        List<FlightOption> options = flightOptionRepository.findAllWithRouteAndAirportsByIdIn(optionIds);
        List<FlightSegment> segments = new ArrayList<>();

        for (FlightOption option : options) {
            if (option.getConnectionType() == ConnectionType.DIRECT) {
                segments.add(createDirectSegment(option));
                continue;
            }
            if (option.getConnectionType() == ConnectionType.ONE_STOP) {
                segments.addAll(createOneStopSegment(option));
            }
        }
        flightSegmentRepository.saveAll(segments);
        return segments.size();
    }

    private FlightSegment createDirectSegment(FlightOption option) {
        validateCommonOption(option);
        LocalDateTime departureDateTime = LocalDateTime.of(option.getDepartureDate(), option.getDepartureTime());
        LocalDateTime arrivalDateTime = departureDateTime.plusMinutes(option.getFlightDurationMinutes());

        return FlightSegment.create(option, 1, option.getFlightRoute().getOriginAirport(),
                option.getFlightRoute().getDestinationAirport(), departureDateTime.toLocalDate(), departureDateTime.toLocalTime(),
                arrivalDateTime.toLocalDate(), arrivalDateTime.toLocalTime(), option.getFlightDurationMinutes(), null);
    }

    private void validateCommonOption(FlightOption option) {
        if (option.getFlightRoute() == null) {
            throw new IllegalArgumentException("항공권 옵션에는 노선 정보가 필요합니다. optionId=" +option.getId());
        }
        if (option.getFlightRoute().getOriginAirport() == null) {
            throw new IllegalArgumentException("항공권 옵션에는 출발 공항 정보가 필요합니다. OriginAirport=" +option.getId());
        }
        if (option.getFlightRoute().getDestinationAirport() == null) {
            throw new IllegalArgumentException("항공권 옵션에는 도착 공항 정보가 필요합니다. DestinationAirport=" +option.getId());
        }
        if (option.getDepartureDate() == null || option.getDepartureTime() == null) {
            throw new IllegalArgumentException("항공권 옵션에는 출발 일시 정보가 필요합니다. Departure=" +option.getId());
        }
        if (option.getFlightDurationMinutes() == null || option.getFlightDurationMinutes() <= 0) {
            throw new IllegalArgumentException("항공권 옵션에는 비행 시간이 0보다 커야합니다. FlightDurationMinutes=" +option.getId());
        }


    }

    private List<FlightSegment> createOneStopSegment(FlightOption option) {
        validateOneStopOption(option);
        int flightDurationMinutes = option.getFlightDurationMinutes();
        int layoverDurationMinutes = option.getLayoverDurationMinutes();
        int firstSegmentDurationMinutes = flightDurationMinutes / 2;
        int secondSegmentDurationMinutes = flightDurationMinutes - firstSegmentDurationMinutes;

        LocalDateTime firstDepartureDateTime = LocalDateTime.of(option.getDepartureDate(), option.getDepartureTime());
        LocalDateTime firstArrivalDateTime = firstDepartureDateTime.plusMinutes(firstSegmentDurationMinutes);
        LocalDateTime secondDepartDateTime = firstArrivalDateTime.plusMinutes(layoverDurationMinutes);
        LocalDateTime secondArrivalDateTime = secondDepartDateTime.plusMinutes(secondSegmentDurationMinutes);

        FlightSegment firstSegment = FlightSegment.create(option, 1, option.getFlightRoute().getOriginAirport(),
                option.getLayoverAirport(), firstDepartureDateTime.toLocalDate(), firstDepartureDateTime.toLocalTime(), firstArrivalDateTime.toLocalDate(), firstArrivalDateTime.toLocalTime(),
                firstSegmentDurationMinutes, layoverDurationMinutes);

        FlightSegment secondSegment = FlightSegment.create(option, 2, option.getLayoverAirport(),
                option.getFlightRoute().getDestinationAirport(), secondDepartDateTime.toLocalDate(), secondDepartDateTime.toLocalTime(), secondArrivalDateTime.toLocalDate(), secondArrivalDateTime.toLocalTime(),
                secondSegmentDurationMinutes, null);
        return List.of(firstSegment, secondSegment);
    }

    private void validateOneStopOption(FlightOption option) {
        validateCommonOption(option);
        if (option.getLayoverAirport() == null) {
            throw new IllegalArgumentException("1회 경유 옵션에는 경유 공항이 필요합니다. LayoverAirport=" +option.getId());
        }
        if (option.getLayoverDurationMinutes() == null || option.getLayoverDurationMinutes() <= 0) {
            throw new IllegalArgumentException("항공권 옵션에는 비행 시간이 0보다 커야합니다. LayoverDurationMinutes=" + option.getId());
        }
    }

}
