package com.money.flight.service;

import com.money.flight.dto.FlightSearchResponseDto;
import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.FlightSortType;
import com.money.flight.enums.SeatClass;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.repository.FlightRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightSearchService {
    private final FlightOptionRepository flightOptionRepository;
    private final FlightRouteRepository flightRouteRepository;

    @Transactional(readOnly = true)
    public FlightSearchResponseDto searchFlights(String originCode, String destinationCode, LocalDate departureDate, ConnectionType connectionType, SeatClass seatClass, FlightSortType sort) {
        validateSearchCondition(originCode, destinationCode, departureDate);

        FlightSortType sortType = sort == null ? FlightSortType.PRICE_ASC : sort;

        List<FlightOption> options = flightOptionRepository.searchFlightOptions(originCode, destinationCode, departureDate, connectionType, seatClass);
        List<FlightOption> sortedOptions = sortOptions(options, sortType);

        FlightRoute route = sortedOptions.isEmpty() ? findRouteForHeader(originCode, destinationCode) : sortedOptions.get(0).getFlightRoute();

        return FlightSearchResponseDto.of(route.getOriginAirport().getCode(), route.getOriginAirport().getName(), route.getDestinationAirport().getCode(), route.getDestinationAirport().getName(), departureDate, sortedOptions);
    }


    private void validateSearchCondition(String originCode, String destinationCode, LocalDate departureDate) {
        if (originCode == null || originCode.isBlank()) {
            throw new IllegalArgumentException("출발 공항 코드는 필수입니다.");
        }
        if (destinationCode == null || destinationCode.isBlank()) {
            throw new IllegalArgumentException("도착 공항 코드는 필수입니다.");
        }
        if (departureDate == null) {
            throw new IllegalArgumentException("출발 날짜는 필수입니다.");
        }
        if (originCode.equalsIgnoreCase(destinationCode)) {
            throw new IllegalArgumentException("출발 공항과 도착 공항은 같을 수 없습니다.");
        }

    }

    private List<FlightOption> sortOptions(List<FlightOption> options, FlightSortType sortType) {
        Comparator<FlightOption> comparator = switch (sortType) {
            case PRICE_ASC -> Comparator.comparing(FlightOption::getPrice);
            case DURATION_ASC -> Comparator.comparing(FlightOption::getTotalDurationMinutes);
            case DEPARTURE_ASC -> Comparator.comparing(FlightOption::getDepartureTime);
        };
        return options.stream().sorted(comparator).toList();
    }

    private FlightRoute findRouteForHeader(String originCode, String destinationCode) {
        return flightRouteRepository.findAll().stream()
                .filter(route -> route.getOriginAirport().getCode().equalsIgnoreCase(originCode))
                .filter(route -> route.getDestinationAirport().getCode().equalsIgnoreCase(destinationCode))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 노선이 존재하지 않습니다. origin = " + originCode + ", destinationCode = " + destinationCode));
    }

}
