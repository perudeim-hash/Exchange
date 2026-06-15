package com.money.flight.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FlightLowestPriceViewController {

    @GetMapping("/flights/lowest-prices")
    public String lowestPricePage(){
        return "flight/flight-lowest-prices";
    }

    @GetMapping("/flights/lowest-prices/round-trip")
    public String roundTripLowestPrices(){
        return "flight/flight-round-trip-lowest-prices";
    }


}
