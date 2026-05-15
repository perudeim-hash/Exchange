package com.money.flight.controller;

import com.money.flight.dto.FlightSearchResponseDto;
import com.money.flight.dto.RoundTripFlightSearchResponseDto;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.FlightSortType;
import com.money.flight.enums.SeatClass;
import com.money.flight.service.FlightSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightSearchController {
    private final FlightSearchService flightSearchService;

    @GetMapping("/search")
    public FlightSearchResponseDto searchFlights(@RequestParam String origin, @RequestParam String destination,
                                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate departureDate, @RequestParam(required = false) ConnectionType connectionType,
                                                 @RequestParam(required = false) SeatClass seatClass, @RequestParam(required = false) FlightSortType sort,
                                                 @RequestParam(defaultValue = "1") int adultCount, @RequestParam(defaultValue = "0") int childCount, @RequestParam(defaultValue = "0") int infantCount) {

        return flightSearchService.searchFlights(origin, destination, departureDate, connectionType, seatClass, sort, adultCount, childCount, infantCount);
    }

    @GetMapping("/search/round-trip")
    public RoundTripFlightSearchResponseDto searchResponseTripFlights(
            @RequestParam String origin, @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate departureDate, @RequestParam(required = false) LocalDate returnDate,
            @RequestParam(required = false) ConnectionType connectionType,
            @RequestParam(required = false) SeatClass seatClass,
            @RequestParam(required = false) FlightSortType sort,
            @RequestParam(defaultValue = "1") int adultCount,
            @RequestParam(defaultValue = "0") int childCount,
            @RequestParam(defaultValue = "0") int infantCount) {
        return flightSearchService.searchRoundTripFlights(origin, destination,
                departureDate, returnDate, connectionType, seatClass, sort, adultCount, childCount, infantCount);
    }
}

