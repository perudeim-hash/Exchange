package com.money.event.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class MonthlyTravelEventResponseDto {
    private final Integer month;
    private final String monthLabel;
    private final int eventCount;
    private List<TravelEventResponseDto> events;

    public MonthlyTravelEventResponseDto(Integer month, String monthLabel, int eventCount, List<TravelEventResponseDto> events) {
        this.month = month;
        this.monthLabel = monthLabel;
        this.eventCount = eventCount;
        this.events = events;
    }

    public static MonthlyTravelEventResponseDto of(Integer month, List<TravelEventResponseDto> events) {
        return new MonthlyTravelEventResponseDto(month, createMonthLabel(month), events.size(), events);
    }

    private static String createMonthLabel(Integer month) {
        if (month == null) {
            return "-";
        }
        return month + "월";
    }
}
