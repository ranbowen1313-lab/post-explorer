package com.lab110.resumematch.analysis;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "suggestions")
public class Suggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "analysis_id", nullable = false)
    private Long analysisId;

    @Column(name = "requirement_id", nullable = false)
    private Long requirementId;

    @Column(nullable = false)
    private String kind;

    @Column(name = "original_passage", columnDefinition = "TEXT")
    private String originalPassage;

    @Column(name = "suggested_passage", columnDefinition = "TEXT")
    private String suggestedPassage;

    @Column(name = "rewrite_reason", columnDefinition = "TEXT")
    private String rewriteReason;

    @Column(name = "confirmation_question", columnDefinition = "TEXT")
    private String confirmationQuestion;

    @Column(nullable = false)
    private String decision = "PENDING";

    public Long getId() {
        return id;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public Long getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(Long requirementId) {
        this.requirementId = requirementId;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getOriginalPassage() {
        return originalPassage;
    }

    public void setOriginalPassage(String originalPassage) {
        this.originalPassage = originalPassage;
    }

    public String getSuggestedPassage() {
        return suggestedPassage;
    }

    public void setSuggestedPassage(String suggestedPassage) {
        this.suggestedPassage = suggestedPassage;
    }

    public String getRewriteReason() {
        return rewriteReason;
    }

    public void setRewriteReason(String rewriteReason) {
        this.rewriteReason = rewriteReason;
    }

    public String getConfirmationQuestion() {
        return confirmationQuestion;
    }

    public void setConfirmationQuestion(String confirmationQuestion) {
        this.confirmationQuestion = confirmationQuestion;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }
}
