package com.money.event.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class TravelEventCalendarResponseDto {
    private final String airportCode;
    private final String countryCode;
    private final String countryName;
    private final String cityName;
    private final int totalEventCount;
    private final List<MonthlyTravelEventResponseDto> monthlyEvents;

    public TravelEventCalendarResponseDto(String airportCode, String countryCode, String countryName, String cityName, int totalEventCount, List<MonthlyTravelEventResponseDto> monthlyEvents) {
        this.airportCode = airportCode;
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.cityName = cityName;
        this.totalEventCount = totalEventCount;
        this.monthlyEvents = monthlyEvents;
    }

    public static TravelEventCalendarResponseDto of(String airportCode, String countryCode, String countryName, String cityName, List<MonthlyTravelEventResponseDto> monthlyEvents) {
        int totalEventCount = monthlyEvents.stream()
                .mapToInt(MonthlyTravelEventResponseDto::getEventCount)
                .sum();
        return new TravelEventCalendarResponseDto(airportCode, countryCode, countryName, cityName, totalEventCount, monthlyEvents);
    }

}
