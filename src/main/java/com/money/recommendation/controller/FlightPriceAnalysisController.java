package com.money.recommendation.controller;

import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import com.money.recommendation.dto.FlightPriceAnalysisResponseDto;
import com.money.recommendation.service.FlightPriceAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class FlightPriceAnalysisController {
    private final FlightPriceAnalysisService flightPriceAnalysisService;

    @GetMapping("/flight-prices")
    public FlightPriceAnalysisResponseDto analyzeFlightPrices(@RequestParam String origin, @RequestParam String destination,
                                                              @RequestParam
                                                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                                              LocalDate startDate,
                                                              @RequestParam
                                                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                                              LocalDate endDate,
                                                              @RequestParam(defaultValue = "3") int stayDays,
                                                              @RequestParam(required = false) ConnectionType connectionType,
                                                              @RequestParam(required = false) SeatClass seatClass,
                                                              @RequestParam(defaultValue = "1") int adultCount,
                                                              @RequestParam(defaultValue = "0") int childCount,
                                                              @RequestParam(defaultValue = "0") int infantCount) {
        return flightPriceAnalysisService.analyzeRoundTripPrices(origin, destination, startDate, endDate, stayDays, connectionType, seatClass, adultCount, childCount, infantCount);
    }
}
