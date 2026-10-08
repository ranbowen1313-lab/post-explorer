package com.lab110.resumematch.analysis;

import com.lab110.resumematch.analysis.dto.AcceptRequest;
import com.lab110.resumematch.common.SecurityUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/suggestions")
public class SuggestionController {

    private final SuggestionService suggestionService;

    public SuggestionController(SuggestionService suggestionService) {
        this.suggestionService = suggestionService;
    }

    @PostMapping("/{id}/accept")
    public Map<String, Object> accept(@PathVariable Long id, @RequestBody(required = false) AcceptRequest req) {
        String replacementText = req != null ? req.replacementText() : null;
        return suggestionService.accept(SecurityUtils.currentUserId(), id, replacementText);
    }

    @PostMapping("/{id}/ignore")
    public Map<String, Object> ignore(@PathVariable Long id) {
        return suggestionService.ignore(SecurityUtils.currentUserId(), id);
    }

    @PostMapping("/{id}/reset")
    public Map<String, Object> reset(@PathVariable Long id) {
        return suggestionService.reset(SecurityUtils.currentUserId(), id);
    }
}
