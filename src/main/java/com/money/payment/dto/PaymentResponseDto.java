package com.money.payment.dto;

import com.money.payment.entity.Payment;
import lombok.Getter;

import java.time.LocalDateTime;
@Getter
public class PaymentResponseDto {
    private final Long paymentId;
    private final Long reservationId;
    private final String reservationNumber;
    private final String provider;
    private final String status;
    private final String orderId;
    private final String paymentKey;
    private final Long amount;
    private final String paymentMethod;
    private final LocalDateTime requestedAt;
    private final LocalDateTime approvedAt;
    private final LocalDateTime failedAt;
    private final LocalDateTime canceledAt;
    private final String failureReason;
    private final String providerStatus;
    private final String receiptUrl;
    private final String easyPayProvider;
    private final String failureCode;


    private PaymentResponseDto(Long paymentId, Long reservationId, String reservationNumber, String provider, String status, String orderId, String paymentKey, Long amount, String paymentMethod, LocalDateTime requestedAt, LocalDateTime approvedAt, LocalDateTime failedAt, LocalDateTime canceledAt, String failureReason, String providerStatus, String receiptUrl, String easyPayProvider, String failureCode) {
        this.paymentId = paymentId;
        this.reservationId = reservationId;
        this.reservationNumber = reservationNumber;
        this.provider = provider;
        this.status = status;
        this.orderId = orderId;
        this.paymentKey = paymentKey;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.requestedAt = requestedAt;
        this.approvedAt = approvedAt;
        this.failedAt = failedAt;
        this.canceledAt = canceledAt;
        this.failureReason = failureReason;
        this.providerStatus = providerStatus;
        this.receiptUrl = receiptUrl;
        this.easyPayProvider = easyPayProvider;
        this.failureCode = failureCode;
    }

    public static PaymentResponseDto from(Payment payment) {
        return new PaymentResponseDto(payment.getId(),
                payment.getReservation().getId(),
                payment.getReservation().getReservationNumber(),
                payment.getProvider().name(),
                payment.getStatus().name(),
                payment.getOrderId(),
                payment.getPaymentKey(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getRequestedAt(),
                payment.getApprovedAt(),
                payment.getFailedAt(),
                payment.getCanceledAt(),
                payment.getFailureReason(),
                payment.getProviderStatus(),
                payment.getReceiptUrl(),
                payment.getEasyPayProvider(),
                payment.getFailureCode());
    }
}
