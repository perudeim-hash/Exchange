package com.money.flight.controller;

import com.money.flight.dto.AirportResponseDto;
import com.money.flight.service.FlightAirportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightAirportController {
    private final FlightAirportService flightAirportService;

    @GetMapping("/airports")
    public List<AirportResponseDto> getAirports(){
        return flightAirportService.getEnabledAirports();
    }
}

