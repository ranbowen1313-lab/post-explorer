package com.lab110.resumematch.analysis;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRequirementRepository extends JpaRepository<JobRequirement, Long> {

    List<JobRequirement> findByAnalysisIdOrderBySeq(Long analysisId);
}
