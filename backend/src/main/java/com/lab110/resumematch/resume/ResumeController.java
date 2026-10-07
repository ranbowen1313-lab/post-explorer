package com.lab110.resumematch.resume;

import com.lab110.resumematch.common.SecurityUtils;
import com.lab110.resumematch.resume.dto.ResumeRequest;
import com.lab110.resumematch.resume.dto.ResumeResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping
    public ResponseEntity<ResumeResponse> create(@Valid @RequestBody ResumeRequest req) {
        return ResponseEntity.status(201).body(resumeService.create(SecurityUtils.currentUserId(), req));
    }

    @GetMapping
    public List<ResumeResponse> list() {
        return resumeService.list(SecurityUtils.currentUserId());
    }

    @GetMapping("/{id}")
    public ResumeResponse get(@PathVariable Long id) {
        return resumeService.get(SecurityUtils.currentUserId(), id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        resumeService.delete(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
