package com.money.flight.enums;

public enum RouteConnectionPolicy {
    DIRECT_ONLY("직항만 가능"),
    DIRECT_AND_ONE_STOP("직항 또는 1회 경유 가능"),
    ONE_STOP_ONLY("1회 경유만 가능");

    private final String description;

    RouteConnectionPolicy(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

}
