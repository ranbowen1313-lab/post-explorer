package com.lab110.resumematch.analysis;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "job_requirements")
public class JobRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "analysis_id", nullable = false)
    private Long analysisId;

    @Column(nullable = false)
    private Integer seq;

    @Column(name = "job_requirement_quote", nullable = false, columnDefinition = "TEXT")
    private String jobRequirementQuote;

    @Column(name = "resume_evidence_quote", columnDefinition = "TEXT")
    private String resumeEvidenceQuote;

    @Column(name = "match_status", nullable = false)
    private String matchStatus;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    public Long getId() {
        return id;
    }

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public Integer getSeq() {
        return seq;
    }

    public void setSeq(Integer seq) {
        this.seq = seq;
    }

    public String getJobRequirementQuote() {
        return jobRequirementQuote;
    }

    public void setJobRequirementQuote(String jobRequirementQuote) {
        this.jobRequirementQuote = jobRequirementQuote;
    }

    public String getResumeEvidenceQuote() {
        return resumeEvidenceQuote;
    }

    public void setResumeEvidenceQuote(String resumeEvidenceQuote) {
        this.resumeEvidenceQuote = resumeEvidenceQuote;
    }

    public String getMatchStatus() {
        return matchStatus;
    }

    public void setMatchStatus(String matchStatus) {
        this.matchStatus = matchStatus;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
