package com.money.flight.enums;

public enum AirlineTier {
    PREMIUM("고가 항공사"),
    STANDARD("중자 항공사"),
    LOW_COST("저가 항공사");

    private final String description;

    AirlineTier(String description) {
        this.description = description;
    }

    public String getDescription(){
        return description;
    }

}
