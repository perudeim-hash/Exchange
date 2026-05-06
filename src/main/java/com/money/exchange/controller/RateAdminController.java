package com.money.exchange.controller;

import com.money.exchange.service.RateHistoryImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class RateAdminController {
    private final RateHistoryImportService rateHistoryImportService;

    @PostMapping("/exchange-history/{code}")
    public ResponseEntity<String> importHistory(@PathVariable("code") String currencyCode){
        rateHistoryImportService.importHistory(currencyCode);
        return ResponseEntity.ok("과거 환율 데이터 저장 완료.");
    }

    @PostMapping("/exchange-history/all")
    public ResponseEntity<String> importAll(){
        rateHistoryImportService.importAllHistory();
        return ResponseEntity.ok("모든 통화의 과거 환율 데이터 저장 완료.");
    }

    @PostMapping("/exchange-history/{code}/recent")
    public ResponseEntity<String> importRecent(
            @PathVariable("code") String currencyCode,
            @RequestParam(defaultValue = "7") int days
    ) {
        rateHistoryImportService.importRecentHistory(currencyCode,days);
        return ResponseEntity.ok(currencyCode + "최근 " + days + "일치 환율 데이터 저장 완료.");
    }



    @PostMapping("/exchange-history/all/recent")
    public ResponseEntity<String> importRecentDays(
            @RequestParam(defaultValue = "7") int days
    ) {
        rateHistoryImportService.importRecentAllHistory(days);
        return ResponseEntity.ok("모든 통화 최근 " + days + "일치 환율 데이터 저장 완료.");
    }


    @PostMapping("/exchange-history/items")
    public ResponseEntity<String> printItems(){
        rateHistoryImportService.printBokItemCodes();
        return ResponseEntity.ok("ItemCode 목록 저장 완료.");
    }

}
