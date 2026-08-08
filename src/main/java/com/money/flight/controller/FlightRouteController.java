package com.money.flight.controller;

import com.money.flight.dto.FlightRouteSearchResponseDto;
import com.money.flight.dto.FlightRouteSummaryResponseDto;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.DepartureTimeSlot;
import com.money.flight.enums.SeatClass;
import com.money.flight.service.FlightRouteViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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

    @GetMapping("/search")
    public List<FlightRouteSearchResponseDto> getRouteSearch(@RequestParam(required = false) String origin, @RequestParam(required = false) String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "ALL") DepartureTimeSlot departureTimeSlot,
            @RequestParam(required = false) ConnectionType connectionType,
            @RequestParam(required = false) SeatClass seatClass) {

        return flightRouteViewService.searchRoutes(origin, destination, startDate, endDate, departureTimeSlot, connectionType, seatClass);
    }
}
