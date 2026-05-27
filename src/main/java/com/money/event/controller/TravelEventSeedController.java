package com.money.event.controller;

import com.money.event.enums.EventRegion;
import com.money.event.service.TravelEventSeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/events")
@RequiredArgsConstructor
public class TravelEventSeedController {
    private final TravelEventSeedService travelEventSeedService;

    @PostMapping("/reload/{region}")
    public ResponseEntity<Map<String, Object>> reloadEvents(@PathVariable String region) {
        EventRegion eventRegion = EventRegion.from(region);
        int savedCount = travelEventSeedService.reloadEvents(eventRegion);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("region", eventRegion.getCode());
        response.put("savedCount", savedCount);
        response.put("message", eventRegion.getCode() + " 이벤트 CSV 저장이 완료 되었습니다. ");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/reload/all")
    public ResponseEntity<Map<String, Object>> reloadAllEvents() {
        int savedCount = travelEventSeedService.reloadAllEvents();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("savedCount", savedCount);
        response.put("message", " 이벤트 CSV 저장이 완료 되었습니다. ");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/count/{region}")
    public ResponseEntity<Map<String, Object>> countEvents(@PathVariable String region) {
        EventRegion eventRegion = EventRegion.from(region);
        long count = travelEventSeedService.countEvents(eventRegion);
        Map<String, Object> response = new LinkedHashMap<>();

        response.put("region", eventRegion.getCode());
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/count/all")
    public ResponseEntity<Map<String, Object>> countAllEvents() {
        Map<String, Object> response = new LinkedHashMap<>();
        long totalCount = 0;
        for (EventRegion region : EventRegion.values()) {
            long count = travelEventSeedService.countEvents(region);
            response.put(region.getCode(), count);
            totalCount += count;
        }
        response.put("totalCount", totalCount);
        return ResponseEntity.ok(response);
    }


}
