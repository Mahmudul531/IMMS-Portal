package com.imms.phar.controller;

import com.imms.phar.service.PharDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/phar/api/dashboard")
@CrossOrigin(origins = "*")
public class PharDashboardController {

    @Autowired private PharDashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getSummary(period, zone));
    }

    @GetMapping("/by-zone")
    public ResponseEntity<List<Map<String, Object>>> byZone(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getByZone(period, zone));
    }

    @GetMapping("/by-territory")
    public ResponseEntity<List<Map<String, Object>>> byTerritory(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getByTerritory(period, zone));
    }

    @GetMapping("/by-sm")
    public ResponseEntity<List<Map<String, Object>>> bySM(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getBySM(period, zone));
    }

    @GetMapping("/by-sr")
    public ResponseEntity<List<Map<String, Object>>> bySR(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getBySR(period, zone));
    }

    @GetMapping("/by-shop")
    public ResponseEntity<List<Map<String, Object>>> byShop(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getByShop(period, zone));
    }

    @GetMapping("/by-tier")
    public ResponseEntity<List<Map<String, Object>>> byTier(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getByTier(period, zone));
    }

    @GetMapping("/monthly-trend")
    public ResponseEntity<List<Map<String, Object>>> monthlyTrend(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getMonthlyTrend(period, zone));
    }

    @GetMapping("/commission-summary")
    public ResponseEntity<List<Map<String, Object>>> commissionSummary(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(dashboardService.getCommissionSummary(period, zone));
    }

    @GetMapping("/periods")
    public ResponseEntity<List<String>> periods() {
        return ResponseEntity.ok(dashboardService.getAvailablePeriods());
    }

    @GetMapping("/zones")
    public ResponseEntity<List<String>> zones() {
        return ResponseEntity.ok(dashboardService.getAvailableZones());
    }
}
