package com.imms.phar.repository;

import com.imms.phar.model.PharSalesRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PharSalesRecordRepository extends JpaRepository<PharSalesRecord, Long> {
    List<PharSalesRecord> findByShopId(Long shopId);

    List<PharSalesRecord> findByUploadLogId(Long uploadLogId);

    void deleteByUploadLogId(Long uploadLogId);

    @Query("SELECT r FROM PharSalesRecord r WHERE FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period")
    List<PharSalesRecord> findByPeriod(@Param("period") String period);

    @Query("SELECT r FROM PharSalesRecord r WHERE r.shop.salesRepresentative.territory.zone.name = :zone")
    List<PharSalesRecord> findByZone(@Param("zone") String zone);

    @Query("SELECT r FROM PharSalesRecord r WHERE FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period AND r.shop.salesRepresentative.territory.zone.name = :zone")
    List<PharSalesRecord> findByPeriodAndZone(@Param("period") String period, @Param("zone") String zone);

    @Query("SELECT r FROM PharSalesRecord r WHERE r.saleDate BETWEEN :start AND :end")
    List<PharSalesRecord> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
