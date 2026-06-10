package com.money.payment.controller;

import com.money.payment.dto.*;
import com.money.payment.entity.Payment;
import com.money.payment.enums.ReservationStatus;
import com.money.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;
    @PostMapping("/ready")
    public PaymentReadyResponseDto readyPayment(@RequestBody PaymentReadyRequestDto request) {
        return paymentService.readyPayment(request);

    }

    @PostMapping("/toss/success")
    public PaymentResponseDto completeTossPayment(@RequestBody TossPaymentSuccessRequestDto request) {
        System.out.println("toss success controller 호출");
        System.out.println("orderId = " + request.getOrderId());
        System.out.println("paymentKey = " + request.getPaymentKey());
        System.out.println("amount = " + request.getAmount());

        Payment payment = paymentService.completeTossPayment(
                request.getOrderId(),
                request.getPaymentKey(),
                request.getAmount(),
                request.getPaymentMethod()
        );
        return PaymentResponseDto.from(payment);
    }

    @PostMapping("/fail")
    public PaymentResponseDto failPayment(@RequestBody PaymentFailRequestDto request) {
        Payment payment = paymentService.failPayment(
                request.getOrderId(),
                request.getReason()
        );

        return PaymentResponseDto.from(payment);
    }

    @GetMapping("/{paymentId}")
    public PaymentResponseDto getPayment(@PathVariable Long paymentId) {
        Payment payment = paymentService.getPayment(paymentId);
        return PaymentResponseDto.from(payment);
    }

    @GetMapping("/order/{orderId}")
    public PaymentResponseDto getPaymentByOrderId(@PathVariable String orderId) {
        Payment payment = paymentService.getPaymentByOrderId(orderId);
        return PaymentResponseDto.from(payment);
    }

    @GetMapping("{paymentId}/cancel")
    public PaymentResponseDto cancelPayment(@PathVariable Long paymentId) {
        Payment payment = paymentService.getPayment(paymentId);
        return PaymentResponseDto.from(payment);
    }




}
