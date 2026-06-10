package com.money.payment.dto;

import com.money.payment.config.TossPaymentProperties;
import com.money.payment.dto.toss.TossPaymentConfirmResponseDto;
import com.money.payment.entity.Payment;
import lombok.Getter;

@Getter
public class PaymentPageResponseDto {
    private final Long paymentId;
    private final Long reservationId;
    private final String reservationNumber;
    private final String orderId;
    private final String orderName;
    private final Long amount;
    private final String customerName;
    private final  String customerEmail;
    private final String clientKey;
    private final String successUrl;
    private final String failUrl;


    private PaymentPageResponseDto(Long paymentId, Long reservationId, String reservationNumber, String orderId, String orderName, Long amount, String customerName, String customerEmail, String clientKey, String successUrl, String failUrl) {
        this.paymentId = paymentId;
        this.reservationId = reservationId;
        this.reservationNumber = reservationNumber;
        this.orderId = orderId;
        this.orderName = orderName;
        this.amount = amount;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.clientKey = clientKey;
        this.successUrl = successUrl;
        this.failUrl = failUrl;
    }


    public static PaymentPageResponseDto from(Payment payment, TossPaymentProperties tossPaymentProperties) {
        String orderName = payment.getReservation().getOriginCityName() + " -> "
                + payment.getReservation().getDestinationCityName() + " 항공권 예약";
        return new PaymentPageResponseDto(payment.getId(),
                payment.getReservation().getId(), payment.getReservation().getReservationNumber(),
                payment.getOrderId(), orderName, payment.getAmount(), payment.getReservation().getCustomerName(),
                payment.getReservation().getCustomerEmail(), tossPaymentProperties.getClientKey(), tossPaymentProperties.getSuccessUrl(), tossPaymentProperties.getFailUrl());
    }
}
