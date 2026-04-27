package com.money.exchange.Service;

import com.money.exchange.Dto.ExchangeDto;
import com.money.exchange.Utils.ExchangeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExchangeService {

    @Value("${exchange.auth-key}")
    private String authKey;

    @Value("${exchange.data}")
    private String data;



    public List<ExchangeDto> getTodayExchangeRates() {
        String searchDate = ExchangeUtils.getSearchDate();
        String url =
                "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON"
                        + "?authkey=" + authKey
                        + "&searchdate=" + searchDate
                        + "&data=" + data;
        RestTemplate restTemplate = new RestTemplate();
        ExchangeDto[] response = restTemplate.getForObject(url, ExchangeDto[].class);
        if (response == null) {
            return List.of();
        }
        return Arrays.asList(response);
    }

    public List<ExchangeDto> calculateByKrw(long krw) {
        List<ExchangeDto> rates = getTodayExchangeRates();

        for (ExchangeDto dto : rates) {
            BigDecimal rate = new BigDecimal(dto.getDeal_bas_r().replace(",", ""));
            BigDecimal krwAmount = BigDecimal.valueOf(krw);

            boolean isHundredUnit = dto.getCur_unit().contains("(");
            BigDecimal divisor = isHundredUnit
                    ? rate.divide(BigDecimal.valueOf(100))
                    : rate;

            BigDecimal result = krwAmount.divide(divisor, 4, RoundingMode.HALF_UP);
            dto.setCalc(result.toPlainString());
        }
        return rates;
    }

    public ExchangeDto getRateByCode(String code){
        return getTodayExchangeRates().stream()
                .filter(dto -> {
                    String curUnit = dto.getCur_unit();
                    return curUnit.equalsIgnoreCase(code)
                            || curUnit.startsWith(code + "(");
                })
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException("해당 통화가 존재 하지 않습니다 : " + code));
    }



}
