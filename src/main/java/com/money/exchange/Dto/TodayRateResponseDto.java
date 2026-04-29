package com.money.exchange.Dto;

import com.money.exchange.Entity.Currency;
import com.money.exchange.Entity.RateHistory;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class TodayRateResponseDto {
    private final String currencyCode;
    private final String countryName;
    private final String currencyName;
    private final String symbol;
    private final Integer unit;
    private final BigDecimal rate;
    private final String rateDate;
    private final String source;

    public TodayRateResponseDto(String currencyCode, String countryName, String currencyName, String symbol, Integer unit, BigDecimal rate, String rateDate, String source) {
        this.currencyCode = currencyCode;
        this.countryName = countryName;
        this.currencyName = currencyName;
        this.symbol = symbol;
        this.unit = unit;
        this.rate = rate;
        this.rateDate = rateDate;
        this.source = source;
    }

    public static TodayRateResponseDto from(RateHistory history) {
        Currency currency = history.getCurrency();
        return new TodayRateResponseDto(
                currency.getCode(),
                currency.getCountryName(),
                currency.getCurrencyName(),
                currency.getSymbol(),
                currency.getUnit(),
                history.getRate(),
                history.getRateDate().toString(),
                history.getSource()
        );
    }
}
