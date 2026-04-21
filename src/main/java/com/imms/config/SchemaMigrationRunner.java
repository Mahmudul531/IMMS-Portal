package com.imms.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class SchemaMigrationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public SchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void runMigrations() {
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='work_order' AND column_name='asset_id' AND is_nullable='NO'",
            "ALTER TABLE work_order ALTER COLUMN asset_id DROP NOT NULL",
            "Dropped NOT NULL constraint from work_order.asset_id"
        );
    }

    private void applyIfNeeded(String checkSql, String migrationSql, String description) {
        try {
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class);
            if (count != null && count > 0) {
                jdbcTemplate.execute(migrationSql);
                log.info("Schema migration applied: {}", description);
            } else {
                log.debug("Schema migration already applied (skipping): {}", description);
            }
        } catch (Exception e) {
            log.warn("Schema migration check/apply failed for '{}': {}", description, e.getMessage());
        }
    }
}
