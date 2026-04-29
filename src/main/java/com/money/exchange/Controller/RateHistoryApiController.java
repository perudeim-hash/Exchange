package com.money.exchange.Controller;

import com.money.exchange.Dto.RateHistoryResponseDto;
import com.money.exchange.Service.RateHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rates")
public class RateHistoryApiController {
    private final RateHistoryService rateHistoryService;

    @GetMapping("/history/{code}")
    public ResponseEntity<List<RateHistoryResponseDto>> getHistory(
            @PathVariable String code,
            @RequestParam(defaultValue = "1") int years
    ) {
        List<RateHistoryResponseDto> history = rateHistoryService.getHistory(code, years);
        return ResponseEntity.ok(history);
    }
}
