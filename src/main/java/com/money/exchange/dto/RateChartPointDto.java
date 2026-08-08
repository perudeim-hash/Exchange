package com.money.exchange.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@RequiredArgsConstructor
public class RateChartPointDto {

    private final LocalDate rateDate;
    private final BigDecimal rate;
    private final BigDecimal advantagePercent;
    private final String status;
    private final String statusLabel;

    public static RateChartPointDto of(LocalDate rateDate, BigDecimal rate, BigDecimal advantagePercent, String status, String statusLabel) {
        return new RateChartPointDto(rateDate, rate, advantagePercent, status, statusLabel);
    }

}
