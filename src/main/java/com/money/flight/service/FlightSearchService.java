package com.money.flight.service;

import com.money.flight.dto.*;
import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.FlightSortType;
import com.money.flight.enums.SeatClass;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.repository.FlightRouteRepository;
import com.money.flight.service.calculator.FlightFareCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightSearchService {
    private final FlightOptionRepository flightOptionRepository;
    private final FlightRouteRepository flightRouteRepository;
    private final FlightFareCalculator flightFareCalculator;
    private final static int ROUND_TRIP_SOURCE_LIMIT = 10;
    private final static int ROUND_TRIP_RESULT_LIMIT = 30;

    @Transactional(readOnly = true)
    public FlightSearchResponseDto searchFlights(String originCode, String destinationCode, LocalDate departureDate, ConnectionType connectionType, SeatClass seatClass, FlightSortType sort, int adultCount, int childCount, int infantCount) {
        validateSearchCondition(originCode, destinationCode, departureDate);
        flightFareCalculator.validatePassengerCounts(adultCount, childCount, infantCount);
        FlightSortType sortType = sort == null ? FlightSortType.PRICE_ASC : sort;

        List<FlightOption> options = flightOptionRepository.searchFlightOptions(originCode, destinationCode, departureDate, connectionType, seatClass);
        List<FlightOptionResponseDto> optionDtoList = sortOptions(options, sortType).stream()
                .map(option -> {
                    PassengerFareDto passengerFare = flightFareCalculator.calculate(option.getPrice(), adultCount, childCount, infantCount);
                    return FlightOptionResponseDto.from(option, passengerFare);
                }).toList();
        FlightRoute route = optionDtoList.isEmpty() ? findRouteForHeader(originCode, destinationCode) : options.get(0).getFlightRoute();

        return FlightSearchResponseDto.of(route.getOriginAirport().getCode(), route.getOriginAirport().getName(), route.getDestinationAirport().getCode(), route.getDestinationAirport().getName(), departureDate, optionDtoList);
    }

    @Transactional(readOnly = true)
    public RoundTripFlightSearchResponseDto searchRoundTripFlights(String originCode, String destinationCode, LocalDate departureDate, LocalDate returnDate,
                                                                   ConnectionType connectionType, SeatClass seatClass, FlightSortType sort, int adultCount, int childCount, int infantCount) {
        validateRoundTripSearchCondition(originCode, destinationCode, departureDate, returnDate);

        FlightSearchResponseDto  outboundResult = searchFlights(originCode, destinationCode, departureDate,
                connectionType, seatClass, sort, adultCount, childCount, infantCount);

        FlightSearchResponseDto  returnResult = searchFlights(destinationCode,originCode, returnDate,
                connectionType, seatClass, sort, adultCount, childCount, infantCount);
        List<RoundTripOptionResponseDto> roundTripOptions = createRoundTripOptions(outboundResult.getOptions(), returnResult.getOptions(), sort == null ? FlightSortType.PRICE_ASC : sort);
        return RoundTripFlightSearchResponseDto.of(outboundResult, returnDate, roundTripOptions);
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
        if (departureDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("오늘 이전 날짜는 검색할 수 없습니다.");
        }
        if (originCode.equalsIgnoreCase(destinationCode)) {
            throw new IllegalArgumentException("출발 공항과 도착 공항은 같을 수 없습니다.");
        }

    }
    private void validateRoundTripSearchCondition(String originCode, String destinationCode, LocalDate departureDate, LocalDate returnDate) {
        validateSearchCondition(originCode, destinationCode, departureDate);
        if (returnDate == null) {
            throw new IllegalArgumentException("왕복 검색에서는 오는 날이 필요합니다.");
        }
        if (returnDate.isBefore(LocalDate.now()) ) {
            throw new IllegalArgumentException("오늘 이전 날짜는 검색할 수 없습니다.");
        }
        if (!returnDate.isAfter(departureDate)) {
            throw new IllegalArgumentException("출발 날은 도착 날보다 늦어야 합니다..");
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

    private List<RoundTripOptionResponseDto> createRoundTripOptions(List<FlightOptionResponseDto> outboundOptions, List<FlightOptionResponseDto> returnOptions, FlightSortType sortType) {
        List<FlightOptionResponseDto> limitedOutboundOptions = outboundOptions.stream()
                .limit(ROUND_TRIP_SOURCE_LIMIT)
                .toList();
        List<FlightOptionResponseDto> limitedReturnOptions = returnOptions.stream()
                .limit(ROUND_TRIP_SOURCE_LIMIT)
                .toList();
        List<RoundTripOptionResponseDto> roundTripOptions = new ArrayList<>();

        for (FlightOptionResponseDto outboundOption : limitedOutboundOptions) {
            for (FlightOptionResponseDto returnOption : limitedReturnOptions) {
                roundTripOptions.add(RoundTripOptionResponseDto.of(outboundOption, returnOption));
            }
        }
        return sortRoundTripOptions(roundTripOptions,sortType).stream()
                .limit(ROUND_TRIP_RESULT_LIMIT)
                .toList();
    }

    private List<RoundTripOptionResponseDto> sortRoundTripOptions(List<RoundTripOptionResponseDto> options, FlightSortType sortType) {
        Comparator<RoundTripOptionResponseDto> comparator =
                switch (sortType) {
                    case PRICE_ASC -> Comparator.comparing(RoundTripOptionResponseDto::getTotalPrice);
                    case DURATION_ASC -> Comparator.comparing(RoundTripOptionResponseDto::getTotalDurationMinutes);
                    case DEPARTURE_ASC -> Comparator.comparing(option -> option.getOutboundOption().getDepartureTime());
                };
        return options.stream()
                .sorted(comparator).toList();
    }

}
