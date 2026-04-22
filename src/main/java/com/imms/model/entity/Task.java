package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "task")
@Getter
@Setter
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "work_order_id", nullable = false)
    private Long workOrderId;

    @Column(name = "parent_task_id")
    private Long parentTaskId; // null = top-level task; non-null = subtask

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "assignee_name")
    private String assigneeName; // denormalized for performance

    private LocalDate startDate;
    private LocalDate endDate;

    @Column(name = "completion_pct")
    private int completionPct = 0; // 0 to 100

    private boolean completed = false;

    @org.hibernate.annotations.CreationTimestamp
    @Column(updatable = false)
    private LocalDate createdAt;
}
