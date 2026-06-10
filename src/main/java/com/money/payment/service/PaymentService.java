package com.money.payment.service;

import com.money.common.exception.BusinessConflictException;
import com.money.payment.config.TossPaymentProperties;
import com.money.payment.dto.PaymentPageResponseDto;
import com.money.payment.dto.PaymentReadyRequestDto;
import com.money.payment.dto.PaymentReadyResponseDto;
import com.money.payment.dto.toss.TossPaymentConfirmResponseDto;
import com.money.payment.entity.Payment;
import com.money.payment.entity.Reservation;
import com.money.payment.enums.PaymentProvider;
import com.money.payment.enums.PaymentStatus;
import com.money.payment.enums.ReservationStatus;
import com.money.payment.repository.PaymentRepository;
import com.money.payment.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final TossPaymentGateway tossPaymentGateway;
    private final TossPaymentProperties tossPaymentProperties;

    public PaymentReadyResponseDto readyPayment(PaymentReadyRequestDto request) {
        validateReadyRequest(request);
        Reservation reservation = getReservation(request.getReservationId());
        if (reservation.getStatus() == ReservationStatus.RESERVED) {
            throw new BusinessConflictException("이미 결제가 완료된 예약입니다.");
        }
        if (reservation.getStatus() == ReservationStatus.CANCELED) {
            throw new BusinessConflictException("취소된 예약은 결제할 수 없습니다.");
        }
        if (request.getProvider() == PaymentProvider.KAKAO_PAY) {
            throw new UnsupportedOperationException("카카오페이 결제는 추후 지원 예정입니다");
        }

        Payment paidPayment = paymentRepository
                .findFirstByReservationIdAndStatusOrderByRequestedAtDesc(reservation.getId(), PaymentStatus.PAID)
                .orElse(null);
        if (paidPayment != null) {
            throw new BusinessConflictException("이미 결제가 완료된 예약입니다.");
        }

        Payment existingReadyPayment = paymentRepository.findFirstByReservationIdAndStatusOrderByRequestedAtDesc(
                reservation.getId(), PaymentStatus.READY
        ).orElse(null);

        if (existingReadyPayment != null) {
            return PaymentReadyResponseDto.from(existingReadyPayment,tossPaymentProperties);
        }
        Payment payment = Payment.ready(reservation, request.getProvider(), reservation.getReservationNumber(), reservation.getTotalAmount());

        Payment savedPayment = paymentRepository.save(payment);

        return PaymentReadyResponseDto.from(savedPayment,tossPaymentProperties);
    }

    public Payment completeTossPayment(String orderId, String paymentKey, Long amount, String paymentMethod) {
        String normalizedOrderId = requireText(orderId, "주문 ID는 필수입니다.");
        String normalizedPaymentKey = requireText(paymentKey, "결제 키는 필수입니다.");
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("결제 승인 금액은 0원보다 커야 합니다.");
        }
        Payment payment = paymentRepository.findByOrderId(normalizedOrderId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다"));
        if (payment.getStatus() == PaymentStatus.PAID) {
            return payment;
        }
        if (payment.getStatus() == PaymentStatus.CANCELED) {
            throw new BusinessConflictException("취소된 결제는 승인할 수 없습니다.");
        }
        validatePaymentAmount(payment, amount);
        TossPaymentConfirmResponseDto tossResponse;

        try {
            tossResponse = tossPaymentGateway.confirmPayment(normalizedPaymentKey, normalizedOrderId, amount);
        } catch (RuntimeException e) {
            payment.fail("TOSS_CONFIRM_FAILED", e.getMessage(), "ABORTED");
            return payment;
        }
        validateConfirmResponse(payment, tossResponse);

        if (payment.getStatus() == PaymentStatus.FAILED) {
            return payment;
        }

        payment.completePayment(tossResponse.getPaymentKey(),
                tossResponse.getMethod(), tossResponse.getStatus(), tossResponse.getReceiptUrl(), tossResponse.getEasyPayProvider());

        payment.getReservation().completeReservation();
        return payment;
    }

    public Payment failPayment(String orderId, String reason) {
        String normalizedOrderId = requireText(orderId, "주문 ID는 필수입니다.");
        Payment payment = paymentRepository.findByOrderId(normalizedOrderId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));
        payment.fail("MOCK_PAYMENT_FAILED", reason == null || reason.isBlank() ? "결제 실패" : reason.trim(), "ABORTED");
        return payment;
    }

    public Payment failTossPayment(String orderId, String code, String message) {
        String normalizedOrderId = requireText(orderId, "주문 ID는 필수입니다.");
        Payment payment = paymentRepository.findByOrderId(normalizedOrderId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));
        String failureCode = code == null || code.isBlank() ? "TOSS_PAYMENT_FAILED" : code.trim();
        String failureReason = message == null || message.isBlank() ? "토스 결제가 취소되었거나 실패했습니다." : message.trim();
        payment.fail(failureCode, failureReason ,"ABORTED");
        return payment;
    }

    public Payment cancelPayment(Long paymentId) {
        if (paymentId == null) {
            throw new IllegalArgumentException("결제 ID는 필수입니다.");
        }
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));
        payment.cancel();
        return payment;
    }

    @Transactional(readOnly = true)
    public Payment getPayment(Long paymentId) {
        if (paymentId == null) {
            throw new IllegalArgumentException("결제 ID는 필수입니다");
        }
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));
    }

    public PaymentPageResponseDto getPaymentPage(Long paymentId) {
        Payment payment = getPayment(paymentId);
        return PaymentPageResponseDto.from(payment, tossPaymentProperties);
    }

    @Transactional(readOnly = true)
    public Payment getPaymentByOrderId(String orderId) {
        String normalizedOrderId = requireText(orderId, "주문 ID는 필수입니다.");
        return paymentRepository.findByOrderId(normalizedOrderId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));
    }

    private Reservation getReservation(Long reservationId) {
        if (reservationId == null) {
            throw new IllegalArgumentException("예약 ID는 필수입니다.");
        }
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));
    }

    private void validateReadyRequest(PaymentReadyRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("결제 준비 요청 정보가 없습니다.");
        }
        if (request.getReservationId() == null) {
            throw new IllegalArgumentException("예약 ID는 필수입니다.");
        }
        if (request.getProvider() == null) {
            throw new IllegalArgumentException("결제 제공자는 필수입니다.");
        }
    }

    private void validatePaymentAmount(Payment payment, Long amount) {

        if (!payment.getAmount().equals(amount)) {
            throw new IllegalArgumentException("결제 금액이 예약 금액과 일치하지 않습니다.");
        }
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private void validateConfirmResponse(Payment payment, TossPaymentConfirmResponseDto tossResponse) {
        if (tossResponse == null) {
            payment.fail("TOSS_RESPONSE_EMPTY",
                    "토스 결제 승인 응답이 비어 있습니다.", null);
            return;
        }
        if (tossResponse.getTotalAmount() == null || !payment.getAmount().equals(tossResponse.getTotalAmount())) {
            payment.fail("TOSS_AMOUNT_MISMATCH", "토스 승인 금액이 예약 결제 금액과 일치하지 않습니다.", tossResponse.getStatus());
            return;
        }

        if (!"DONE".equals(tossResponse.getStatus())) {
            payment.fail(tossResponse.getFailureCode() == null ? "TOSS_PAYMENT_NOT_DONE" : tossResponse.getFailureCode(),
                    tossResponse.getFailureMessage() == null ? "토스 결제가 정상 승인 상태가 아닙니다." : tossResponse.getFailureMessage(),
                    tossResponse.getStatus());
        }

    }
}
