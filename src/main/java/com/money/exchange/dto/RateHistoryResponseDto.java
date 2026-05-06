package com.money.exchange.dto;

import com.money.exchange.entity.RateHistory;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RateHistoryResponseDto {

    private final String currencyCode;
    private final String rateDate;
    private final BigDecimal rate;

    public RateHistoryResponseDto(String currencyCode, String rateDate, BigDecimal rate) {
        this.currencyCode = currencyCode;
        this.rateDate = rateDate;
        this.rate = rate;
    }

    public static RateHistoryResponseDto from(RateHistory history) {
        return new RateHistoryResponseDto(
                history.getCurrency().getCode(),
                history.getRateDate().toString(),
                history.getRate()
        );
    }
}
