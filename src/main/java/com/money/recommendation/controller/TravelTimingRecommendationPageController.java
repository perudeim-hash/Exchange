package com.money.recommendation.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TravelTimingRecommendationPageController {
    @GetMapping("/travel/travel-timing")
    public String travelTimingPage() {
        return "travel/travel-timing";
    }
}
