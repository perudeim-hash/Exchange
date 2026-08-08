package com.money.flight.service;

import com.money.flight.dto.FlightRouteSearchResponseDto;
import com.money.flight.dto.FlightRouteSummaryResponseDto;
import com.money.flight.entity.Airport;
import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.DepartureTimeSlot;
import com.money.flight.enums.SeatClass;
import com.money.flight.repository.AirportRepository;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.repository.FlightRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlightRouteViewService {
    private final FlightRouteRepository flightRouteRepository;
    private final AirportRepository airportRepository;
    private final FlightOptionRepository flightOptionRepository;

    @Transactional(readOnly = true)
    public List<FlightRouteSummaryResponseDto> getRoutes() {
        return flightRouteRepository.findByEnabledTrueOrderByDisplayOrderAsc().stream()
                .map(FlightRouteSummaryResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public FlightRouteSummaryResponseDto getRouteDetail(String originCode, String destinationCode) {
        String normalizedOriginCode = normalizeAirportCode(originCode, "출발 공항 코드는 필수입니다.");
        String normalizedDestinationCode = normalizeAirportCode(destinationCode, "도착 공항 코드는 필수입니다.");

        if (normalizedOriginCode.equals(normalizedDestinationCode)) {
            throw new IllegalArgumentException("출발 공항과 도착 공항은 같을 수 없습니다.");
        }

        Airport originAirport = airportRepository.findByCode(normalizedOriginCode)
                .orElseThrow(() -> new IllegalArgumentException("출발 공항 정보를 찾을 수 없습니다."));
        Airport destinationAirport = airportRepository.findByCode(normalizedDestinationCode)
                .orElseThrow(() -> new IllegalArgumentException("도착 공항 정보를 찾을 수 없습니다."));
        FlightRoute route = flightRouteRepository.findByOriginAirportAndDestinationAirport(originAirport, destinationAirport)
                .orElseThrow(() -> new IllegalArgumentException("해당 노선이 존재하지 않습니다. originCode = " + normalizedOriginCode + ", destination = " + normalizedDestinationCode));

        if (!Boolean.TRUE.equals(route.getEnabled())) {
            throw new IllegalArgumentException("현재 비활성화된 노선입니다.");
        }
        return FlightRouteSummaryResponseDto.from(route);

    }

    @Transactional(readOnly = true)
    public List<FlightRouteSearchResponseDto> searchRoutes(String originCode, String destinationCode, LocalDate startDate, LocalDate endDate, DepartureTimeSlot departureTimeSlot, ConnectionType connectionType, SeatClass seatClass) {
        validateSearchDateRange(startDate, endDate);
        String normalizedOriginCode = normalizeOptionalAirportCode(originCode);
        String normalizedDestinationCode = normalizeOptionalAirportCode(destinationCode);

        if (normalizedOriginCode != null && normalizedOriginCode.equals(normalizedDestinationCode)) {
            throw new IllegalArgumentException("출발 공항과 도착 공항은 같을 수 없습니다.");
        }
        DepartureTimeSlot safeDepartureTimeSlot =
                departureTimeSlot == null ? DepartureTimeSlot.ALL : departureTimeSlot;

        LocalTime startTime = safeDepartureTimeSlot.isAll() ? null : safeDepartureTimeSlot.getStartTime();
        LocalTime endTime = safeDepartureTimeSlot.isAll() ? null : safeDepartureTimeSlot.getEndTime();

        List<FlightOption> options = flightOptionRepository.findRouteSearchOptions(normalizedOriginCode, normalizedDestinationCode,
                startDate, endDate, connectionType, seatClass, startTime, endTime);

        Map<FlightRoute, List<FlightOption>> optionsByRoute = options.stream()
                .collect(Collectors.groupingBy(
                        FlightOption::getFlightRoute,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
        return optionsByRoute.entrySet().stream().map(entry -> {
                    FlightRoute route = entry.getKey();
                    List<FlightOption> routeOptions = entry.getValue();
                    FlightOption directMinPriceOption = minPriceOption(routeOptions,ConnectionType.DIRECT);
                    FlightOption layoverMinPriceOption = minPriceOption(routeOptions,ConnectionType.ONE_STOP);

                    return FlightRouteSearchResponseDto.of(route, directMinPriceOption, layoverMinPriceOption);
                })
                .toList();
    }


    private FlightOption minPriceOption(List<FlightOption> options, ConnectionType connectionType) {
        return options.stream()
                .filter(option -> option.getConnectionType() == connectionType)
                .min((option1, option2) -> {
                    int priceCompare = option1.getPrice().compareTo(option2.getPrice());
                    if (priceCompare != 0) {
                        return priceCompare;
                    }
                    int dateCompare = option1.getDepartureDate().compareTo(option2.getDepartureDate());
                    if (dateCompare != 0) {
                        return dateCompare;
                    }
                    return option1.getDepartureTime().compareTo(option2.getDepartureTime());
                })
                .orElse(null);
    }


    private void validateSearchDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            throw new IllegalArgumentException("시작일은 필수입니다.");
        }
         if (endDate == null) {
            throw new IllegalArgumentException("종료일은 필수입니다.");
        }
         if (startDate.isAfter(endDate)) {
             throw new IllegalArgumentException("시작일은 종료일보다 늦을 수 없습니다.");
        }
    }
    private String normalizeOptionalAirportCode(String airportCode) {
        if (airportCode == null || airportCode.isBlank()) {
            return null;
        }
        return airportCode.trim().toUpperCase();
    }


    private String normalizeAirportCode(String airportCode, String message) {
        if (airportCode == null || airportCode.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return airportCode.trim().toUpperCase();
    }
}
