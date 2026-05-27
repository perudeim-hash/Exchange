package com.money.exchange.dto;

import com.money.exchange.entity.RateHistory;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class RateSummaryDto {
    private final LocalDate rateDate;
    private final BigDecimal rate;

    public RateSummaryDto(LocalDate rateDate, BigDecimal rate) {
        this.rateDate = rateDate;
        this.rate = rate;
    }

    public static RateSummaryDto from(RateHistory history) {
        return new RateSummaryDto(history.getRateDate(), history.getRate());
    }
}
