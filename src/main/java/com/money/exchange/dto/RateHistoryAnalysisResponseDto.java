package com.money.exchange.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class RateHistoryAnalysisResponseDto {

    private final String currencyCode;
    private final LocalDate fromDate;
    private final LocalDate toDate;
    private final int totalCount;
    private final RateSummaryDto latestRate;
    private final RateSummaryDto maxRate;
    private final RateSummaryDto minRate;
    private final MonthlyAverageRateDto lowestMonth;
    private final MonthlyAverageRateDto highestMonth;
    private final List<MonthlyAverageRateDto> monthlyAverages;
    private final List<RateHistoryResponseDto> histories;

    public RateHistoryAnalysisResponseDto(String currencyCode, LocalDate fromDate, LocalDate toDate, int totalCount, RateSummaryDto latestRate, RateSummaryDto maxRate, RateSummaryDto minRate, MonthlyAverageRateDto lowestMonth, MonthlyAverageRateDto highestMonth, List<MonthlyAverageRateDto> monthlyAverages, List<RateHistoryResponseDto> histories) {
        this.currencyCode = currencyCode;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.totalCount = totalCount;
        this.latestRate = latestRate;
        this.maxRate = maxRate;
        this.minRate = minRate;
        this.lowestMonth = lowestMonth;
        this.highestMonth = highestMonth;
        this.monthlyAverages = monthlyAverages;
        this.histories = histories;
    }

    public static RateHistoryAnalysisResponseDto of(String currencyCode, LocalDate fromDate, LocalDate toDate, int totalCount, RateSummaryDto latestRate, RateSummaryDto maxRate, RateSummaryDto minRate, MonthlyAverageRateDto lowestMonth, MonthlyAverageRateDto highestMonth, List<MonthlyAverageRateDto> monthlyAverages, List<RateHistoryResponseDto> histories) {
        return new RateHistoryAnalysisResponseDto(
                currencyCode, fromDate, toDate, totalCount, latestRate, maxRate, minRate, lowestMonth, highestMonth, monthlyAverages, histories);
    }

    public static RateHistoryAnalysisResponseDto empty(String currencyCode) {
        return new RateHistoryAnalysisResponseDto(currencyCode, null, null, 0, null, null, null, null, null, List.of(), List.of());
    }


}
