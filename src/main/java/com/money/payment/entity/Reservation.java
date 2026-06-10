package com.money.payment.entity;

import com.money.payment.enums.ReservationStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "reservation")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(nullable = false, unique = true, length = 100)
    private String reservationNumber;

    @Column(nullable = false)
    private Long outboundFlightOptionId;

    @Column(nullable = false)
    private Long returnFlightOptionId;

    @Column(nullable = false, length = 300)
    private String originAirportCode;

    @Column(nullable = false, length = 120)
    private String originAirportName;

    @Column(nullable = false, length = 120)
    private String originCityName;

    @Column(nullable = false, length = 120)
    private String destinationAirportCode;

    @Column(nullable = false, length = 120)
    private String destinationAirportName;

    @Column(nullable = false, length = 120)
    private String destinationCityName;

    @Column(nullable = false)
    private LocalDate departureDate;

    @Column(nullable = false)
    private LocalDate returnDate;

    @Column(nullable = false)
    private int adultCount;
    @Column(nullable = false)
    private int childCount;
    @Column(nullable = false)
    private int infantCount;

    @Column(nullable = false)
    private Long totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReservationStatus status;


    @Column(nullable = false, length = 100)
    private String customerName;
    @Column(nullable = false, length = 150)
    private String customerEmail;
    @Column(nullable = false, length = 100)
    private String customerPhone;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    private LocalDateTime reservedAt;
    private LocalDateTime canceledAt;


    public static Reservation create(String reservationNumber, Long outboundFlightOptionId, Long returnFlightOptionId, String originAirportCode, String originAirportName, String originCityName, String destinationAirportCode, String destinationAirportName, String destinationCityName, LocalDate departureDate, LocalDate returnDate, int adultCount, int childCount, int infantCount, Long totalAmount,String customerName, String customerEmail, String customerPhone) {
        Reservation reservation = new Reservation();
        reservation.reservationNumber = reservationNumber;
        reservation.outboundFlightOptionId = outboundFlightOptionId;
        reservation.returnFlightOptionId = returnFlightOptionId;
        reservation.originAirportCode = originAirportCode;
        reservation.originAirportName = originAirportName;
        reservation.originCityName = originCityName;
        reservation.destinationAirportCode = destinationAirportCode;
        reservation.destinationAirportName = destinationAirportName;
        reservation.destinationCityName = destinationCityName;
        reservation.departureDate = departureDate;
        reservation.returnDate =returnDate;
        reservation.adultCount = adultCount;
        reservation.childCount = childCount;
        reservation.infantCount = infantCount;
        reservation.totalAmount = totalAmount;
        reservation.customerName = customerName;
        reservation.customerEmail = customerEmail;
        reservation.customerPhone = customerPhone;
        reservation.status = ReservationStatus.READY;
        reservation.createdAt = LocalDateTime.now();
        return reservation;
    }

    public void completeReservation() {
        this.status = ReservationStatus.RESERVED;
        this.reservedAt = LocalDateTime.now();
    }

    public void cancel(){
        this.status = ReservationStatus.CANCELED;
        this.canceledAt = LocalDateTime.now();

    }

}
