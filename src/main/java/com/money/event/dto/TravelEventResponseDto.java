package com.money.event.dto;

import com.money.event.entity.TravelEvent;
import lombok.Getter;

@Getter
public class TravelEventResponseDto {
    private final String region;
    private final String countryCode;
    private final String countryName;
    private final String cityName;
    private final String eventArea;
    private final Integer month;
    private final String monthLabel;
    private final String eventName;
    private final String eventType;
    private final String description;
    private final String eventUrl;
    private final Integer displayOrder;

    public TravelEventResponseDto( String region, String countryCode, String countryName, String cityName, String eventArea, Integer month, String monthLabel, String eventName, String eventType, String description, String eventUrl, Integer displayOrder) {
        this.region = region;
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.cityName = cityName;
        this.eventArea = eventArea;
        this.month = month;
        this.monthLabel = monthLabel;
        this.eventName = eventName;
        this.eventType = eventType;
        this.description = description;
        this.eventUrl = eventUrl;
        this.displayOrder = displayOrder;
    }

    public static TravelEventResponseDto from(TravelEvent event){
        return new TravelEventResponseDto(event.getRegion(), event.getCountryCode(), event.getCountryName(), event.getCityName(), event.getEventArea(), event.getMonth(), createMonthLabel(event.getMonth()), event.getEventName(), event.getEventType(), event.getDescription(), event.getEventUrl(), event.getDisplayOrder());
    }

    private static String createMonthLabel(Integer month) {
        if (month == null) {
            return "-";
        }
        return month + "월";
    }
}
