package com.money.payment.dto.toss;

public class TossPaymentConfirmRequestDto {
    private final String paymentKey;
    private final String orderId;
    private final Long amount;

    private TossPaymentConfirmRequestDto(String paymentKey, String orderId, Long amount) {
        this.paymentKey = paymentKey;
        this.orderId = orderId;
        this.amount = amount;
    }

    public static TossPaymentConfirmRequestDto of(String paymentKey, String orderId, Long amount) {
        return new TossPaymentConfirmRequestDto(paymentKey, orderId, amount);
    }
}
