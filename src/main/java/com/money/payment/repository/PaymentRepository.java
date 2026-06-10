package com.money.payment.repository;

import com.money.payment.entity.Payment;
import com.money.payment.entity.Reservation;
import com.money.payment.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment,Long> {

    Optional<Payment> findByOrderId(String orderId);

    Optional<Payment> findByPaymentKey(String paymentKey);

    List<Payment> findByReservationOrderByRequestedAtDesc(Reservation reservation);

    List<Payment> findByReservationIdOrderByRequestedAtDesc(Long reservationId);

    Optional<Payment> findFirstByReservationIdAndStatusOrderByRequestedAtDesc(Long reservationId, PaymentStatus status);
}
