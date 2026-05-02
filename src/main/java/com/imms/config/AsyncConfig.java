package com.imms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Dedicated thread pool for large Excel imports.
     * - corePoolSize=1: one upload at a time to avoid DB contention
     * - maxPoolSize=2: allow a second concurrent upload if needed
     * - queueCapacity=5: queue up to 5 pending uploads
     */
    @Bean(name = "pharUploadExecutor")
    public Executor pharUploadExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(5);
        executor.setThreadNamePrefix("phar-upload-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(300); // wait up to 5 min on shutdown
        executor.initialize();
        return executor;
    }
}
