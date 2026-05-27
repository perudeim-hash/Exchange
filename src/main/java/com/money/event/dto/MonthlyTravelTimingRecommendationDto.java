package com.money.event.dto;

import com.money.recommendation.dto.RoundTripDatePriceDto;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
public class MonthlyTravelTimingRecommendationDto {
    private final String month;
    private final String monthLabel;
    private final int totalScore;
    private final String grade;
    private final TravelTimingScoreDto score;
    private final BigDecimal minRoundTripPrice;
    private final BigDecimal maxRoundTripPrice;
    private final BigDecimal cheapTop5AveragePrice;
    private final List<RoundTripDatePriceDto> cheapestDates;
    private final List<RoundTripDatePriceDto> expensiveDates;
    private final String cheapestWeekdayName;
    private final String expensiveWeekdayName;
    private final BigDecimal averageRate;
    private final int rateDateCount;
    private final int eventCount;
    private final List<TravelEventResponseDto> events;

    private MonthlyTravelTimingRecommendationDto(String month, String monthLabel, int totalScore, String grade, TravelTimingScoreDto score, BigDecimal minRoundTripPrice, BigDecimal maxRoundTripPrice, BigDecimal cheapTop5AveragePrice, List<RoundTripDatePriceDto> cheapestDates, List<RoundTripDatePriceDto> expensiveDates, String cheapestWeekdayName, String expensiveWeekdayName, BigDecimal averageRate, int rateDateCount, int eventCount, List<TravelEventResponseDto> events) {
        this.month = month;
        this.monthLabel = monthLabel;
        this.totalScore = totalScore;
        this.grade = grade;
        this.score = score;
        this.minRoundTripPrice = minRoundTripPrice;
        this.maxRoundTripPrice = maxRoundTripPrice;
        this.cheapTop5AveragePrice = cheapTop5AveragePrice;
        this.cheapestDates = cheapestDates;
        this.expensiveDates = expensiveDates;
        this.cheapestWeekdayName = cheapestWeekdayName;
        this.expensiveWeekdayName = expensiveWeekdayName;
        this.averageRate = averageRate;
        this.rateDateCount = rateDateCount;
        this.eventCount = eventCount;
        this.events = events;
    }

    public static MonthlyTravelTimingRecommendationDto of(String month, TravelTimingScoreDto score, BigDecimal minRoundTripPrice, BigDecimal maxRoundTripPrice, BigDecimal cheapTop5AveragePrice, List<RoundTripDatePriceDto> cheapestDates, List<RoundTripDatePriceDto> expensiveDates, String cheapestWeekdayName, String expensiveWeekdayName, BigDecimal averageRate, int rateDateCount, List<TravelEventResponseDto> events) {
        return new MonthlyTravelTimingRecommendationDto(month, createMonthLabel(month), score.getTotalScore(), createGrade(score.getTotalScore()), score, minRoundTripPrice, maxRoundTripPrice, cheapTop5AveragePrice, cheapestDates, expensiveDates, cheapestWeekdayName, expensiveWeekdayName, averageRate, rateDateCount, events.size(), events);
    }

    private static String createMonthLabel(String month) {
        if (month == null || month.isBlank()) {
            return "-";
        }
        String[] parts = month.split("-");

        if (parts.length != 2) {
            return month;
        }
        return parts[0] + "년 " + Integer.parseInt(parts[1]) + "월";
    }

    private static String createGrade(int totalScore) {
        if (totalScore >= 85) {
            return "매우 추천";
        }
        if (totalScore >= 70) {
            return "추천";
        }
        if (totalScore >= 55) {
            return "보통";
        }
        if (totalScore >= 40) {
            return "비용 주의";
        }
        return "비추천";
    }

}
