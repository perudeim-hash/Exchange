package com.money.flight.service;

import com.money.flight.dto.FlightOptionResponseDto;
import com.money.flight.dto.LowestPriceFlightResponseDto;
import com.money.flight.entity.FlightOption;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.service.calculator.FlightFareCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightLowestPriceService {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 30;

    private final FlightOptionRepository flightOptionRepository;
    private final FlightFareCalculator flightFareCalculator;

    @Transactional(readOnly = true)
    public LowestPriceFlightResponseDto findLowestPriceFlights(String originCode, String destinationCode, LocalDate startDate, LocalDate endDate,
                                                               ConnectionType connectionType, SeatClass seatClass, int adultCount, int childCount, int infantCount, Integer limit) {
        String normalizedOriginCode = normalizeAirportCode(originCode, "출발 공항은 필수입니다.");
        String normalizedDestinationCode = normalizeAirportCode(destinationCode, "도착 공항 코드는 필수입니다.");

        validateSearchCondition(normalizedOriginCode, normalizedDestinationCode, startDate, endDate);
        flightFareCalculator.validatePassengerCounts(adultCount, childCount, infantCount);
        int resultLimit = normalizeLimit(limit);

        List<FlightOption> options = flightOptionRepository.findLowestPriceOptions(normalizedOriginCode, normalizedDestinationCode, startDate, endDate, connectionType, seatClass, PageRequest.of(0, resultLimit));

        List<FlightOptionResponseDto> optionResponses = options.stream()
                .map(option -> FlightOptionResponseDto.from(option, flightFareCalculator.calculate(option.getPrice(), adultCount, childCount, infantCount)))
                .toList();
        return LowestPriceFlightResponseDto.of(normalizedOriginCode, normalizedDestinationCode, startDate, endDate, optionResponses);
    }




    private void validateSearchCondition(String originCode, String destinationCode, LocalDate startDate, LocalDate endDate) {
        if (originCode.equals(destinationCode)) {
            throw new IllegalArgumentException("출발 공항과 도착 공항은 같을 수 없습니다.");
        }

        if (startDate == null) {
            throw new IllegalArgumentException("조회 시작일은 필수입니다.");
        }
        if (endDate == null) {
            throw new IllegalArgumentException("조회 종료일은 필수입니다.");
        }

        if (startDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("오늘 이전 날짜는 검색할 수 없습니다.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("조회 종료일은 조회 시작일보다 빠를 수 없습니다.");
        }
    }

    private String normalizeAirportCode(String airportCode, String message) {
        if (airportCode == null || airportCode.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return airportCode.trim().toUpperCase();
    }
    private int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        if (limit <= 0) {
            throw new IllegalArgumentException("조회 개수는 1개 이상이어야 합니다.");
        }
        return Math.min(limit, MAX_LIMIT);
    }

}
