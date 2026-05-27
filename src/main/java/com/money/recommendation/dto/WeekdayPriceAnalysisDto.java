package com.money.recommendation.dto;

import lombok.Getter;

import java.math.BigDecimal;
import java.time.DayOfWeek;

@Getter
public class WeekdayPriceAnalysisDto {
    private final DayOfWeek dayOfWeek;
    private final String dayOfWeekName;
    private final BigDecimal averagePrice;
    private final int count;

    public WeekdayPriceAnalysisDto(DayOfWeek dayOfWeek, String dayOfWeekName, BigDecimal averagePrice, int count) {
        this.dayOfWeek = dayOfWeek;
        this.dayOfWeekName = dayOfWeekName;
        this.averagePrice = averagePrice;
        this.count = count;
    }

    public static WeekdayPriceAnalysisDto of(DayOfWeek dayOfWeek, String dayOfWeekName, BigDecimal averagePrice, int count) {
        return new WeekdayPriceAnalysisDto(dayOfWeek, dayOfWeekName, averagePrice, count);
    }



}
