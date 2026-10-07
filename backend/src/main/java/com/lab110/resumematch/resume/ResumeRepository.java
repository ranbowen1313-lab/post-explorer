package com.lab110.resumematch.resume;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    List<Resume> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<Resume> findByIdAndUserId(Long id, Long userId);
}
