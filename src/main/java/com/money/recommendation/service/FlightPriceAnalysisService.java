package com.money.recommendation.service;

import com.money.flight.dto.PassengerFareDto;
import com.money.flight.entity.FlightOption;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.service.calculator.FlightFareCalculator;
import com.money.recommendation.dto.FlightPriceAnalysisResponseDto;
import com.money.recommendation.dto.MonthlyFlightPriceAnalysisDto;
import com.money.recommendation.dto.RoundTripDatePriceDto;
import com.money.recommendation.dto.WeekdayPriceAnalysisDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FlightPriceAnalysisService {
    private static final int TOP_DATE_LIMIT = 5;

    private final FlightOptionRepository flightOptionRepository;
    private final FlightFareCalculator flightFareCalculator;

    public FlightPriceAnalysisResponseDto analyzeRoundTripPrices(String originAirportCode, String destinationAirportCode, LocalDate startDate, LocalDate endDate, int stayDays, ConnectionType connectionType, SeatClass seatClass, int adultCount, int childCount, int infantCount) {
        validateCondition(originAirportCode, destinationAirportCode, startDate, endDate, stayDays);
        flightFareCalculator.validatePassengerCounts(adultCount, childCount, infantCount);
        SeatClass analysisSeatClass = seatClass == null ? SeatClass.ECONOMY : seatClass;

        LocalDate returnStartDate = startDate.plusDays(stayDays);
        LocalDate returnEndDate = endDate.plusDays(stayDays);

        List<FlightOption> outboundOption = flightOptionRepository.findOptionsForPriceAnalysis(
                originAirportCode, destinationAirportCode, startDate, endDate, connectionType, analysisSeatClass
        );
        List<FlightOption> returnOption = flightOptionRepository.findOptionsForPriceAnalysis(
                destinationAirportCode, originAirportCode, returnStartDate, returnEndDate, connectionType, analysisSeatClass
        );
        Map<LocalDate, BigDecimal> outboundMinPriceByDate = toMinPassengerPriceByDepartureDate(
                outboundOption, adultCount, childCount, infantCount
        );
        Map<LocalDate, BigDecimal> returnMinPriceByDate = toMinPassengerPriceByDepartureDate(
                returnOption, adultCount, childCount, infantCount
        );
        List<RoundTripDatePriceDto> roundTripPrices = createRoundTripDatePrices(
                outboundMinPriceByDate, returnMinPriceByDate, stayDays
        );
        List<MonthlyFlightPriceAnalysisDto> monthlyAnalyses = analyzeByMonth(roundTripPrices);

        return FlightPriceAnalysisResponseDto.of(originAirportCode, destinationAirportCode, startDate, endDate, stayDays, roundTripPrices.size(), monthlyAnalyses);
    }


    private Map<LocalDate, BigDecimal> toMinPassengerPriceByDepartureDate(List<FlightOption> options, int adultCount, int childCount, int infantCount) {
        Map<LocalDate, BigDecimal> minPriceByDate = new HashMap<>();

        for (FlightOption option : options) {
            LocalDate departureDate = option.getDepartureDate();

            BigDecimal totalPrice = calculatePassengerTotalPrice(
                    option,
                    adultCount,
                    childCount,
                    infantCount
            );

            BigDecimal currentMinPrice = minPriceByDate.get(departureDate);

            if (currentMinPrice == null || totalPrice.compareTo(currentMinPrice) < 0) {
                minPriceByDate.put(departureDate, totalPrice);
            }
        }

        return minPriceByDate;
    }
    private BigDecimal calculatePassengerTotalPrice(FlightOption option, int adultCount, int childCount, int infantCount) {
        PassengerFareDto passengerFare = flightFareCalculator.calculate(option.getPrice(), adultCount, childCount, infantCount);
        return passengerFare.getTotalPrice();
    }

    private List<RoundTripDatePriceDto> createRoundTripDatePrices(
            Map<LocalDate, BigDecimal> outboundMinPriceByDate,
            Map<LocalDate, BigDecimal> returnMinPriceByDate,
            int stayDays
    ) {
        List<RoundTripDatePriceDto> result = new ArrayList<>();
        for (Map.Entry<LocalDate, BigDecimal> entry : outboundMinPriceByDate.entrySet()) {
            LocalDate departureDate = entry.getKey();
            LocalDate returnDate = departureDate.plusDays(stayDays);

            BigDecimal returnPrice = returnMinPriceByDate.get(returnDate);
            if (returnPrice == null) {
                continue;
            }
            result.add(RoundTripDatePriceDto.of(departureDate, returnDate, entry.getValue(), returnPrice));
        }
        return result.stream()
                .sorted(Comparator.comparing(RoundTripDatePriceDto::getDepartureDate))
                .toList();
    }

    private MonthlyFlightPriceAnalysisDto analyzeSingleMonth(YearMonth yearMonth, List<RoundTripDatePriceDto> prices) {
        if (prices == null || prices.isEmpty()) {
            throw new IllegalArgumentException("월별 항공권 분석 데이터가 없습니다.");
        }

        List<RoundTripDatePriceDto> sortedByCheap = prices.stream()
                .sorted(Comparator.comparing(RoundTripDatePriceDto::getTotalPrice))
                .toList();
        List<RoundTripDatePriceDto> cheapestDates = sortedByCheap.stream()
                .limit(TOP_DATE_LIMIT)
                .toList();
        List<RoundTripDatePriceDto> expensiveDates = sortedByCheap.stream()
                .sorted(Comparator.comparing(RoundTripDatePriceDto::getTotalPrice).reversed())
                .limit(TOP_DATE_LIMIT)
                .toList();

        BigDecimal minPrice = sortedByCheap.get(0).getTotalPrice();
        BigDecimal maxPrice = expensiveDates.get(0).getTotalPrice();
        BigDecimal cheapTop5AveragePrice = averageTotalPrice(cheapestDates);

        WeekdayPriceAnalysisDto cheapestWeekday = findCheapestWeekday(prices);
        WeekdayPriceAnalysisDto expensiveWeekday = findExpensiveWeekday(prices);

        return MonthlyFlightPriceAnalysisDto.of(yearMonth.toString(), prices.size(), minPrice, maxPrice, cheapTop5AveragePrice, cheapestDates, expensiveDates, cheapestWeekday, expensiveWeekday);
    }

    private List<MonthlyFlightPriceAnalysisDto> analyzeByMonth(List<RoundTripDatePriceDto> roundTripPrices) {
        Map<YearMonth, List<RoundTripDatePriceDto>> groupedByMonth = roundTripPrices.stream()
                .collect(Collectors.groupingBy(
                        item -> YearMonth.from(item.getDepartureDate()),
                        TreeMap::new,
                        Collectors.toList()
                ));

        return groupedByMonth.entrySet().stream()
                .map(entry -> analyzeSingleMonth(entry.getKey(), entry.getValue()))
                .toList();
    }

    private BigDecimal averageTotalPrice(List<RoundTripDatePriceDto> prices) {
        if (prices.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = prices.stream()
                .map(RoundTripDatePriceDto::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(prices.size()), 0, RoundingMode.HALF_UP);
    }

    private WeekdayPriceAnalysisDto findCheapestWeekday(List<RoundTripDatePriceDto> prices) {
        return createWeekdayAnalyses(prices).stream()
                .min(Comparator.comparing(WeekdayPriceAnalysisDto::getAveragePrice))
                .orElse(null);
    }

    private WeekdayPriceAnalysisDto findExpensiveWeekday(List<RoundTripDatePriceDto> prices) {
        return createWeekdayAnalyses(prices).stream()
                .max(Comparator.comparing(WeekdayPriceAnalysisDto::getAveragePrice))
                .orElse(null);

    }

    private List<WeekdayPriceAnalysisDto> createWeekdayAnalyses(List<RoundTripDatePriceDto> prices) {
        Map<DayOfWeek, List<RoundTripDatePriceDto>> groupedByWeekday = prices.stream()
                .collect(Collectors.groupingBy(RoundTripDatePriceDto::getDayOfWeek));
        return groupedByWeekday.entrySet().stream()
                .map(entry -> toWeekdayPriceAnalysis(entry.getKey(), entry.getValue()))
                .toList();
    }

    private WeekdayPriceAnalysisDto toWeekdayPriceAnalysis(DayOfWeek dayOfWeek, List<RoundTripDatePriceDto> prices) {
        BigDecimal averagePrice = averageTotalPrice(prices);

        return WeekdayPriceAnalysisDto.of(dayOfWeek, toKoreanDayOfWeek(dayOfWeek), averagePrice, prices.size());
    }

    private String toKoreanDayOfWeek(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "월요일";
            case TUESDAY -> "화요일";
            case WEDNESDAY -> "수요일";
            case THURSDAY -> "목요일";
            case FRIDAY -> "금요일";
            case SATURDAY -> "토요일";
            case SUNDAY -> "일요일";
        };
    }

    private void validateCondition(String originAirportCode, String destinationAirportCode, LocalDate startDate, LocalDate endDate, int stayDays) {
        if (originAirportCode == null || originAirportCode.isBlank()) {
            throw new IllegalArgumentException("출발 공항 코드는 필수입니다.");
        }
        if (destinationAirportCode == null || destinationAirportCode.isBlank()) {
            throw new IllegalArgumentException("도착 공항 코드는 필수입니다.");
        }
        if (originAirportCode.equalsIgnoreCase(destinationAirportCode)) {
            throw new IllegalArgumentException("출발 공항과 도착 공항이 같을 수 없습니다.");
        }
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("시작일과 종료일은 필수입니다.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("종료일이 시작일보다 빠를 수 없습니다.");
        }
        if (stayDays < 1) {
            throw new IllegalArgumentException("여행 기간은 최소 1일 이상이어야 합니다.");
        }
    }

}
