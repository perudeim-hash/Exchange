package com.money.flight.enums;

public enum PassengerType {
    ADULT("성인", "만 18세 이상"),
    CHILD("소아", "만 2세 ~ 17세"),
    INFANT("유아", "만 2세 미만");

    private final String description;
    private final String ageDescription;


    PassengerType(String description, String ageDescription) {
        this.description = description;
        this.ageDescription = ageDescription;
    }

    public String getDescription() {
        return description;
    }

    public String getAgeDescription() {
        return ageDescription;
    }
}
