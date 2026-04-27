package com.money.exchange.Controller;

import com.money.exchange.Dto.ExchangeHistoryResponseDto;
import com.money.exchange.Service.ExchangeHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rates")
public class ExchangeHistoryApiController {
    private final ExchangeHistoryService exchangeHistoryService;

    @GetMapping("/history/{code}")
    public ResponseEntity<List<ExchangeHistoryResponseDto>> getHistory(
            @PathVariable String code,
            @RequestParam(defaultValue = "1") int years
    ) {
        List<ExchangeHistoryResponseDto> history = exchangeHistoryService.getHistory(code, years);
        return ResponseEntity.ok(history);
    }
}
