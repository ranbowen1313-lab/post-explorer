package com.lab110.resumematch.resume;

import com.lab110.resumematch.auth.AuthService;
import com.lab110.resumematch.common.ApiException;
import com.lab110.resumematch.llm.DeepSeekClient;
import com.lab110.resumematch.resume.dto.ResumeRequest;
import com.lab110.resumematch.resume.dto.ResumeResponse;
import com.lab110.resumematch.resume.dto.RevisionDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResumeService {

    private static final String FORMAT_SYSTEM_PROMPT = """
            你是简历整理助手。把用户提供的原始简历整理成标准模板格式（Markdown），只重排、不增删：不得编造或夸大任何信息，原始简历缺失的板块直接省略。
            标准模板结构如下：
            # 姓名

            **求职意向**：...
            **电话**：...
            **邮箱**：...

            ## 教育背景
            - 起止时间 | 学校 | 专业 | 学历

            ## 工作经历
            ### 公司 | 职位 | 起止时间
            - 职责与业绩（尽量量化）

            ## 项目经历
            ### 项目名 | 角色 | 起止时间
            - 项目简介
            - 个人职责与成果

            ## 专业技能
            - 技能1、技能2

            ## 证书与语言
            - ...

            只返回整理后的 Markdown 文本，不要代码块、不要任何解释。
            """;

    private final ResumeRepository resumeRepository;
    private final RevisionRepository revisionRepository;
    private final DeepSeekClient deepSeekClient;
    private final AuthService authService;

    public ResumeService(ResumeRepository resumeRepository, RevisionRepository revisionRepository,
                         DeepSeekClient deepSeekClient, AuthService authService) {
        this.resumeRepository = resumeRepository;
        this.revisionRepository = revisionRepository;
        this.deepSeekClient = deepSeekClient;
        this.authService = authService;
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

    public ResumeResponse updateDraft(Long userId, Long resumeId, String content) {
        Resume resume = resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ApiException(404, "简历不存在"));
        resume.setDraftContent(content);
        resumeRepository.save(resume);
        return toDto(resume);
    }

    public RevisionDto saveRevision(Long userId, Long resumeId, String content) {
        Resume resume = resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ApiException(404, "简历不存在"));
        int nextVersion = revisionRepository.findTopByResumeIdOrderByVersionNoDesc(resumeId)
                .map(r -> r.getVersionNo() + 1)
                .orElse(1);
        Revision revision = new Revision();
        revision.setResumeId(resumeId);
        revision.setVersionNo(nextVersion);
        revision.setContent(content);
        revisionRepository.save(revision);
        resume.setDraftContent(content);
        resumeRepository.save(resume);
        return toRevisionDto(revision);
    }

    public List<RevisionDto> listRevisions(Long userId, Long resumeId) {
        resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ApiException(404, "简历不存在"));
        return revisionRepository.findByResumeIdOrderByVersionNoDesc(resumeId).stream()
                .map(this::toRevisionDto)
                .toList();
    }

    public String export(Long userId, Long resumeId) {
        Resume resume = resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ApiException(404, "简历不存在"));
        Revision latest = revisionRepository.findTopByResumeIdOrderByVersionNoDesc(resumeId)
                .orElseThrow(() -> new ApiException(404, "尚未保存修改稿"));
        return "# " + resume.getTitle() + "\n\n" + latest.getContent();
    }

    public String format(Long userId, String raw) {
        String userKey = authService.getApiKey(userId);
        if ((userKey == null || userKey.isBlank()) && !deepSeekClient.hasFallbackKey()) {
            throw new ApiException(400, "请先配置你的 API Key（或在服务端环境变量设置 DEEPSEEK_API_KEY）");
        }
        return deepSeekClient.chat(userKey, FORMAT_SYSTEM_PROMPT, raw, false);
    }

    private ResumeResponse toDto(Resume r) {
        return new ResumeResponse(
                r.getId(), r.getTitle(), r.getContent(), r.getDraftContent(),
                r.getCreatedAt(), r.getUpdatedAt());
    }

    private RevisionDto toRevisionDto(Revision r) {
        return new RevisionDto(r.getId(), r.getResumeId(), r.getVersionNo(), r.getContent(), r.getSavedAt());
    }
}
