package com.money.event.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TravelEventPageController {
    @GetMapping("/events")
    public String eventsPage() {
        return "event/events";
    }
}
