package com.lab110.resumematch.resume;

import com.lab110.resumematch.common.ApiException;
import com.lab110.resumematch.resume.dto.ResumeRequest;
import com.lab110.resumematch.resume.dto.ResumeResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;

    public ResumeService(ResumeRepository resumeRepository) {
        this.resumeRepository = resumeRepository;
    }

    public ResumeResponse create(Long userId, ResumeRequest req) {
        Resume resume = new Resume();
        resume.setUserId(userId);
        resume.setTitle(req.title());
        resume.setContent(req.content());
        resume.setDraftContent(req.content());
        resumeRepository.save(resume);
        return toDto(resume);
    }

    public List<ResumeResponse> list(Long userId) {
        return resumeRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    public ResumeResponse get(Long userId, Long id) {
        Resume resume = resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "简历不存在"));
        return toDto(resume);
    }

    public void delete(Long userId, Long id) {
        Resume resume = resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "简历不存在"));
        resumeRepository.delete(resume);
    }

    private ResumeResponse toDto(Resume r) {
        return new ResumeResponse(
                r.getId(), r.getTitle(), r.getContent(), r.getDraftContent(),
                r.getCreatedAt(), r.getUpdatedAt());
    }
}
