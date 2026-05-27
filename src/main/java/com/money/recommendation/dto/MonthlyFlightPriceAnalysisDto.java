package com.money.recommendation.dto;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
public class MonthlyFlightPriceAnalysisDto {
    private final String month;
    private final int availableDateCount;
    private final BigDecimal minRoundTripPrice;
    private final BigDecimal maxRoundTripPrice;
    private final BigDecimal cheapTop5AveragePrice;
    private final List<RoundTripDatePriceDto> cheapestDates;
    private final List<RoundTripDatePriceDto> expensiveDates;
    private final WeekdayPriceAnalysisDto cheapestWeekday;
    private final WeekdayPriceAnalysisDto expensiveWeekday;

    public MonthlyFlightPriceAnalysisDto(String month, int availableDateCount, BigDecimal minRoundTripPrice, BigDecimal maxRoundTripPrice, BigDecimal cheapTop5AveragePrice, List<RoundTripDatePriceDto> cheapestDates, List<RoundTripDatePriceDto> expensiveDates, WeekdayPriceAnalysisDto cheapestWeekday, WeekdayPriceAnalysisDto expensiveWeekday) {
        this.month = month;
        this.availableDateCount = availableDateCount;
        this.minRoundTripPrice = minRoundTripPrice;
        this.maxRoundTripPrice = maxRoundTripPrice;
        this.cheapTop5AveragePrice = cheapTop5AveragePrice;
        this.cheapestDates = cheapestDates;
        this.expensiveDates = expensiveDates;
        this.cheapestWeekday = cheapestWeekday;
        this.expensiveWeekday = expensiveWeekday;
    }

    public static MonthlyFlightPriceAnalysisDto of(String month, int availableDateCount, BigDecimal minRoundTripPrice, BigDecimal maxRoundTripPrice, BigDecimal cheapTop3AveragePrice, List<RoundTripDatePriceDto> cheapestDates, List<RoundTripDatePriceDto> expensiveDates, WeekdayPriceAnalysisDto cheapestWeekday, WeekdayPriceAnalysisDto expensiveWeekday) {
        return new MonthlyFlightPriceAnalysisDto(month, availableDateCount, minRoundTripPrice, maxRoundTripPrice, cheapTop3AveragePrice, cheapestDates, expensiveDates, cheapestWeekday, expensiveWeekday);
    }
}
