package com.money.recommendation.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TravelTimingRecommendationPageController {
    @GetMapping("/recommendations/travel-timing")
    public String travelTimingPage() {
        return "recommendation/travel-timing";
    }
}
