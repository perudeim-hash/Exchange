package com.money.exchange.controller;

import com.money.exchange.dto.CountryRateResponseDto;
import com.money.exchange.dto.RateHistoryAnalysisResponseDto;
import com.money.exchange.dto.RateHistoryResponseDto;
import com.money.exchange.service.ExchangeRateAnalysisService;
import com.money.exchange.service.RateHistoryService;
import com.money.exchange.service.RateService;
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
    private final ExchangeRateAnalysisService exchangeRateAnalysisService;
    private final RateService rateService;

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

    @GetMapping("/history/{code}/analysis")
    public ResponseEntity<RateHistoryAnalysisResponseDto> getHistoryAnalysis(@PathVariable String code,
                                                                             @RequestParam(required = false)
                                                                             @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                                                             LocalDate from,
                                                                             @RequestParam(required = false)
                                                                             @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                                                             LocalDate to,
                                                                             @RequestParam(required = false) Integer limit) {
        RateHistoryAnalysisResponseDto analysis = exchangeRateAnalysisService.getAnalysis(code, from, to, limit);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/countries/summary")
    public ResponseEntity<List<CountryRateResponseDto>> getCountryRateSummaries(@RequestParam(defaultValue = "12m") String range) {
        List<CountryRateResponseDto> summaries = rateService.getCountryRateSummaries(range);
        return ResponseEntity.ok(summaries);
    }
}
