package com.money.flight.controller;

import com.money.flight.dto.FlightOptionResponseDto;
import com.money.flight.dto.RoundTripBookingResponseDto;
import com.money.flight.service.FlightBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
public class FlightBookingController {
    private final FlightBookingService flightBookingService;

    @GetMapping("/flights/booking/round-trip")
    public String roundTripBookingPage() {
        return "flight/flight-booking";
    }

    @ResponseBody
    @GetMapping("/api/flights/booking/round-trip")
    public RoundTripBookingResponseDto getRoundTripBookingDetail(
            @RequestParam Long outboundOptionId,
            @RequestParam Long returnOptionId,
            @RequestParam(defaultValue = "1") int adultCount,
            @RequestParam(defaultValue = "0") int childCount,
            @RequestParam(defaultValue = "0") int infantCount) {
        return flightBookingService.getRoundTripBookingDetail(outboundOptionId, returnOptionId, adultCount, childCount, infantCount);
    }

    @GetMapping("/flights/booking/one-way")
    public String oneWayBookingPage() {
        return "flight/flight-booking";
    }

    @ResponseBody
    @GetMapping("/api/flights/booking/one-way")
    public FlightOptionResponseDto getOneWayBookingDetail(@RequestParam Long optionId,
                                                          @RequestParam(defaultValue = "1") int adultCount,
                                                          @RequestParam(defaultValue = "0") int childCount,
                                                          @RequestParam(defaultValue = "0") int infantCount) {
        return flightBookingService.getOneWayBookingDetail(optionId, adultCount, childCount, infantCount);
    }

    }
