package com.money.flight.controller;

import com.money.flight.service.FlightOptionSeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/flight-options")
@RequiredArgsConstructor
public class FlightAdminController {
    private final FlightOptionSeedService flightOptionSeedService;

    @PostMapping("/generate/range")
    public ResponseEntity<String> generateFlightOptionByRange(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        flightOptionSeedService.generateFlightOptionsByRange(startDate, endDate);
        return ResponseEntity.ok("항공권 데이터 생성 완료. \n" +
                "항공권 데이터 범위 생성 완료.\n" +
                "생성 범위 : " + startDate + " ~ " + endDate + "\n" +
                "DB 저장 완료.\n" +
                "※ CSV 저장과 통계 갱신은 별도 API로 실행 예정.");
    }


    @PostMapping("/finalize")
    public ResponseEntity<String> finalizeFlightOptions(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            flightOptionSeedService.finalizeFlightOptionsByRange(startDate, endDate);
        } catch (IOException e) {
            throw new IllegalStateException("항공권 후처리 중 CSV 파일 생성 중 오류가 발생했습니다.",e);
        }
        return ResponseEntity.ok("항공권 후처리 완료. \n" +
                "처리 범위 : " + startDate + " ~ " + endDate + "\n" +
                "flight_route 통계 갱신 완료.\n"+ "월별 CSV export 완료.");
        }


}
