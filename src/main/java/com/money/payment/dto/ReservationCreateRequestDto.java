package com.money.payment.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ReservationCreateRequestDto {
    private Long outboundFlightOptionId;
    private Long returnFlightOptionId;
    private String originAirportCode;
    private String originAirportName;
    private String originCityName;
    private String destinationAirportCode;
    private String destinationAirportName;
    private String destinationCityName;
    private LocalDate departureDate;
    private LocalDate returnDate;
    private int adultCount;
    private int childCount;
    private int infantCount;
    private Long totalAmount;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

}
