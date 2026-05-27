package com.money.event.service;

import com.money.event.dto.TravelTimingScoreDto;
import com.money.recommendation.dto.MonthlyFlightPriceAnalysisDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

@Component
public class TravelTimingScoreCalculator {
    private static final int FLIGHT_CHEAP_TOP5_MAX_SCORE = 50;
    private static final int FLIGHT_MIN_PRICE_MAX_SCORE = 10;
    private static final int FLIGHT_STABILITY_MAX_SCORE = 15;
    private static final int EXCHANGE_AVERAGE_RATE_MAX_SCORE = 12;
    private static final int EXCHANGE_DATA_COUNT_MAX_SCORE = 3;
    private static final int EVENT_REPRESENTATIVE_MAX_SCORE = 6;
    private static final int EVENT_COUNT_MAX_SCORE = 4;

    public TravelTimingScoreDto calculateFlightOnlyScore(MonthlyFlightPriceAnalysisDto currentMonth, List<MonthlyFlightPriceAnalysisDto> allMonths) {
        validateFlightInputs(currentMonth, allMonths);

        int cheapTop5Score = calculateLowerIsBetterScore(currentMonth.getCheapTop5AveragePrice(), findMinCheapTop5AveragePrice(allMonths), findMaxCheapTop5AveragePrice(allMonths), FLIGHT_CHEAP_TOP5_MAX_SCORE);
        int minPriceScore = calculateLowerIsBetterScore(currentMonth.getMinRoundTripPrice(), findMinRoundTripPrice(allMonths), findMaxRoundTripPrice(allMonths), FLIGHT_MIN_PRICE_MAX_SCORE);
        int stabilityScore = calculateLowerIsBetterScore(calculatePriceVolatilityRate(currentMonth), findMinVolatilityRate(allMonths), findMaxVolatilityRate(allMonths), FLIGHT_STABILITY_MAX_SCORE);
        return TravelTimingScoreDto.of(cheapTop5Score, minPriceScore, stabilityScore, 0, 0, 0, 0);
    }

    private int calculateLowerIsBetterScore(BigDecimal currentValue, BigDecimal minValue, BigDecimal maxValue, int maxScore) {
        if (currentValue == null || minValue == null || maxValue == null) {
            return 0;
        }
        if (maxScore <= 0) {
            return 0;
        }
        if (maxValue.compareTo(minValue) == 0) {
            return maxScore;
        }
        BigDecimal numerator = maxValue.subtract(currentValue);
        BigDecimal denominator = maxValue.subtract(minValue);
        BigDecimal ratio = numerator.divide(denominator, 6, RoundingMode.HALF_UP);

        if (ratio.compareTo(BigDecimal.ZERO) < 0) {
            ratio = BigDecimal.ZERO;
        }
        if (ratio.compareTo(BigDecimal.ONE) > 0) {
            ratio = BigDecimal.ONE;
        }
        return ratio.multiply(BigDecimal.valueOf(maxScore))
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();


    }

    private BigDecimal calculatePriceVolatilityRate(MonthlyFlightPriceAnalysisDto month) {
        BigDecimal minPrice = month.getMinRoundTripPrice();
        BigDecimal maxPrice = month.getMaxRoundTripPrice();
        if (minPrice == null || maxPrice == null) {
            return BigDecimal.ZERO;
        }
        if (minPrice.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return maxPrice.subtract(minPrice)
                .divide(minPrice, 6, RoundingMode.HALF_UP);
    }

    private BigDecimal findMinCheapTop5AveragePrice(List<MonthlyFlightPriceAnalysisDto> month) {
        return month.stream()
                .map(MonthlyFlightPriceAnalysisDto::getCheapTop5AveragePrice)
                .filter(Objects::nonNull).min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal findMaxCheapTop5AveragePrice(List<MonthlyFlightPriceAnalysisDto> month) {
        return month.stream()
                .map(MonthlyFlightPriceAnalysisDto::getCheapTop5AveragePrice)
                .filter(Objects::nonNull).max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal findMinRoundTripPrice(List<MonthlyFlightPriceAnalysisDto> month) {
        return month.stream()
                .map(MonthlyFlightPriceAnalysisDto::getMinRoundTripPrice)
                .filter(Objects::nonNull).min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal findMaxRoundTripPrice(List<MonthlyFlightPriceAnalysisDto> month) {
        return month.stream()
                .map(MonthlyFlightPriceAnalysisDto::getMinRoundTripPrice)
                .filter(Objects::nonNull).max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal findMinVolatilityRate(List<MonthlyFlightPriceAnalysisDto> month) {
        return month.stream()
                .map(this::calculatePriceVolatilityRate)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal findMaxVolatilityRate(List<MonthlyFlightPriceAnalysisDto> month) {
        return month.stream()
                .map(this::calculatePriceVolatilityRate)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }
    private void validateFlightInputs(MonthlyFlightPriceAnalysisDto currentMonth, List<MonthlyFlightPriceAnalysisDto> allMonths) {
        if (currentMonth == null) {
            throw new IllegalArgumentException("현재 월 항공권 분석 결과는 필수입니다.");
        }
        if (allMonths == null || allMonths.isEmpty()) {
            throw new IllegalArgumentException("전체 월 항공권 분석 결과는 필수입니다.");

        }
    }

}

