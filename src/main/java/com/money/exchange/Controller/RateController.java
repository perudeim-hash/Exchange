package com.money.exchange.Controller;

import com.money.exchange.Service.RateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
public class RateController {

    private final RateService rateService;

    @GetMapping("/exchange")
    public String exchange(@RequestParam(defaultValue = "0") long krw, Model model)  {
        model.addAttribute("rates", rateService.getTodayRatesForEnabledCurrencies());
        model.addAttribute("krw", krw);
        return "exchange";
    }

    @GetMapping("/exchange/{code}")
    public String exchangeDetail(@PathVariable String code, Model model) {
        model.addAttribute("currencyCode", code);

        return "exchange-detail";
    }


}
