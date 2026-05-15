package com.money.flight.enums;

public enum TripType {
    ONE_WAY("편도"),
    ROUND_TRIP("왕복");

    private final String description;

    TripType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
