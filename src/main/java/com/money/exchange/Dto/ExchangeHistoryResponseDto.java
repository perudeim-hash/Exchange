package com.money.exchange.Dto;

import com.money.exchange.Entity.ExchangeRateHistory;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class ExchangeHistoryResponseDto {

    private final String currencyCode;
    private final LocalDate rateDate;
    private final BigDecimal rate;

    public ExchangeHistoryResponseDto(String currencyCode, LocalDate rateDate, BigDecimal rate) {
        this.currencyCode = currencyCode;
        this.rateDate = rateDate;
        this.rate = rate;
    }

    public static ExchangeHistoryResponseDto from(ExchangeRateHistory history) {
        return new ExchangeHistoryResponseDto(
                history.getCurrency().getCode(),
                history.getRateDate(),
                history.getRate()
        );
    }
}
