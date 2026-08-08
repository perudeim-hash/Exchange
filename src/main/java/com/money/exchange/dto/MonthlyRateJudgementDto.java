package com.money.exchange.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

@Getter
@RequiredArgsConstructor
public class MonthlyRateJudgementDto {
    private final String month;
    private final BigDecimal averageRate;
    private final int count;
    private final BigDecimal advantagePercent;
    private final String status;
    private final String statusLabel;
    private final String summaryText;

    public static MonthlyRateJudgementDto of(String month, BigDecimal averageRate, int count, BigDecimal advantagePercent, String status, String statusLabel, String summaryText) {
        return new MonthlyRateJudgementDto(month, averageRate, count, advantagePercent, status, statusLabel, summaryText);
    }
}
