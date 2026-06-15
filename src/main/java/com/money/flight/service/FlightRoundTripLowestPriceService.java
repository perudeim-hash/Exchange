package com.money.flight.service;

import com.money.flight.dto.FlightOptionResponseDto;
import com.money.flight.dto.RoundTripLowestPriceResponseDto;
import com.money.flight.dto.RoundTripOptionResponseDto;
import com.money.flight.entity.FlightOption;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.service.calculator.FlightFareCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightRoundTripLowestPriceService {
    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 30;
    private static final int MAX_CANDIDATE_LIMIT = 100;

    private final FlightOptionRepository flightOptionRepository;
    private final FlightFareCalculator flightFareCalculator;

    @Transactional(readOnly = true)
    public RoundTripLowestPriceResponseDto findRoundTripLowestPriceFlights(String originCode, String destinationCode, LocalDate outboundStartDate, LocalDate outboundEndDate, LocalDate returnStartDate, LocalDate returnEndDate,
                                                                           ConnectionType connectionType, SeatClass seatClass, int adultCount, int childCount, int infantCount, Integer limit) {
        String normalizedOriginCode = normalizeAirportCode(originCode, "출발 공항은 필수입니다.");
        String normalizedDestinationCode = normalizeAirportCode(destinationCode, "도착 공항 코드는 필수입니다.");

        validateSearchCondition(normalizedOriginCode, normalizedDestinationCode, outboundStartDate, outboundEndDate, returnStartDate, returnEndDate);

        flightFareCalculator.validatePassengerCounts(adultCount, childCount, infantCount);
        int resultLimit = normalizeLimit(limit);
        int candidateLimit = normalizeCandidateLimit(resultLimit);
        List<FlightOption> outboundOptions = flightOptionRepository.findLowestPriceOptions(normalizedOriginCode, normalizedDestinationCode, outboundStartDate, outboundEndDate, connectionType, seatClass, PageRequest.of(0, candidateLimit));
        List<FlightOption> returnOptions = flightOptionRepository.findLowestPriceOptions(normalizedDestinationCode,normalizedOriginCode, returnStartDate, returnEndDate, connectionType, seatClass, PageRequest.of(0, candidateLimit));
        List<RoundTripCandidate> candidates = createRoundTripCandidates(outboundOptions, returnOptions);

        List<RoundTripOptionResponseDto> options = candidates.stream()
                .limit(resultLimit)
                .map(candidate -> toRoundTripOptionResponse(candidate, adultCount, childCount, infantCount))
                .toList();
        return RoundTripLowestPriceResponseDto.of(normalizedOriginCode, normalizedDestinationCode, outboundStartDate, outboundEndDate, returnStartDate, returnEndDate, options);
    }


    private List<RoundTripCandidate> createRoundTripCandidates(List<FlightOption> outboundOptions, List<FlightOption> returnOptions) {
        List<RoundTripCandidate> candidates = new ArrayList<>();
        for (FlightOption outboundOption : outboundOptions) {
            for (FlightOption reoption : returnOptions) {
                if (!isValidReturnOption(outboundOption, reoption)) {
                    continue;
                }
                BigDecimal totalBasePrice = outboundOption.getPrice().add(reoption.getPrice());
                candidates.add(new RoundTripCandidate(outboundOption, reoption, totalBasePrice));
            }
        }
        candidates.sort(Comparator.comparing(RoundTripCandidate::totalBasePrice)
                .thenComparing(candidate -> candidate.outboundOption().getDepartureDate())
                .thenComparing(candidate -> candidate.returnOption().getDepartureDate())
                .thenComparing(candidate -> candidate.outboundOption().getDepartureTime())
                .thenComparing(candidate -> candidate.returnOption().getDepartureTime()));
        return candidates;
    }

    private boolean isValidReturnOption(FlightOption outboundOption, FlightOption returnOption) {
        if (returnOption.getDepartureDate().isAfter(outboundOption.getArrivalDate())) {
            return true;
        }
        if (returnOption.getDepartureDate().isBefore(outboundOption.getArrivalDate())) {
            return false;
        }
        return !returnOption.getDepartureTime().isBefore(outboundOption.getArrivalTime());
    }

    private RoundTripOptionResponseDto toRoundTripOptionResponse(RoundTripCandidate candidate, int adultCount, int childCount, int infantCount) {
        FlightOption outboundOption = candidate.outboundOption();
        FlightOption returnOption = candidate.returnOption();

        FlightOptionResponseDto outboundOptionResponse = FlightOptionResponseDto.from(outboundOption, flightFareCalculator.calculate(outboundOption.getPrice(), adultCount, childCount, infantCount));
        FlightOptionResponseDto returnOptionResponse = FlightOptionResponseDto.from(returnOption, flightFareCalculator.calculate(returnOption.getPrice(), adultCount, childCount, infantCount));

        return RoundTripOptionResponseDto.of(outboundOptionResponse, returnOptionResponse);

    }


    private String normalizeAirportCode(String airportCode, String message) {
        if (airportCode == null || airportCode.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return airportCode.trim().toUpperCase();
    }

    private void validateSearchCondition(String originCode, String destinationCode, LocalDate outboundStartDate, LocalDate outboundEndDate, LocalDate returnStartDate, LocalDate returnEndDate) {
        if (originCode.equals(destinationCode)) {
            throw new IllegalArgumentException("출발 공항과 도착 공항은 같을 수 없습니다.");
        }

        if (outboundStartDate == null) {
            throw new IllegalArgumentException("가는 편 조회 시작일은 필수입니다.");
        }
        if (outboundEndDate == null) {
            throw new IllegalArgumentException("가는 편 조회 종료일은 필수입니다.");
        }
        if (returnStartDate == null) {
            throw new IllegalArgumentException("오는 편 조회 시작일은 필수입니다.");
        }
        if (returnEndDate == null) {
            throw new IllegalArgumentException("오는 편 조회 종료일은 필수입니다.");
        }
        if (outboundStartDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("오늘 이전 날짜는 검색할 수 없습니다.");
        }
        if (outboundEndDate.isBefore(outboundStartDate)) {
            throw new IllegalArgumentException("가는 편 조회 종료일은 시작일보다 빠를 수 없습니다.");
        }
        if (returnStartDate.isBefore(outboundStartDate)) {
            throw new IllegalArgumentException("오는 편 조회 시작일은 가는 편 조회 시작일보다 빠를 수 없습니다..");
        }
        if (returnEndDate.isBefore(returnStartDate)) {
            throw new IllegalArgumentException("오는 편 조회 종료일은 시작일보다 빠를 수 없습니다.");
        }
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

    private int normalizeCandidateLimit(int resultLimit) {
        return Math.min(resultLimit * 5, MAX_CANDIDATE_LIMIT);
    }

    private record RoundTripCandidate(FlightOption outboundOption, FlightOption returnOption,
                                      BigDecimal totalBasePrice) {

    }
}

