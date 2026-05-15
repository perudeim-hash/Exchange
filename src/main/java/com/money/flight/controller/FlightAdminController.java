package com.money.flight.controller;

import com.money.flight.service.FlightOptionSeedService;
import com.money.flight.service.FlightSegmentMigrationService;
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
    private final FlightSegmentMigrationService flightSegmentMigrationService;

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
            throw new IllegalStateException("항공권 후처리 중 CSV 파일 생성 중 오류가 발생했습니다.", e);
        }
        return ResponseEntity.ok("항공권 후처리 완료. \n" +
                "처리 범위 : " + startDate + " ~ " + endDate + "\n" +
                "flight_route 통계 갱신 완료.\n" + "월별 CSV export 완료.");
    }

    @PostMapping("/segments/migrate")
    public ResponseEntity<String> createMissingFlightSegments(@RequestParam(defaultValue = "500") int size) {
        if (size <= 0) {
            throw new IllegalArgumentException("처리 개수는 1개 이상이어야 합니다.");
        }
        if (size > 15000) {
            throw new IllegalArgumentException("한 번에 처리 할 수 있는 개수는 1000개 미만이어야 합니다.");
        }
        int createdCount = flightSegmentMigrationService.createMissingSegments(size);
        return ResponseEntity.ok("FlightSegment 생성 완료.\n" +
                "요청 처리 단위 : " + size + "\n" + "생성된 segment 수 : " + createdCount);
    }
}
