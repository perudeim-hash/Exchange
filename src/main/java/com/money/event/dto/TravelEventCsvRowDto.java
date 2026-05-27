package com.money.event.dto;

import com.money.event.entity.TravelEvent;
import lombok.Getter;

@Getter
public class TravelEventCsvRowDto {
    private static final int EXPECTED_COLUMN_COUNT = 12;
    private final String region;
    private final String countryCode;
    private final String countryName;
    private final String cityName;
    private final String eventArea;
    private final Integer month;
    private final String eventName;
    private final String eventType;
    private final String description;
    private final String eventUrl;
    private final Boolean enabled;
    private final Integer displayOrder;

    private TravelEventCsvRowDto(String region, String countryCode, String countryName, String cityName, String eventArea, Integer month, String eventName, String eventType, String description, String eventUrl, Boolean enabled, Integer displayOrder) {
        this.region = region;
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.cityName = cityName;
        this.eventArea = eventArea;
        this.month = month;
        this.eventName = eventName;
        this.eventType = eventType;
        this.description = description;
        this.eventUrl = eventUrl;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
    }

    public static TravelEventCsvRowDto from(String[] columns, int rowNumber) {
        validateColumnCount(columns, rowNumber);

        return new TravelEventCsvRowDto(
                clean(columns[0]),
                clean(columns[1]),
                clean(columns[2]),
                clean(columns[3]),
                clean(columns[4]),
                parseInteger(columns[5], rowNumber, "month"),
                clean(columns[6]),
                clean(columns[7]),
                clean(columns[8]),
                clean(columns[9]),
                parseBoolean(columns[10]),
                parseInteger(columns[11], rowNumber, "display_order")
        );
    }

    public TravelEvent toEntity() {
        return TravelEvent.create(region, countryCode, countryName, cityName, eventArea, month, eventName, eventType, description, eventUrl, enabled, displayOrder);
    }

    private static void validateColumnCount(String[] columns, int rowNumber) {
        if (columns.length != EXPECTED_COLUMN_COUNT) {
            throw new IllegalArgumentException(
                    rowNumber + "번째 줄의 CSV 컬럼 수가 올바르지 않다."
                            + "필요 컬럼 수: " + EXPECTED_COLUMN_COUNT
                            + ", 실제 컬럼 수: " + columns.length
            );
        }
    }

    private static String clean(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private static Integer parseInteger(String value, int rowNumber, String columns) {
        try {
            return Integer.parseInt(clean(value));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(rowNumber + " 번째 줄의 " + columns + " 값이 숫자가 아니다. e = " + e);
        }
    }

    private static Boolean parseBoolean(String value) {
        String cleanedValue = clean(value);
        if (cleanedValue.isBlank()) {
            return true;
        }
        return Boolean.parseBoolean(cleanedValue);
    }
}
