package com.money.recommendation.service;

import com.money.event.dto.MonthlyTravelEventResponseDto;
import com.money.event.dto.TravelEventCalendarResponseDto;
import com.money.event.dto.TravelEventResponseDto;
import com.money.event.service.TravelEventQueryService;
import com.money.exchange.dto.MonthlyAverageRateDto;
import com.money.exchange.dto.RateHistoryAnalysisResponseDto;
import com.money.exchange.service.ExchangeRateAnalysisService;
import com.money.flight.entity.Airport;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import com.money.flight.repository.AirportRepository;
import com.money.recommendation.dto.flight.FlightPriceAnalysisResponseDto;
import com.money.recommendation.dto.flight.MonthlyFlightPriceAnalysisDto;
import com.money.recommendation.dto.timing.MonthlyTravelTimingRecommendationDto;
import com.money.recommendation.dto.timing.TravelTimingRecommendationResponseDto;
import com.money.recommendation.dto.timing.TravelTimingScoreDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TravelTimingRecommendationService {
    private static final int TOP_MONTH_LIMIT = 3;
    private final AirportRepository airportRepository;
    private final FlightPriceAnalysisService flightPriceAnalysisService;
    private final ExchangeRateAnalysisService exchangeRateAnalysisService;
    private final TravelEventQueryService travelEventQueryService;
    private final TravelTimingScoreCalculator travelTimingScoreCalculator;

    public TravelTimingRecommendationResponseDto recommendTravelTiming(String originAirportCode, String destinationAirportCode, LocalDate startDate, LocalDate endDate, int stayDays, ConnectionType connectionType, SeatClass seatClass, int adultCount, int childCount, int infantCount) {
        Airport destinationAirport = getAirportByCode(destinationAirportCode);

        String countryCode = destinationAirport.getCountry().getCode();
        String countryName = destinationAirport.getCountry().getName();
        String cityName = destinationAirport.getCityName();
        String currencyCode = destinationAirport.getCountry().getCurrency().getCode();

        FlightPriceAnalysisResponseDto flightAnalysis = flightPriceAnalysisService.analyzeRoundTripPrices(originAirportCode, destinationAirportCode, startDate, endDate, stayDays, connectionType, seatClass, adultCount, childCount, infantCount);

        RateHistoryAnalysisResponseDto exchangeAnalysis = exchangeRateAnalysisService.getAnalysis(currencyCode, startDate, endDate, null);

        TravelEventCalendarResponseDto eventCalendar = travelEventQueryService.getMonthlyEventsByAirportCode(destinationAirportCode);

        List<MonthlyTravelTimingRecommendationDto> monthlyAnalyses = createMonthlyAnalyses(flightAnalysis.getMonthlyAnalyses(), exchangeAnalysis.getMonthlyAverages(), eventCalendar.getMonthlyEvents());

        List<MonthlyTravelTimingRecommendationDto> recommendedMonths = monthlyAnalyses.stream()
                .sorted(Comparator.comparing(MonthlyTravelTimingRecommendationDto::getTotalScore).reversed())
                .limit(TOP_MONTH_LIMIT)
                .toList();

        List<MonthlyTravelTimingRecommendationDto> expensiveMonths = monthlyAnalyses.stream()
                .sorted(Comparator.comparing(MonthlyTravelTimingRecommendationDto::getTotalScore))
                .limit(TOP_MONTH_LIMIT)
                .toList();

        return TravelTimingRecommendationResponseDto.of(originAirportCode, destinationAirportCode, countryCode, countryName, cityName, startDate, endDate, recommendedMonths, expensiveMonths, monthlyAnalyses);

    }


    private List<MonthlyTravelTimingRecommendationDto> createMonthlyAnalyses(List<MonthlyFlightPriceAnalysisDto> flightMonths, List<MonthlyAverageRateDto> exchangeMonths, List<MonthlyTravelEventResponseDto> eventMonths) {
        Map<String, MonthlyAverageRateDto> exchangeMonthMap = exchangeMonths.stream()
                .collect(Collectors.toMap(MonthlyAverageRateDto::getMonth, month -> month));

        Map<Integer, MonthlyTravelEventResponseDto> eventMonthMap = eventMonths.stream()
                .collect(Collectors.toMap(MonthlyTravelEventResponseDto::getMonth, month -> month));
        return flightMonths.stream().map(flightMonth -> createMonthlyAnalysis(
                flightMonth, flightMonths, exchangeMonthMap, exchangeMonths, eventMonthMap)).toList();
    }

    private MonthlyTravelTimingRecommendationDto createMonthlyAnalysis(MonthlyFlightPriceAnalysisDto flightMonth, List<MonthlyFlightPriceAnalysisDto> allFlightMonths, Map<String, MonthlyAverageRateDto> exchangeMonthMap, List<MonthlyAverageRateDto> allExchangeMonths, Map<Integer, MonthlyTravelEventResponseDto> eventMonthMap) {
        String month = flightMonth.getMonth();
        MonthlyAverageRateDto exchangeMonth = exchangeMonthMap.get(month);
        int monthValue = extractMonthValue(month);

        MonthlyTravelEventResponseDto eventMonth = eventMonthMap.get(monthValue);

        TravelTimingScoreDto score = travelTimingScoreCalculator.calculateScore(flightMonth, allFlightMonths, exchangeMonth, allExchangeMonths);

        List<TravelEventResponseDto> events = eventMonth == null ? List.of() : eventMonth.getEvents();

        return MonthlyTravelTimingRecommendationDto.of(month, score, flightMonth.getMinRoundTripPrice(), flightMonth.getMaxRoundTripPrice(), flightMonth.getCheapTop5AveragePrice(), flightMonth.getCheapestDates(), flightMonth.getExpensiveDates(), getCheapestWeekdayName(flightMonth), getExpensiveWeekdayName(flightMonth), exchangeMonth == null ? null : exchangeMonth.getAverageRate(), exchangeMonth == null ? 0 : exchangeMonth.getCount(), events);


    }

    private String getCheapestWeekdayName(MonthlyFlightPriceAnalysisDto flightMonth) {
        if (flightMonth.getCheapestWeekday() == null) {
            return "-";
        }

        return flightMonth.getCheapestWeekday().getDayOfWeekName();
    }

    private String getExpensiveWeekdayName(MonthlyFlightPriceAnalysisDto flightMonth) {
        if (flightMonth.getExpensiveWeekday() == null) {
            return "-";
        }

        return flightMonth.getExpensiveWeekday().getDayOfWeekName();
    }

    private int extractMonthValue(String month) {
        if (month == null || month.isBlank()) {
            throw new IllegalArgumentException("월 정보는 필수입니다.");
        }
        return YearMonth.parse(month).getMonthValue();
    }


    private Airport getAirportByCode(String airportCode) {
        if (airportCode == null || airportCode.isBlank()) {
            throw new IllegalArgumentException("공항 코드는 필수입니다.");
        }
        String normalizedAirportCode = airportCode.trim().toUpperCase();
        return airportRepository.findByCode(normalizedAirportCode)
                .orElseThrow(() -> new IllegalArgumentException("해당 공항을 찾을 수 없습니다."));
    }
}
