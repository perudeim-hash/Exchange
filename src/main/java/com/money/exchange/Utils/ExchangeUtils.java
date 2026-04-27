package com.money.exchange.Utils;

import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;


@Component
public class ExchangeUtils {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMdd");

    public static String getSearchDate(){

        LocalDate currentDate = LocalDate.now();
        DayOfWeek dayOfWeek = currentDate.getDayOfWeek();

        if (dayOfWeek.getValue() == 6) {
            return currentDate.minusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        }
        if (dayOfWeek.getValue() == 7) {
            return currentDate.minusDays(2).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        }
        return currentDate.format(FORMATTER);
    }

}
