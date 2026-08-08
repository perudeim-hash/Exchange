package com.money.exchange.dto;

import com.money.exchange.entity.Country;
import com.money.exchange.entity.Currency;
import com.money.exchange.entity.RateHistory;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

@Getter
@RequiredArgsConstructor
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

    private final BigDecimal averageRate;
    private final RateJudgementDto judgement;


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
                history.getSource(),
                null,
                null
        );
    }

    public static CountryRateResponseDto from(Country country, RateHistory history, BigDecimal averageRate, RateJudgementDto judgement) {
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
                history.getSource(),
                averageRate,
                judgement
        );
    }


}
