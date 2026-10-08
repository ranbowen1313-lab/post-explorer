package com.lab110.resumematch.analysis;

import com.lab110.resumematch.analysis.dto.AnalysisRequest;
import com.lab110.resumematch.analysis.dto.AnalysisResponse;
import com.lab110.resumematch.common.SecurityUtils;
import com.lab110.resumematch.resume.dto.DraftRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/resumes/{resumeId}/analyses")
    public ResponseEntity<AnalysisResponse> create(
            @PathVariable Long resumeId,
            @Valid @RequestBody AnalysisRequest req) {
        return ResponseEntity.status(201)
                .body(analysisService.create(SecurityUtils.currentUserId(), resumeId, req.jobId()));
    }

    @GetMapping("/analyses/{id}")
    public AnalysisResponse get(@PathVariable Long id) {
        return analysisService.get(SecurityUtils.currentUserId(), id);
    }

    @GetMapping("/analyses")
    public List<AnalysisResponse> list() {
        return analysisService.listByUser(SecurityUtils.currentUserId());
    }

    @DeleteMapping("/analyses/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        analysisService.delete(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resumes/{resumeId}/analyses")
    public List<AnalysisResponse> listByResume(@PathVariable Long resumeId) {
        return analysisService.listByResume(SecurityUtils.currentUserId(), resumeId);
    }

    @PostMapping("/analyses/{id}/retry")
    public AnalysisResponse retry(@PathVariable Long id) {
        return analysisService.retry(SecurityUtils.currentUserId(), id);
    }

    @PutMapping("/analyses/{id}/draft")
    public AnalysisResponse updateDraft(@PathVariable Long id, @Valid @RequestBody DraftRequest req) {
        return analysisService.updateDraft(SecurityUtils.currentUserId(), id, req.content());
    }

    @GetMapping("/analyses/{id}/export")
    public ResponseEntity<String> export(@PathVariable Long id) {
        String md = analysisService.export(SecurityUtils.currentUserId(), id);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"resume.md\"")
                .contentType(MediaType.TEXT_MARKDOWN)
                .body(md);
    }
}
