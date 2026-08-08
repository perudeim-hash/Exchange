package com.money.exchange.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@RequiredArgsConstructor
public class RateHistoryAnalysisResponseDto {

    private final String currencyCode;
    private final LocalDate fromDate;
    private final LocalDate toDate;
    private final int totalCount;
    private final RateSummaryDto latestRate;
    private final RateSummaryDto maxRate;
    private final RateSummaryDto minRate;

    private final BigDecimal periodAverageRate;
    private final RateJudgementDto currentJudgement;


    private final MonthlyAverageRateDto lowestMonth;
    private final MonthlyAverageRateDto highestMonth;
    private final List<MonthlyAverageRateDto> monthlyAverages;

    private final List<MonthlyRateJudgementDto> monthlyJudgements;
    private final List<RateChartPointDto> chartPoints;

    private final List<RateHistoryResponseDto> histories;


    public static RateHistoryAnalysisResponseDto of(String currencyCode, LocalDate fromDate, LocalDate toDate, int totalCount, RateSummaryDto latestRate, RateSummaryDto maxRate, RateSummaryDto minRate, BigDecimal periodAverageRate, RateJudgementDto currentJudgement, MonthlyAverageRateDto lowestMonth, MonthlyAverageRateDto highestMonth, List<MonthlyAverageRateDto> monthlyAverages, List<MonthlyRateJudgementDto> monthlyJudgements, List<RateChartPointDto> chartPoints, List<RateHistoryResponseDto> histories) {
        return new RateHistoryAnalysisResponseDto(currencyCode, fromDate, toDate, totalCount, latestRate, maxRate, minRate, periodAverageRate, currentJudgement, lowestMonth, highestMonth, monthlyAverages, monthlyJudgements, chartPoints, histories);
    }

    public static RateHistoryAnalysisResponseDto empty(String currencyCode) {
        return new RateHistoryAnalysisResponseDto(currencyCode, null, null, 0, null, null, null, BigDecimal.ZERO, RateJudgementDto.empty(), null, null, List.of(), List.of(), List.of(), List.of());
    }


}
