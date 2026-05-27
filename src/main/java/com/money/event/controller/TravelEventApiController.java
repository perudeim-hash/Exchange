package com.money.event.controller;

import com.money.event.dto.TravelEventCalendarResponseDto;
import com.money.event.service.TravelEventQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class TravelEventApiController {
    private final TravelEventQueryService travelEventQueryService;

    @GetMapping("/airports/{airportCode}")
    public TravelEventCalendarResponseDto getEventsByAirport(@PathVariable String airportCode,
                                                             @RequestParam(required = false) Integer month) {
        if (month == null) {
            return travelEventQueryService.getMonthlyEventsByAirportCode(airportCode);
        }
        return travelEventQueryService.getMonthlyEventsByAirportCodeAndMonth(airportCode, month);
    }

    @GetMapping
    public TravelEventCalendarResponseDto getEventsByCountryAndCity(@RequestParam String countryCode, @RequestParam String cityName, @RequestParam(required = false) Integer month) {
        if (month == null) {
            return travelEventQueryService.getMonthlyEventsByCountryAndCity(countryCode, cityName);
        }

        return travelEventQueryService.getMonthlyEventsByCountryAndCityAndMonth(countryCode, cityName, month);
    }

}
