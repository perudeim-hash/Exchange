package com.money.exchange.Dto;

import com.money.exchange.Entity.RateHistory;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class RateHistoryResponseDto {

    private final String currencyCode;
    private final LocalDate rateDate;
    private final BigDecimal rate;

    public RateHistoryResponseDto(String currencyCode, LocalDate rateDate, BigDecimal rate) {
        this.currencyCode = currencyCode;
        this.rateDate = rateDate;
        this.rate = rate;
    }

    public static RateHistoryResponseDto from(RateHistory history) {
        return new RateHistoryResponseDto(
                history.getCurrency().getCode(),
                history.getRateDate(),
                history.getRate()
        );
    }
}
