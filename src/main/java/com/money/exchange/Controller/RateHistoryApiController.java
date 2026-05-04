package com.money.exchange.Controller;

import com.money.exchange.Dto.RateHistoryResponseDto;
import com.money.exchange.Service.RateHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rates")
public class RateHistoryApiController {
    private final RateHistoryService rateHistoryService;

    @GetMapping("/history/{code}")
    public ResponseEntity<List<RateHistoryResponseDto>> getHistory(
            @PathVariable String code,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,
            @RequestParam(required = false) Integer limit
    ) {
        List<RateHistoryResponseDto> history = rateHistoryService.getHistory(code, from, to, limit);
        return ResponseEntity.ok(history);
    }
}
