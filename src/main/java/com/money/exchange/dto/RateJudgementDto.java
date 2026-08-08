package com.money.exchange.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

@Getter
@RequiredArgsConstructor
public class RateJudgementDto {
    private final String status;
    private final String statusLabel;
    private final String statusTitle;
    private final String statusDescription;
    private final BigDecimal advantagePercent;
    private final String differenceText;


    public static RateJudgementDto good(BigDecimal advantagePercent) {
        return new RateJudgementDto("GOOD", "추천", "평균보다 저렴한 환율", "선택한 기간 평균보다 환율이 낮아 여행 예산 부담이 줄어드는 구간입니다.", advantagePercent, "평균보다 " + advantagePercent.abs().toPlainString() + "% 저렴");
    }
    public static RateJudgementDto normal(BigDecimal advantagePercent) {
        return new RateJudgementDto("NORMAL", "보통", "평균과 비슷한 환율", "선택한 기간 평균과 큰 차이가 없어 환율 부담이 보통 수준입니다.", advantagePercent, "평균과 비슷");
    }

    public static RateJudgementDto bad(BigDecimal advantagePercent) {
        return new RateJudgementDto("BAD", "비추천", "평균보다 부담되는 환율", "선택한 기간 평균보다 환율이 높아 여행 예산 부담이 커질 수 있는 구간입니다.", advantagePercent, "평균보다 " + advantagePercent.abs().toPlainString() + "% 부담");
    }

    public static RateJudgementDto empty() {
        return new RateJudgementDto("NONE", "데이터 없음", "판단할 환율 데이터가 없습니다.", "선택한 기간에 저장된 환율 데이터가 없어 평균 비교를 할 수 없습니다." , BigDecimal.ZERO, "-");
    }


}
