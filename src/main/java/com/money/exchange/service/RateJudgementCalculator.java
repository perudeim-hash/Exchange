package com.money.exchange.service;

import com.money.exchange.dto.RateJudgementDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class RateJudgementCalculator {
    private static final BigDecimal JUDGEMENT_THRESHOLD = new BigDecimal("1.5");

    public RateJudgementDto createJudgement(BigDecimal targetRate, BigDecimal averageRate) {
        BigDecimal advantagePercent = calculateAdvantagePercent(targetRate, averageRate);
        if (advantagePercent.compareTo(JUDGEMENT_THRESHOLD) >= 0) {
            return RateJudgementDto.good(advantagePercent);
        }

        if (advantagePercent.compareTo(JUDGEMENT_THRESHOLD.negate()) <= 0) {
            return RateJudgementDto.bad(advantagePercent);
        }
        return RateJudgementDto.normal(advantagePercent);
    }

    public BigDecimal calculateAdvantagePercent(BigDecimal targetRate, BigDecimal averageRate) {
        if (targetRate == null || averageRate == null || averageRate.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return averageRate.subtract(targetRate)
                .divide(averageRate, 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

}
