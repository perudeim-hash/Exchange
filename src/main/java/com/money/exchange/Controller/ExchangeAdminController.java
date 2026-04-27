package com.money.exchange.Controller;

import com.money.exchange.Service.ExchangeHistoryImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class ExchangeAdminController {
    private final ExchangeHistoryImportService exchangeHistoryImportService;

    @PostMapping("/exchange-history/usd/import")
    public ResponseEntity<String> importUsdHistory(){
        exchangeHistoryImportService.importUsdHistory();
        return ResponseEntity.ok("USD 과거 환율 데이터 저장 완료.");
    }
}
