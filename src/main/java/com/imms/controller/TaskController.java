package com.imms.controller;

import com.imms.model.entity.Task;
import com.imms.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    /** All tasks for a project (flat list, subtasks included) */
    @GetMapping
    public ResponseEntity<List<Task>> getTasks(@RequestParam(required = false) Long workOrderId) {
        if (workOrderId != null) {
            return ResponseEntity.ok(taskRepository.findByWorkOrderId(workOrderId));
        }
        return ResponseEntity.ok(taskRepository.findAll());
    }

    /** Tasks assigned to a specific user */
    @GetMapping("/my")
    public ResponseEntity<List<Task>> getMyTasks(@RequestParam Long assigneeId) {
        return ResponseEntity.ok(taskRepository.findByAssigneeId(assigneeId));
    }

    /** Create task or subtask */
    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        task.setId(null);
        task.setCompletionPct(Math.min(100, Math.max(0, task.getCompletionPct())));
        task.setCompleted(task.getCompletionPct() == 100);
        return ResponseEntity.ok(taskRepository.save(task));
    }

    /** Update task metadata */
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getStartDate() != null) task.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) task.setEndDate(request.getEndDate());
        if (request.getAssigneeId() != null) task.setAssigneeId(request.getAssigneeId());
        if (request.getAssigneeName() != null) task.setAssigneeName(request.getAssigneeName());
        int pct = Math.min(100, Math.max(0, request.getCompletionPct()));
        task.setCompletionPct(pct);
        task.setCompleted(pct == 100);
        return ResponseEntity.ok(taskRepository.save(task));
    }

    /** Update only the completion percentage (for field engineers on Gantt page) */
    @PutMapping("/{id}/progress")
    public ResponseEntity<Task> updateProgress(@PathVariable Long id, @RequestParam int pct) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        int clamped = Math.min(100, Math.max(0, pct));
        task.setCompletionPct(clamped);
        task.setCompleted(clamped == 100);
        return ResponseEntity.ok(taskRepository.save(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        // Delete subtasks first
        List<Task> subtasks = taskRepository.findByParentTaskId(id);
        taskRepository.deleteAll(subtasks);
        taskRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /** Average completion % for a project */
    @GetMapping("/completion/{workOrderId}")
    public ResponseEntity<Map<String, Object>> getCompletion(@PathVariable Long workOrderId) {
        List<Task> tasks = taskRepository.findByWorkOrderId(workOrderId);
        double avg = tasks.isEmpty() ? 0.0 :
                tasks.stream().mapToInt(Task::getCompletionPct).average().orElse(0.0);
        long overdue = tasks.stream().filter(t ->
                t.getEndDate() != null &&
                t.getEndDate().isBefore(LocalDate.now()) &&
                t.getCompletionPct() < 100
        ).count();
        return ResponseEntity.ok(Map.of(
                "completionPct", Math.round(avg),
                "totalTasks", tasks.size(),
                "completedTasks", tasks.stream().filter(Task::isCompleted).count(),
                "overdueTasks", overdue
        ));
    }
}
