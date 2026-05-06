package com.money.exchange.dto;

import com.money.exchange.entity.Country;
import com.money.exchange.entity.Currency;
import com.money.exchange.entity.RateHistory;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class CountryRateResponseDto {

    private final String countryCode;
    private final String countryName;
    private final String region;

    private final String currencyCode;
    private final String currencyName;
    private final String symbol;
    private final Integer unit;

    private final BigDecimal rate;
    private final String rateDate;
    private final String source;

    public CountryRateResponseDto(String countryCode, String countryName, String region, String currencyCode, String currencyName, String symbol, Integer unit, BigDecimal rate, String rateDate, String source) {
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.region = region;
        this.currencyCode = currencyCode;
        this.currencyName = currencyName;
        this.symbol = symbol;
        this.unit = unit;
        this.rate = rate;
        this.rateDate = rateDate;
        this.source = source;
    }

    public static CountryRateResponseDto from(Country country, RateHistory history) {
        Currency currency = country.getCurrency();

        return new CountryRateResponseDto(
                country.getCode(),
                country.getName(),
                country.getRegion(),
                currency.getCode(),
                currency.getCurrencyName(),
                currency.getSymbol(),
                currency.getUnit(),
                history.getRate(),
                history.getRateDate().toString(),
                history.getSource()
        );
    }
}
