package com.lab110.resumematch.analysis;

import com.lab110.resumematch.common.ApiException;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class SuggestionService {

    private final SuggestionRepository suggestionRepository;
    private final AnalysisRepository analysisRepository;

    public SuggestionService(
            SuggestionRepository suggestionRepository,
            AnalysisRepository analysisRepository) {
        this.suggestionRepository = suggestionRepository;
        this.analysisRepository = analysisRepository;
    }

    public Map<String, Object> accept(Long userId, Long suggestionId, String replacementText) {
        Suggestion suggestion = requireSuggestion(userId, suggestionId);
        Analysis analysis = analysisRepository.findById(suggestion.getAnalysisId())
                .orElseThrow(() -> new ApiException(404, "分析不存在"));

        String draftContent = null;
        // 幂等：已采纳/已补充则不重复处理
        if (!"ACCEPTED".equals(suggestion.getDecision())) {
            if ("REWRITE".equals(suggestion.getKind())) {
                String original = suggestion.getOriginalPassage();
                String suggested = (replacementText != null && !replacementText.isBlank())
                        ? replacementText
                        : suggestion.getSuggestedPassage();
                if (original != null && !original.isBlank() && suggested != null) {
                    analysis.setDraftContent(replaceFirstLiteral(analysis.getDraftContent(), original, suggested));
                    analysisRepository.save(analysis);
                    suggestion.setAppliedText(suggested);
                }
                draftContent = analysis.getDraftContent();
            } else if ("CONFIRM".equals(suggestion.getKind()) && replacementText != null && !replacementText.isBlank()) {
                // 补充：把用户填写的补充信息追加到该分析的修改稿末尾
                String current = analysis.getDraftContent();
                analysis.setDraftContent(current + "\n\n## 补充信息\n- " + replacementText);
                analysisRepository.save(analysis);
                suggestion.setAppliedText(replacementText);
                draftContent = analysis.getDraftContent();
            }
        }

        suggestion.setDecision("ACCEPTED");
        suggestionRepository.save(suggestion);

        if (draftContent == null) {
            draftContent = analysis.getDraftContent();
        }
        return Map.of("decision", suggestion.getDecision(), "draftContent", draftContent);
    }

    public Map<String, Object> ignore(Long userId, Long suggestionId) {
        Suggestion suggestion = requireSuggestion(userId, suggestionId);
        suggestion.setDecision("IGNORED");
        suggestionRepository.save(suggestion);
        return Map.of("decision", suggestion.getDecision());
    }

    public Map<String, Object> reset(Long userId, Long suggestionId) {
        Suggestion suggestion = requireSuggestion(userId, suggestionId);
        Analysis analysis = analysisRepository.findById(suggestion.getAnalysisId())
                .orElseThrow(() -> new ApiException(404, "分析不存在"));
        String draftContent = analysis.getDraftContent();

        if ("ACCEPTED".equals(suggestion.getDecision())) {
            // 撤销对修改稿的改动
            if ("REWRITE".equals(suggestion.getKind())
                    && suggestion.getAppliedText() != null && suggestion.getOriginalPassage() != null) {
                analysis.setDraftContent(replaceFirstLiteral(
                        analysis.getDraftContent(), suggestion.getAppliedText(), suggestion.getOriginalPassage()));
                analysisRepository.save(analysis);
                draftContent = analysis.getDraftContent();
            } else if ("CONFIRM".equals(suggestion.getKind()) && suggestion.getAppliedText() != null) {
                String marker = "\n\n## 补充信息\n- " + suggestion.getAppliedText();
                String current = analysis.getDraftContent();
                if (current != null && current.contains(marker)) {
                    analysis.setDraftContent(current.replace(marker, ""));
                    analysisRepository.save(analysis);
                    draftContent = analysis.getDraftContent();
                }
            }
        }

        suggestion.setDecision("PENDING");
        suggestion.setAppliedText(null);
        suggestionRepository.save(suggestion);

        return Map.of("decision", suggestion.getDecision(), "draftContent", draftContent == null ? "" : draftContent);
    }

    private Suggestion requireSuggestion(Long userId, Long suggestionId) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new ApiException(404, "建议不存在"));
        Analysis analysis = analysisRepository.findById(suggestion.getAnalysisId())
                .orElseThrow(() -> new ApiException(404, "分析不存在"));
        if (!analysis.getUserId().equals(userId)) {
            throw new ApiException(404, "建议不存在");
        }
        return suggestion;
    }

    private String replaceFirstLiteral(String text, String from, String to) {
        if (text == null) {
            return text;
        }
        int idx = text.indexOf(from);
        if (idx < 0) {
            return text;
        }
        return text.substring(0, idx) + to + text.substring(idx + from.length());
    }
}
