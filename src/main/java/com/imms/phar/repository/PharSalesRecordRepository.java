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

    @Query("SELECT DISTINCT FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') FROM PharSalesRecord r ORDER BY FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') DESC")
    List<String> findAvailablePeriods();

    @Query("SELECT SUM(r.totalAmount), COUNT(DISTINCT r.shop.id), COUNT(DISTINCT r.shop.salesRepresentative.id), COUNT(r) FROM PharSalesRecord r " +
           "WHERE (:period = '' OR FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone)")
    List<Object[]> getSummaryMetrics(@Param("period") String period, @Param("zone") String zone);

    @Query("SELECT r.shop.salesRepresentative.territory.zone.name, SUM(r.totalAmount) FROM PharSalesRecord r " +
           "WHERE (:period = '' OR FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone) " +
           "GROUP BY r.shop.salesRepresentative.territory.zone.name")
    List<Object[]> sumSalesByZone(@Param("period") String period, @Param("zone") String zone);

    @Query("SELECT r.shop.salesRepresentative.territory.name, SUM(r.totalAmount) FROM PharSalesRecord r " +
           "WHERE (:period = '' OR FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone) " +
           "GROUP BY r.shop.salesRepresentative.territory.name")
    List<Object[]> sumSalesByTerritory(@Param("period") String period, @Param("zone") String zone);

    @Query("SELECT r.shop.salesRepresentative.salesManager.name, SUM(r.totalAmount) FROM PharSalesRecord r " +
           "WHERE (:period = '' OR FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone) " +
           "GROUP BY r.shop.salesRepresentative.salesManager.name")
    List<Object[]> sumSalesBySM(@Param("period") String period, @Param("zone") String zone);

    @Query("SELECT r.shop.salesRepresentative.name, SUM(r.totalAmount) FROM PharSalesRecord r " +
           "WHERE (:period = '' OR FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone) " +
           "GROUP BY r.shop.salesRepresentative.name")
    List<Object[]> sumSalesBySR(@Param("period") String period, @Param("zone") String zone);

    @Query("SELECT r.shop.name, SUM(r.totalAmount) FROM PharSalesRecord r " +
           "WHERE (:period = '' OR FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone) " +
           "GROUP BY r.shop.name ORDER BY SUM(r.totalAmount) DESC")
    List<Object[]> sumSalesByShop(@Param("period") String period, @Param("zone") String zone, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT r.product.tier.label, SUM(r.totalAmount) FROM PharSalesRecord r " +
           "WHERE (:period = '' OR FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone) " +
           "GROUP BY r.product.tier.label")
    List<Object[]> sumSalesByTier(@Param("period") String period, @Param("zone") String zone);

    @Query("SELECT FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM'), SUM(r.totalAmount) FROM PharSalesRecord r " +
           "WHERE (:period = '' OR FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') = :period) " +
           "AND (:zone = '' OR r.shop.salesRepresentative.territory.zone.name = :zone) " +
           "GROUP BY FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM') ORDER BY FUNCTION('TO_CHAR', r.saleDate, 'YYYY-MM')")
    List<Object[]> sumSalesByMonth(@Param("period") String period, @Param("zone") String zone);
}
