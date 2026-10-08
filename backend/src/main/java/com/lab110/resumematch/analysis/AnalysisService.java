package com.lab110.resumematch.analysis;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.lab110.resumematch.analysis.dto.AnalysisResponse;
import com.lab110.resumematch.analysis.dto.RequirementDto;
import com.lab110.resumematch.analysis.dto.SuggestionDto;
import com.lab110.resumematch.auth.AuthService;
import com.lab110.resumematch.common.ApiException;
import com.lab110.resumematch.job.Job;
import com.lab110.resumematch.job.JobRepository;
import com.lab110.resumematch.llm.DeepSeekClient;
import com.lab110.resumematch.resume.Resume;
import com.lab110.resumematch.resume.ResumeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private static final String EXTRACT_SYSTEM_PROMPT = """
            你是简历-岗位匹配助手。请从岗位描述中提取所有主要要求，每条用简洁短语表述，保留原文关键词（如技术栈、经验年限、能力要求）。
            只返回一个 JSON 对象，不要代码块、不要额外文字：{"requirements":["要求1","要求2",...]}
            """;

    private static final String JUDGE_SYSTEM_PROMPT = """
            你是简历-岗位匹配助手。判断岗位要求是否在简历中体现，按三种情况分别处理：
            1. MATCHED（已体现）：evidence 逐字引用简历原文证据；suggestion.kind 用 REWRITE 给出「优化表达」建议（original_passage 为原文、suggested_passage 为优化后）。只优化表达、不夸大事实，不得增加简历中没有的经历、技能、年限、数字或业绩。
            2. NOT_MATCHED（未体现）：当前简历找不到该要求的证据。evidence 留空；reason 客观说明「简历中未体现该要求」；suggestion.kind 用 NONE。不得推断「用户不会/不具备」等主观判断，不得编造任何事实写入。
            3. NEED_CONFIRM（需确认）：简历中有相关线索，但具体责任、范围或结果不明确。suggestion.kind 用 CONFIRM，在 confirmation_question 中列出补充问题（如：具体负责什么、涉及范围、达到什么结果）；这些信息在用户确认前不作为事实，不得写入正文或改稿。
            只返回一个 JSON 对象，不要代码块、不要额外文字，结构如下：
            {"requirement":"岗位要求","evidence":"证据原文（MATCHED 时逐字引用，否则空字符串）","match_status":"MATCHED 或 NOT_MATCHED 或 NEED_CONFIRM","reason":"判断原因","suggestion":{"kind":"REWRITE 或 CONFIRM 或 NONE","original_passage":"原段落（REWRITE 时填）","suggested_passage":"建议段落（REWRITE 时填）","rewrite_reason":"修改理由（REWRITE 时填）","confirmation_question":"补充问题（CONFIRM 时填）"}}
            """;

    private final AnalysisRepository analysisRepository;
    private final JobRequirementRepository requirementRepository;
    private final SuggestionRepository suggestionRepository;
    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final DeepSeekClient deepSeekClient;
    private final Executor analysisExecutor;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public AnalysisService(
            AnalysisRepository analysisRepository,
            JobRequirementRepository requirementRepository,
            SuggestionRepository suggestionRepository,
            ResumeRepository resumeRepository,
            JobRepository jobRepository,
            DeepSeekClient deepSeekClient,
            @Qualifier("analysisExecutor") Executor analysisExecutor,
            AuthService authService) {
        this.analysisRepository = analysisRepository;
        this.requirementRepository = requirementRepository;
        this.suggestionRepository = suggestionRepository;
        this.resumeRepository = resumeRepository;
        this.jobRepository = jobRepository;
        this.deepSeekClient = deepSeekClient;
        this.analysisExecutor = analysisExecutor;
        this.authService = authService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
    }

    public AnalysisResponse create(Long userId, Long resumeId, Long jobId) {
        Resume resume = resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ApiException(404, "简历不存在"));
        Job job = jobRepository.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ApiException(404, "岗位不存在"));

        Analysis analysis = new Analysis();
        analysis.setUserId(userId);
        analysis.setResumeId(resumeId);
        analysis.setJobId(jobId);
        analysis.setResumeSnapshot(resume.getContent());
        analysis.setJobSnapshot(job.getTitle() + "\n" + job.getDescription());
        analysis.setDraftContent(resume.getContent());
        analysis.setStatus("RUNNING");
        analysisRepository.save(analysis);

        analysisExecutor.execute(() -> process(analysis.getId()));

        return toResponse(analysis);
    }

    public AnalysisResponse get(Long userId, Long id) {
        Analysis analysis = analysisRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "分析不存在"));
        return toResponseWithDetails(analysis);
    }

    public List<AnalysisResponse> listByResume(Long userId, Long resumeId) {
        return analysisRepository.findByResumeIdAndUserIdOrderByCreatedAtDesc(resumeId, userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AnalysisResponse> listByUser(Long userId) {
        return analysisRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponseWithDetails)
                .toList();
    }

    public void delete(Long userId, Long id) {
        Analysis analysis = analysisRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "分析不存在"));
        requirementRepository.findByAnalysisIdOrderBySeq(id).forEach(requirementRepository::delete);
        suggestionRepository.findByAnalysisId(id).forEach(suggestionRepository::delete);
        analysisRepository.delete(analysis);
    }

    public AnalysisResponse retry(Long userId, Long id) {
        Analysis analysis = analysisRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "分析不存在"));
        if (!"FAILED".equals(analysis.getStatus())) {
            throw new ApiException(400, "仅失败的分析可重试");
        }
        analysis.setStatus("RUNNING");
        analysis.setErrorMessage(null);
        analysis.setCompletedAt(null);
        analysisRepository.save(analysis);
        analysisExecutor.execute(() -> process(analysis.getId()));
        return toResponse(analysis);
    }

    public AnalysisResponse updateDraft(Long userId, Long id, String content) {
        Analysis analysis = analysisRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "分析不存在"));
        analysis.setDraftContent(content);
        analysisRepository.save(analysis);
        return toResponse(analysis);
    }

    public String export(Long userId, Long id) {
        Analysis analysis = analysisRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(404, "分析不存在"));
        String draft = analysis.getDraftContent() == null ? "" : analysis.getDraftContent();
        if (draft.trim().startsWith("#")) {
            return draft;
        }
        String resumeName = analysis.getResumeSnapshot() == null ? "简历" : firstLine(analysis.getResumeSnapshot());
        return "# " + resumeName + "\n\n" + draft;
    }

    private String firstLine(String s) {
        if (s == null) {
            return "";
        }
        String line = s.split("\n", 2)[0].trim();
        return line.replaceAll("^#+\\s*", "");
    }

    private void process(Long analysisId) {
        Analysis analysis = analysisRepository.findById(analysisId).orElse(null);
        if (analysis == null) {
            return;
        }
        String userKey = authService.getApiKey(analysis.getUserId());
        if ((userKey == null || userKey.isBlank()) && !deepSeekClient.hasFallbackKey()) {
            analysis.setStatus("FAILED");
            analysis.setErrorMessage("请先配置你的 API Key（或在服务端环境变量设置 DEEPSEEK_API_KEY）");
        } else {
            String rawContent = null;
            try {
                // 阶段 1：提取岗位要求
                String extractJson = deepSeekClient.chat(userKey, EXTRACT_SYSTEM_PROMPT, extractUserPrompt(analysis.getJobSnapshot()));
                List<String> reqs = parseRequirements(extractJson);
                rawContent = extractJson;
                if (reqs.isEmpty()) {
                    throw new RuntimeException("未能从岗位中提取到要求");
                }

                // 简历分块
                List<String> chunks = chunkResume(analysis.getResumeSnapshot());

                // 阶段 2：逐条要求，检索相关片段后判断
                List<LlmRequirement> results = new ArrayList<>();
                for (String req : reqs) {
                    String related = retrieveChunks(req, chunks);
                    String judgeJson = deepSeekClient.chat(userKey, JUDGE_SYSTEM_PROMPT, judgeUserPrompt(req, related));
                    rawContent = judgeJson;
                    LlmRequirement r = parseRequirement(judgeJson);
                    if (r == null) {
                        r = new LlmRequirement(req, "", "NOT_MATCHED", "判断失败", null);
                    }
                    results.add(r);
                }

                saveResults(analysis, new LlmResponse(results));
                analysis.setStatus("SUCCESS");
            } catch (Exception e) {
                log.error("分析失败 analysisId={}, rawContent={}", analysis.getId(), rawContent, e);
                analysis.setStatus("FAILED");
                analysis.setErrorMessage(classifyError(e));
            }
        }
        analysis.setCompletedAt(Instant.now());
        analysisRepository.save(analysis);
    }

    private String extractUserPrompt(String jobSnapshot) {
        return "岗位描述：\n" + jobSnapshot;
    }

    private String judgeUserPrompt(String requirement, String relatedChunks) {
        return "岗位要求：" + requirement + "\n\n简历相关片段：\n" + relatedChunks;
    }

    private List<String> parseRequirements(String json) {
        try {
            JsonNode root = objectMapper.readTree(stripCodeFence(json));
            List<String> reqs = new ArrayList<>();
            JsonNode arr = root.path("requirements");
            if (arr.isArray()) {
                for (JsonNode n : arr) {
                    if (n.isTextual() && !n.asText().isBlank()) {
                        reqs.add(n.asText());
                    }
                }
            }
            return reqs;
        } catch (Exception e) {
            throw new RuntimeException("岗位要求提取失败", e);
        }
    }

    private LlmRequirement parseRequirement(String json) {
        try {
            return objectMapper.readValue(stripCodeFence(json), LlmRequirement.class);
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> chunkResume(String resume) {
        if (resume == null || resume.isBlank()) {
            return List.of();
        }
        String[] byBlank = resume.split("\\n\\s*\\n");
        String[] parts = byBlank.length >= 3 ? byBlank : resume.split("\\n");
        return Arrays.stream(parts)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    private String retrieveChunks(String requirement, List<String> chunks) {
        List<String> scored = chunks.stream()
                .map(c -> new Object() {
                    final String chunk = c;
                    final int score = charOverlap(requirement, c);
                })
                .filter(o -> o.score > 0)
                .sorted((a, b) -> b.score - a.score)
                .limit(3)
                .map(o -> o.chunk)
                .toList();
        return scored.isEmpty() ? String.join("\n\n", chunks) : String.join("\n\n", scored);
    }

    private int charOverlap(String a, String b) {
        Set<Integer> sa = a.chars().boxed().collect(Collectors.toSet());
        return (int) b.chars().distinct().filter(sa::contains).count();
    }

    private void saveResults(Analysis analysis, LlmResponse llm) {
        String resume = analysis.getResumeSnapshot();
        int seq = 1;
        for (LlmRequirement req : llm.requirements()) {
            String evidence = req.evidence();
            String matchStatus = req.matchStatus();
            String reason = req.reason();
            // 证据校验（Grounding check）：非空证据必须在简历原文中可找到，否则视为幻觉证据并降级
            if (evidence != null && !evidence.isBlank() && !isGrounded(evidence, resume)) {
                evidence = "";
                if ("MATCHED".equals(matchStatus)) {
                    matchStatus = "NOT_MATCHED";
                }
                reason = (reason == null ? "" : reason) + "（证据未能在简历原文中找到，已按未体现处理）";
            }
            JobRequirement jr = new JobRequirement();
            jr.setAnalysisId(analysis.getId());
            jr.setSeq(seq++);
            jr.setJobRequirementQuote(req.requirement());
            jr.setResumeEvidenceQuote(evidence);
            jr.setMatchStatus(matchStatus);
            jr.setReason(reason);
            requirementRepository.save(jr);

            LlmSuggestion sug = req.suggestion();
            // 防御：未体现的要求不给改写建议（只提示缺口），避免把缺失项写成事实
            if ("NOT_MATCHED".equals(matchStatus) && sug != null && "REWRITE".equals(sug.kind())) {
                sug = null;
            }
            if (sug != null && sug.kind() != null && !"NONE".equals(sug.kind())) {
                Suggestion s = new Suggestion();
                s.setAnalysisId(analysis.getId());
                s.setRequirementId(jr.getId());
                s.setKind(sug.kind());
                s.setOriginalPassage(sug.originalPassage());
                s.setSuggestedPassage(sug.suggestedPassage());
                s.setRewriteReason(sug.rewriteReason());
                s.setConfirmationQuestion(sug.confirmationQuestion());
                suggestionRepository.save(s);
            }
        }
    }

    private boolean isGrounded(String evidence, String resume) {
        String e = normalize(evidence);
        String r = normalize(resume);
        return e.length() >= 2 && r.contains(e);
    }

    private String normalize(String s) {
        if (s == null) {
            return "";
        }
        return s.replaceAll("[\\s\\p{Punct}]", "");
    }

    private String stripCodeFence(String content) {
        if (content == null) {
            return "";
        }
        String s = content.trim();
        if (s.startsWith("```")) {
            int start = s.indexOf('\n');
            if (start < 0) {
                return s;
            }
            int end = s.lastIndexOf("```");
            s = end > start ? s.substring(start + 1, end) : s.substring(start + 1);
        }
        return s.trim();
    }

    private String classifyError(Exception e) {
        if (e instanceof HttpClientErrorException hce) {
            int code = hce.getStatusCode().value();
            if (code == 401 || code == 403) {
                return "模型密钥无效或无权限";
            }
            return "模型服务返回错误（HTTP " + code + "）";
        }
        if (e instanceof ResourceAccessException) {
            return "外部服务不可用或响应超时，请稍后重试";
        }
        String msg = e.getMessage() == null ? "" : e.getMessage();
        if (msg.contains("解析") || msg.contains("提取")) {
            return "模型输出格式异常，请重试";
        }
        return "分析失败：" + (msg.isBlank() ? "未知错误" : msg);
    }

    private AnalysisResponse toResponse(Analysis a) {
        return new AnalysisResponse(
                a.getId(), a.getStatus(), a.getErrorMessage(),
                a.getCreatedAt(), a.getCompletedAt(),
                a.getResumeId(), a.getJobId(), a.getResumeSnapshot(), a.getJobSnapshot(), a.getDraftContent(),
                List.of(), List.of());
    }

    private AnalysisResponse toResponseWithDetails(Analysis a) {
        List<RequirementDto> reqs = requirementRepository.findByAnalysisIdOrderBySeq(a.getId()).stream()
                .map(r -> new RequirementDto(
                        r.getId(), r.getSeq(), r.getJobRequirementQuote(),
                        r.getResumeEvidenceQuote(), r.getMatchStatus(), r.getReason()))
                .toList();
        List<SuggestionDto> sugs = suggestionRepository.findByAnalysisId(a.getId()).stream()
                .map(s -> new SuggestionDto(
                        s.getId(), s.getRequirementId(), s.getKind(),
                        s.getOriginalPassage(), s.getSuggestedPassage(),
                        s.getRewriteReason(), s.getConfirmationQuestion(), s.getDecision()))
                .toList();
        return new AnalysisResponse(
                a.getId(), a.getStatus(), a.getErrorMessage(),
                a.getCreatedAt(), a.getCompletedAt(),
                a.getResumeId(), a.getJobId(), a.getResumeSnapshot(), a.getJobSnapshot(), a.getDraftContent(),
                reqs, sugs);
    }

    private record LlmResponse(List<LlmRequirement> requirements) {
    }

    private record LlmRequirement(
            String requirement,
            String evidence,
            String matchStatus,
            String reason,
            LlmSuggestion suggestion) {
    }

    private record LlmSuggestion(
            String kind,
            String originalPassage,
            String suggestedPassage,
            String rewriteReason,
            String confirmationQuestion) {
    }
}
