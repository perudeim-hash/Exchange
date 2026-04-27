package com.money.exchange.Controller;

import com.money.exchange.Dto.ExchangeDto;
import com.money.exchange.Service.ExchangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
public class ExchangeController {

    @Autowired
    private ExchangeService exchangeService;

    public ExchangeController(ExchangeService exchangeService) {
        this.exchangeService = exchangeService;

    }

    @GetMapping("/exchange")
    public String exchange(@RequestParam(defaultValue = "0") long krw, Model model)  {
        model.addAttribute("rates", exchangeService.getTodayExchangeRates());
        model.addAttribute("krw", krw);
        return "exchange";
    }

    @GetMapping("/exchange/{code}")
    public String exchangeDetail(@PathVariable String code, Model model) {
        ExchangeDto rate = exchangeService.getRateByCode(code);
        model.addAttribute("rate", rate);
        return "exchange-detail";
    }


}
