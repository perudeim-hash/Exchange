package com.money.flight.controller;

import com.money.flight.dto.FlightRouteSummaryResponseDto;
import com.money.flight.service.FlightRouteViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/flights/routes")
public class FlightRouteController {

    private final FlightRouteViewService flightRouteViewService;

    @GetMapping
    public List<FlightRouteSummaryResponseDto> getRoutes() {
        return flightRouteViewService.getRoutes();
    }

    @GetMapping("/detail")
    public FlightRouteSummaryResponseDto getRouteDetail(@RequestParam String origin, @RequestParam String destination) {
        return flightRouteViewService.getRouteDetail(origin, destination);
    }


}
