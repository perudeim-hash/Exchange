package com.money.flight.dto;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class PassengerFareDto {
    private final int adultCount;
    private final int childCount;
    private final int infantCount;

    private final BigDecimal adultUnitPrice;
    private final BigDecimal childUnitPrice;
    private final BigDecimal infantUnitPrice;

    private final BigDecimal adultTotalPrice;
    private final BigDecimal childTotalPrice;
    private final BigDecimal infantTotalPrice;

    private final BigDecimal totalPrice;
    private final String passengerSummary;

    public PassengerFareDto(int adultCount, int childCount, int infantCount, BigDecimal adultUnitPrice, BigDecimal childUnitPrice, BigDecimal infantUnitPrice, BigDecimal adultTotalPrice, BigDecimal childTotalPrice, BigDecimal infantTotalPrice, BigDecimal totalPrice, String passengerSummary) {
        this.adultCount = adultCount;
        this.childCount = childCount;
        this.infantCount = infantCount;
        this.adultUnitPrice = adultUnitPrice;
        this.childUnitPrice = childUnitPrice;
        this.infantUnitPrice = infantUnitPrice;
        this.adultTotalPrice = adultTotalPrice;
        this.childTotalPrice = childTotalPrice;
        this.infantTotalPrice = infantTotalPrice;
        this.totalPrice = totalPrice;
        this.passengerSummary = passengerSummary;
    }


}
