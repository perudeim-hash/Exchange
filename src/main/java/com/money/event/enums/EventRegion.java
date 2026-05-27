package com.money.event.enums;

public enum EventRegion {
    ASIA("ASIA", "data/event/asia/asia_monthly_events_seed_v1.csv"),
    EUROPE("EUROPE", "data/event/europe/europe_monthly_events_seed_v1.csv"),
    OCEANIA("OCEANIA", "data/event/oceania/oceania_monthly_events_seed_v1.csv"),
    NORTH_AMERICA("NORTH_AMERICA", "data/event/north-america/north_america_monthly_events_seed_v1.csv"),
    MIDDLE_EAST("MIDDLE_EAST", "data/event/middle-east/middle_east_monthly_events_seed_v1.csv");

    private final String code;
    private final String csvPath;

    EventRegion(String code, String csvPath) {
        this.code = code;
        this.csvPath = csvPath;
    }

    public String getCode() {
        return code;
    }

    public String getCsvPath() {
        return csvPath;
    }

    public static EventRegion from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("대륙 값은 필수입니다.");
        }
        String normalizedValue = value.trim().toUpperCase().replace("-", "_");
        for (EventRegion region : EventRegion.values()) {
            if (region.name().equals(normalizedValue) || region.getClass().equals(normalizedValue)) {
                return region;
            }
        }
        throw new IllegalArgumentException("지원하지 않는 대륙입니다. value = " + value);
    }
}
