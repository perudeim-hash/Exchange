package com.money.payment.dto;

import com.money.payment.entity.Reservation;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class ReservationResponseDto {
    private final Long reservationId;
    private final String reservationNumber;
    private final Long outboundFlightOptionId;
    private final Long returnFlightOptionId;
    private final String originAirportCode;
    private final String originAirportName;
    private final String originCityName;
    private final String destinationAirportCode;
    private final String destinationAirportName;
    private final String destinationCityName;
    private final LocalDate departureDate;
    private final LocalDate returnDate;
    private final int adultCount;
    private final int childCount;
    private final int infantCount;
    private final Long totalAmount;
    private final String status;
    private final String customerName;
    private final String customerEmail;
    private final String customerPhone;
    private final LocalDateTime createdAt;
    private final LocalDateTime reservedAt;
    private final LocalDateTime canceledAt;

    private ReservationResponseDto(Long reservationId, String reservationNumber, Long outboundFlightOptionId, Long returnFlightOptionId, String originAirportCode, String originAirportName, String originCityName, String destinationAirportCode, String destinationAirportName, String destinationCityName, LocalDate departureDate, LocalDate returnDate, int adultCount, int childCount, int infantCount, Long totalAmount, String status, String customerName, String customerEmail, String customerPhone, LocalDateTime createdAt, LocalDateTime reservedAt, LocalDateTime canceledAt) {
        this.reservationId = reservationId;
        this.reservationNumber = reservationNumber;
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
