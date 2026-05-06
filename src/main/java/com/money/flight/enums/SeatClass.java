package com.money.flight.enums;

public enum SeatClass {
    ECONOMY("이코노미"),
    PREMIUM_ECONOMY("프리미엄 이코노미"),
    BUSINESS("비즈니스"),
    FIRST("퍼스트"),
    EXTRA_LEGROOM("넓은 좌석");

    private final String description;


    SeatClass(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
