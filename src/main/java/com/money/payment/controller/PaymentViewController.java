package com.money.payment.controller;

import com.money.payment.config.TossPaymentProperties;
import com.money.payment.dto.PaymentPageResponseDto;
import com.money.payment.dto.PaymentReadyResponseDto;
import com.money.payment.dto.PaymentResponseDto;
import com.money.payment.entity.Payment;
import com.money.payment.enums.PaymentStatus;
import com.money.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
@RequestMapping("/payments")
public class PaymentViewController {
    private final PaymentService paymentService;
    private final TossPaymentProperties tossPaymentProperties;

    @GetMapping("/{paymentId}")
    public String paymentPage(@PathVariable Long paymentId, Model model) {
        PaymentPageResponseDto payment = paymentService.getPaymentPage(paymentId);
        model.addAttribute("payment", payment);
        return "payment/payment";
    }

    @GetMapping("/toss/success")
    public String tossSuccess(@RequestParam String paymentKey, @RequestParam String orderId, @RequestParam Long amount, Model model) {
        try {
            Payment payment = paymentService.completeTossPayment(orderId, paymentKey, amount, null);
            PaymentResponseDto response = PaymentResponseDto.from(payment);
            model.addAttribute("payment", response);

            if (payment.getStatus() == PaymentStatus.PAID) {
                return "payment/payment-success";
            }
            return "payment/payment-fail";
        } catch (RuntimeException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("orderId", orderId);
            return "payment/payment-fail";
        }
    }

    @GetMapping("/toss/fail")
    public String tossFail(@RequestParam(required = false) String code, @RequestParam(required = false) String message, @RequestParam(required = false) String orderId, Model model) {
        if (orderId == null || orderId.isBlank()) {
            model.addAttribute("code", code);
            model.addAttribute("errorMessage", message == null || message.isBlank()
                    ? " 결제가 취소되었거나 실패했습니다." : message);
            return "payment/payment-fail";
        }
        try {
            Payment payment = paymentService.failTossPayment(orderId, code, message);
            model.addAttribute("payment", PaymentResponseDto.from(payment));
        } catch (RuntimeException e) {
            model.addAttribute("errorMessage", e.getMessage());
            model.addAttribute("orderId", orderId);
        }
        return "payment/payment-fail";
    }

    @GetMapping("/error")
    public String paymentError(@RequestParam(required = false) String reason, Model model) {
        model.addAttribute("reason", reason == null || reason.isBlank()
                ? "결제 처리중 문제가 발생했습니다." : reason);
        return "payment/payment-error";
    }
}
