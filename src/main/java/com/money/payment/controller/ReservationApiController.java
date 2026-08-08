package com.money.payment.controller;

import com.money.payment.dto.ReservationCreateRequestDto;
import com.money.payment.dto.ReservationResponseDto;
import com.money.payment.entity.Reservation;
import com.money.payment.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reservations")
public class ReservationApiController {
    private final ReservationService reservationService;

    @PostMapping
    public ReservationResponseDto createReservation(@RequestBody ReservationCreateRequestDto request) {
        Reservation reservation = reservationService.createReservation(request);
        return ReservationResponseDto.from(reservation);
    }

    @GetMapping("/{reservationId}")
    public ReservationResponseDto getReservation(@PathVariable Long reservationId) {
        Reservation reservation = reservationService.getReservation(reservationId);
        return ReservationResponseDto.from(reservation);
    }

    @GetMapping("/number/{reservationNumber}")
    public ReservationResponseDto getReservationByReservationNumber(@PathVariable String reservationNumber) {
        Reservation reservation = reservationService.getReservationByReservationNumber(reservationNumber);
        return ReservationResponseDto.from(reservation);
    }

    @PostMapping("/{reservationId}/cancel")
    public ReservationResponseDto cancelReservation(@PathVariable Long reservationId) {
        Reservation reservation = reservationService.cancelReservation(reservationId);
        return ReservationResponseDto.from(reservation);
    }




}
