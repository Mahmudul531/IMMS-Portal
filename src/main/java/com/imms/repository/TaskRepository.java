package com.imms.repository;

import com.imms.model.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByWorkOrderId(Long workOrderId);

    List<Task> findByWorkOrderIdAndParentTaskIdIsNull(Long workOrderId);

    List<Task> findByParentTaskId(Long parentTaskId);

    List<Task> findByAssigneeId(Long assigneeId);

    @Query("SELECT AVG(t.completionPct) FROM Task t WHERE t.workOrderId = :workOrderId")
    Double avgCompletionByWorkOrderId(Long workOrderId);
}
