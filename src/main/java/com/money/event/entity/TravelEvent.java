package com.money.event.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "travel_event",
        indexes = {
                @Index(name = "idx_travel_event_region", columnList = "region"),
                @Index(name = "idx_travel_event_country_city", columnList = "country_code, city_name"),
                @Index(name = "idx_travel_event_month", columnList = "month"),
                @Index(name = "idx_travel_event_enabled", columnList = "enabled"),
                @Index(name = "idx_travel_event_display_order", columnList = "display_order")
        })
public class TravelEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String region;

    @Column(name = "country_code", nullable = false, length = 10)
    private String countryCode;

    @Column(name = "country_name", nullable = false, length = 50)
    private String countryName;

    @Column(name = "city_name", nullable = false, length = 100)
    private String cityName;

    @Column(name = "event_area", nullable = false, length = 150)
    private String eventArea;

    @Column(nullable = false)
    private Integer month;

    @Column(name = "event_name", nullable = false, length = 200)
    private String eventName;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "event_url", length = 1000)
    private String eventUrl;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    public TravelEvent(String region, String countryCode, String countryName, String cityName, String eventArea, Integer month, String eventName, String eventType, String description, String eventUrl, Boolean enabled, Integer displayOrder) {
        validateText(region, "대륙 정보는 필수입니다.");
        validateText(countryCode, "국가 코드는 필수입니다.");
        validateText(countryName, "국가명은 필수입니다.");
        validateText(cityName, "도시명은 필수입니다.");
        validateMonth(month);
        validateText(eventName, "행사명은 필수입니다.");
        validateDisplayOrder(displayOrder);

        this.region = region;
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.cityName = cityName;
        this.eventArea = isBlank(eventArea) ? cityName : eventArea;
        this.month = month;
        this.eventName = eventName;
        this.eventType = isBlank(eventType) ? "FESTIVAL" : eventType;
        this.description = isBlank(description) ? "" : description;
        this.eventUrl = eventUrl;
        this.enabled = enabled != null ? enabled : true;
        this.displayOrder = displayOrder;
    }



    public static TravelEvent create(String region, String countryCode, String countryName, String cityName, String eventArea, Integer month, String eventName, String eventType, String description, String eventUrl, Boolean enabled, Integer displayOrder) {
        return new TravelEvent(region, countryCode, countryName, cityName, eventArea, month, eventName, eventType, description, eventUrl, enabled, displayOrder);
    }
    public void enable(){
        this.enabled = true;
    }
    public void disable(){
        this.enabled = false;
    }

    private void validateText(String value,String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
    private void validateMonth(Integer month) {
        if (month == null || month < 1  || month > 12) {
            throw new IllegalArgumentException("행사 월은 1월부터 12월까지만 가능합니다.");
        }
    }

    private void validateDisplayOrder(Integer displayOrder) {
        if (displayOrder == null || displayOrder < 1 ) {
            throw new IllegalArgumentException("정렬 순서는 1 이상이어야 합니다.");
        }
    }

    private static boolean isBlank(String value){
        return value == null || value.isBlank();
    }

}
