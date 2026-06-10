package com.money.payment.entity;

import com.money.payment.enums.PaymentProvider;
import com.money.payment.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;


    @Column(unique = true, nullable = false, length = 100)
    private String orderId;

    @Column(length = 200)
    private String paymentKey;

    @Column(nullable = false)
    private Long amount;

    @Column(length = 50)
    private String paymentMethod;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime failedAt;
    private LocalDateTime canceledAt;

    @Column(length = 500)
    private String failureReason;

    @Column(length = 30)
    private String providerStatus;

    @Column(length = 500)
    private String receiptUrl;

    @Column(length = 50)
    private String easyPayProvider;

    @Column(length = 100)
    private String failureCode;


    public static Payment ready(Reservation reservation, PaymentProvider provider, String orderId, Long amount) {

        Payment payment = new Payment();
        payment.reservation = reservation;
        payment.provider = provider;
        payment.orderId = orderId;
        payment.amount = amount;
        payment.status = PaymentStatus.READY;
        payment.requestedAt = LocalDateTime.now();
        return payment;
    }

    public void completePayment(String paymentKey, String paymentMethod, String providerStatus, String receiptUrl, String easyPayProvider) {
        this.paymentKey = paymentKey;
        this.paymentMethod = paymentMethod;
        this.providerStatus = providerStatus;
        this.receiptUrl = receiptUrl;
        this.easyPayProvider = easyPayProvider;
        this.status = PaymentStatus.PAID;
        this.approvedAt = LocalDateTime.now();
    }

    public void fail(String failureCode, String failureReason, String providerStatus) {
        this.failureCode = failureCode;
        this.failureReason = failureReason;
        this.providerStatus = providerStatus;
        this.status = PaymentStatus.FAILED;
        this.failedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = PaymentStatus.CANCELED;
        this.canceledAt = LocalDateTime.now();
    }

}
