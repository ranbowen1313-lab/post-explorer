package com.lab110.resumematch.resume;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RevisionRepository extends JpaRepository<Revision, Long> {

    List<Revision> findByResumeIdOrderByVersionNoDesc(Long resumeId);

    Optional<Revision> findTopByResumeIdOrderByVersionNoDesc(Long resumeId);
}
