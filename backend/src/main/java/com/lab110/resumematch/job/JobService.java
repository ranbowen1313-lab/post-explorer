package com.lab110.resumematch.job;

import com.lab110.resumematch.common.ApiException;
import com.lab110.resumematch.job.dto.JobRequest;
import com.lab110.resumematch.job.dto.JobResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {

    private final JobRepository jobRepository;

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    public JobResponse create(Long userId, JobRequest req) {
        Job job = new Job();
        job.setUserId(userId);
        job.setTitle(req.title());
        job.setDescription(req.description());
        jobRepository.save(job);
        return toDto(job);
    }

    public List<JobResponse> list(Long userId) {
        return jobRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    public JobResponse get(Long userId, Long id) {
        Job job = jobRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "岗位不存在"));
        return toDto(job);
    }

    public void delete(Long userId, Long id) {
        Job job = jobRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "岗位不存在"));
        jobRepository.delete(job);
    }

    private JobResponse toDto(Job j) {
        return new JobResponse(
                j.getId(), j.getTitle(), j.getDescription(),
                j.getCreatedAt(), j.getUpdatedAt());
    }
}
