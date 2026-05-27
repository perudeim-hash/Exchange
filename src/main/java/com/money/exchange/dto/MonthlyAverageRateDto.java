package com.money.exchange.dto;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class MonthlyAverageRateDto {
    private final String month;
    private final BigDecimal averageRate;
    private final  int count;

    public MonthlyAverageRateDto(String month, BigDecimal averageRate, int count) {
        this.month = month;
        this.averageRate = averageRate;
        this.count = count;
    }

    public static MonthlyAverageRateDto of(String month, BigDecimal averageRate, int count) {
        return new MonthlyAverageRateDto(month, averageRate, count);
    }
}
