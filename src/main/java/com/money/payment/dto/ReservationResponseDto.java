package com.money.payment.dto;

import com.money.payment.entity.Reservation;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class ReservationResponseDto {
    private Long reservationId;
    private String reservationNumber;
    private String tripType;
    private String tripTypeDescription;

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
    private String status;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private LocalDateTime createdAt;
    private LocalDateTime reservedAt;
    private LocalDateTime canceledAt;

    private ReservationResponseDto(Long reservationId, String reservationNumber, String tripType, String tripTypeDescription, Long outboundFlightOptionId, Long returnFlightOptionId, String originAirportCode, String originAirportName, String originCityName, String destinationAirportCode, String destinationAirportName, String destinationCityName, LocalDate departureDate, LocalDate returnDate, int adultCount, int childCount, int infantCount, Long totalAmount, String status, String customerName, String customerEmail, String customerPhone, LocalDateTime createdAt, LocalDateTime reservedAt, LocalDateTime canceledAt) {
        this.reservationId = reservationId;
        this.reservationNumber = reservationNumber;
        this.tripType = tripType;
        this.tripTypeDescription = tripTypeDescription;
        this.outboundFlightOptionId = outboundFlightOptionId;
        this.returnFlightOptionId = returnFlightOptionId;
        this.originAirportCode = originAirportCode;
        this.originAirportName = originAirportName;
        this.originCityName = originCityName;
        this.destinationAirportCode = destinationAirportCode;
        this.destinationAirportName = destinationAirportName;
        this.destinationCityName = destinationCityName;
        this.departureDate = departureDate;
        this.returnDate = returnDate;
        this.adultCount = adultCount;
        this.childCount = childCount;
        this.infantCount = infantCount;
        this.totalAmount = totalAmount;
        this.status = status;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.createdAt = createdAt;
        this.reservedAt = reservedAt;
        this.canceledAt = canceledAt;
    }

    public static ReservationResponseDto from(Reservation reservation) {
        return new ReservationResponseDto(
                reservation.getId(),
                reservation.getReservationNumber(),
                reservation.getTripType().name(),
                reservation.getTripType().getDescription(),
                reservation.getOutboundFlightOptionId(),
                reservation.getReturnFlightOptionId(),
                reservation.getOriginAirportCode(),
                reservation.getOriginAirportName(),
                reservation.getOriginCityName(),
                reservation.getDestinationAirportCode(),
                reservation.getDestinationAirportName(),
                reservation.getDestinationCityName(),
                reservation.getDepartureDate(),
                reservation.getReturnDate(),
                reservation.getAdultCount(),
                reservation.getChildCount(),
                reservation.getInfantCount(),
                reservation.getTotalAmount(),
                reservation.getStatus().name(),
                reservation.getCustomerName(),
                reservation.getCustomerEmail(),
                reservation.getCustomerPhone(),
                reservation.getCreatedAt(),
                reservation.getReservedAt(),
                reservation.getCanceledAt()
        );
    }
}
