package com.money.flight.enums;

public enum FlightSortType {
    PRICE_ASC("최저가순"),
    DURATION_ASC("최단시간순"),
    DEPARTURE_ASC("출발시간순");

    private final String description;

    FlightSortType(String description) {
        this.description = description;
    }

    public String getDescription(){
        return description;
    }
}
