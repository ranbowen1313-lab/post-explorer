package com.lab110.resumematch.analysis;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {

    List<Suggestion> findByAnalysisId(Long analysisId);
}
