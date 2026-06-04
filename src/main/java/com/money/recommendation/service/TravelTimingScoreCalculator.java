package com.money.recommendation.service;

import com.money.exchange.dto.MonthlyAverageRateDto;
import com.money.recommendation.dto.timing.TravelTimingScoreDto;
import com.money.recommendation.dto.flight.MonthlyFlightPriceAnalysisDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

@Component
public class TravelTimingScoreCalculator {
    private static final int FLIGHT_CHEAP_TOP5_MAX_SCORE = 55;
    private static final int FLIGHT_MIN_PRICE_MAX_SCORE = 10;
    private static final int FLIGHT_STABILITY_MAX_SCORE = 15;
    private static final int EXCHANGE_AVERAGE_RATE_MAX_SCORE = 17;
    private static final int EXCHANGE_DATA_COUNT_MAX_SCORE = 3;

    public TravelTimingScoreDto calculateScore(MonthlyFlightPriceAnalysisDto currentFlightMonth, List<MonthlyFlightPriceAnalysisDto> allFlightMonths,
                                               MonthlyAverageRateDto currentExchangeMonth, List<MonthlyAverageRateDto> allExchangeMonths) {
        validateFlightInputs(currentFlightMonth, allFlightMonths);

        int cheapTop5Score = calculateLowerIsBetterScore(currentFlightMonth.getCheapTop5AveragePrice(), findMinCheapTop5AveragePrice(allFlightMonths), findMaxCheapTop5AveragePrice(allFlightMonths), FLIGHT_CHEAP_TOP5_MAX_SCORE);
        int minPriceScore = calculateLowerIsBetterScore(currentFlightMonth.getMinRoundTripPrice(), findMinRoundTripPrice(allFlightMonths), findMaxRoundTripPrice(allFlightMonths), FLIGHT_MIN_PRICE_MAX_SCORE);
        int stabilityScore = calculateLowerIsBetterScore(calculatePriceVolatilityRate(currentFlightMonth), findMinVolatilityRate(allFlightMonths), findMaxVolatilityRate(allFlightMonths), FLIGHT_STABILITY_MAX_SCORE);
        int exchangeAverageRateScore = calculateExchangeAverageRateScore(currentExchangeMonth, allExchangeMonths);
        int exchangeDateCountScore = calculateExchangeDataCountScore(currentExchangeMonth);
        return TravelTimingScoreDto.of(cheapTop5Score, minPriceScore, stabilityScore, exchangeAverageRateScore, exchangeDateCountScore);
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

    private int calculateExchangeAverageRateScore(MonthlyAverageRateDto currentMonth, List<MonthlyAverageRateDto> allMonths) {
        if (currentMonth == null || allMonths == null || allMonths.isEmpty()) {
            return 0;
        }
        return calculateLowerIsBetterScore(currentMonth.getAverageRate(), findMinAverageRate(allMonths), findMaxAverageRate(allMonths), EXCHANGE_AVERAGE_RATE_MAX_SCORE);
    }


    private int calculateExchangeDataCountScore(MonthlyAverageRateDto currentMonth) {
        if (currentMonth == null || currentMonth.getCount() <= 0) {
            return 0;
        }
        int count = currentMonth.getCount();
        if (count >= 15) {
            return EXCHANGE_DATA_COUNT_MAX_SCORE;
        }
        if (count >= 8) {
            return 2;
        }
        return 1;
    }

    private BigDecimal findMinAverageRate(List<MonthlyAverageRateDto> months) {
        return months.stream()
                .map(MonthlyAverageRateDto::getAverageRate)
                .filter(Objects::nonNull).min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal findMaxAverageRate(List<MonthlyAverageRateDto> months) {
        return months.stream()
                .map(MonthlyAverageRateDto::getAverageRate)
                .filter(Objects::nonNull).max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }
}

