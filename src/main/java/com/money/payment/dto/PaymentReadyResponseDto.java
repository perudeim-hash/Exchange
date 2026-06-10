package com.money.payment.dto;

import com.money.payment.config.TossPaymentProperties;
import com.money.payment.entity.Payment;
import lombok.Getter;

@Getter
public class PaymentReadyResponseDto {

    private final Long reservationId;
    private final Long paymentId;
    private final String reservationNumber;
    private final String orderId;
    private final Long amount;
    private final String provider;
    private final String orderName;
    private final String customerName;
    private final String customerEmail;

    private final String clientKey;
    private final String successUrl;
    private final String failUrl;



    private PaymentReadyResponseDto(Long reservationId, Long paymentId, String reservationNumber, String orderId, Long amount, String provider, String orderName, String customerName, String customerEmail,String clientKey, String successUrl, String failUrl) {
        this.reservationId = reservationId;
        this.paymentId = paymentId;
        this.reservationNumber = reservationNumber;
        this.orderId = orderId;
        this.amount = amount;
        this.provider = provider;
        this.orderName = orderName;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.clientKey = clientKey;
        this.successUrl = successUrl;
        this.failUrl = failUrl;
    }
    public static PaymentReadyResponseDto from(Payment payment, TossPaymentProperties tossPaymentProperties) {
        String orderName = payment.getReservation().getOriginCityName()
                + " -> " + payment.getReservation().getDestinationCityName()
                + " 항공권 예약";

        return new PaymentReadyResponseDto(
                payment.getReservation().getId()
                , payment.getId()
                , payment.getReservation().getReservationNumber()
                , payment.getOrderId()
                , payment.getAmount()
                , payment.getProvider().name()
                , orderName
                , payment.getReservation().getCustomerName()
                , payment.getReservation().getCustomerEmail()
                , tossPaymentProperties.getClientKey()
                , tossPaymentProperties.getSuccessUrl()
                , tossPaymentProperties.getFailUrl()
        );
    }

}
