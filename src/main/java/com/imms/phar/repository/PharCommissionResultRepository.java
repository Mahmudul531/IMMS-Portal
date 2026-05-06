package com.imms.phar.repository;

import com.imms.phar.model.PharCommissionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PharCommissionResultRepository extends JpaRepository<PharCommissionResult, Long> {
    List<PharCommissionResult> findByPeriod(String period);
    Optional<PharCommissionResult> findByShopIdAndTierIdAndPeriod(Long shopId, Long tierId, String period);
    List<PharCommissionResult> findByShopId(Long shopId);
    void deleteByPeriod(String period);

    @org.springframework.data.jpa.repository.Query("SELECT r.shop.salesRepresentative.name, SUM(r.totalSales), SUM(r.totalCommission) FROM PharCommissionResult r " +
           "WHERE (:period = '' OR r.period = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone) " +
           "GROUP BY r.shop.salesRepresentative.name")
    List<Object[]> sumCommissionBySR(@org.springframework.data.repository.query.Param("period") String period, @org.springframework.data.repository.query.Param("zone") String zone);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM PharCommissionResult r " +
           "WHERE (:period = '' OR r.period = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone)")
    List<PharCommissionResult> findDetailed(@org.springframework.data.repository.query.Param("period") String period, @org.springframework.data.repository.query.Param("zone") String zone);
}
