package com.money.flight.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FlightRouteViewController {
    @GetMapping("/flights/routes")
    public String routePage() {
        return "flight/flight-routes";
    }
}
