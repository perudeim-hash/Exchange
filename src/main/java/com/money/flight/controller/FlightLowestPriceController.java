package com.money.flight.controller;

import com.money.flight.dto.LowestPriceFlightResponseDto;
import com.money.flight.dto.RoundTripLowestPriceResponseDto;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import com.money.flight.service.FlightLowestPriceService;
import com.money.flight.service.FlightRoundTripLowestPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/flights")
public class FlightLowestPriceController {

    private final FlightLowestPriceService flightLowestPriceService;
    private final FlightRoundTripLowestPriceService flightRoundTripLowestPriceService;
    @GetMapping("/lowest-prices")
    public LowestPriceFlightResponseDto findLowestPriceFlights(@RequestParam String origin, @RequestParam String destination,
                                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                               @RequestParam(required = false) ConnectionType connectionType, @RequestParam(required = false) SeatClass seatClass,
                                                               @RequestParam(defaultValue = "1") int adultCount, @RequestParam(defaultValue = "0") int childCount, @RequestParam(defaultValue = "0") int infantCount,
                                                               @RequestParam(required = false) Integer limit) {
        return flightLowestPriceService.findLowestPriceFlights(origin, destination, startDate, endDate, connectionType, seatClass, adultCount, childCount, infantCount, limit);
    }


    @GetMapping("/lowest-prices/round-trip")
    public RoundTripLowestPriceResponseDto findRoundTripLowestPriceFlights(@RequestParam String origin, @RequestParam String destination,
                                                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate outboundStartDate, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate outboundEndDate,
                                                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate returnStartDate, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate returnEndDate,
                                                                           @RequestParam(required = false) ConnectionType connectionType, @RequestParam(required = false) SeatClass seatClass,
                                                                           @RequestParam(defaultValue = "1") int adultCount, @RequestParam(defaultValue = "0") int childCount, @RequestParam(defaultValue = "0") int infantCount,
                                                                           @RequestParam(required = false) Integer limit) {
        return flightRoundTripLowestPriceService.findRoundTripLowestPriceFlights(origin, destination, outboundStartDate, outboundEndDate,returnStartDate,returnEndDate, connectionType, seatClass, adultCount, childCount, infantCount, limit);
    }


}
