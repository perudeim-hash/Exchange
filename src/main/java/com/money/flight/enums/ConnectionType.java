package com.money.flight.enums;

public enum ConnectionType {
    DIRECT("직항"),
    ONE_STOP("1회 경유");

    private final String description;

    ConnectionType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
