package service

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type StreamChunk struct {
	ModelKey string `json:"model_key"`
	Content  string `json:"content"`
	Done     bool   `json:"done"`
	Error    string `json:"error,omitempty"`
}

func (s *AIProxyService) CallStream(req AICallRequest, onChunk func(StreamChunk)) {
	apiKey, err := s.crypto.Decrypt(req.APIKeyEncrypted)
	if err != nil {
		onChunk(StreamChunk{Error: fmt.Sprintf("decrypt API key: %v", err), Done: true})
		return
	}

	if req.Temperature == 0 {
		req.Temperature = 0.7
	}
	if req.TopP == 0 {
		req.TopP = 1.0
	}
	if req.MaxTokens == 0 {
		req.MaxTokens = 2000
	}

	switch req.Provider {
	case "openai", "custom":
		s.streamOpenAI(req, apiKey, onChunk)
	case "claude":
		s.streamClaude(req, apiKey, onChunk)
	default:
		result := s.Call(req)
		if result.Error != "" {
			onChunk(StreamChunk{Error: result.Error, Done: true})
		} else {
			onChunk(StreamChunk{Content: result.Content, Done: true})
		}
	}
}

func (s *AIProxyService) streamOpenAI(req AICallRequest, apiKey string, onChunk func(StreamChunk)) {
	messages := []map[string]string{}
	if req.SystemPrompt != "" {
		messages = append(messages, map[string]string{"role": "system", "content": req.SystemPrompt})
	}
	for _, msg := range req.ConversationHistory {
		messages = append(messages, map[string]string{"role": msg.Role, "content": msg.Content})
	}
	messages = append(messages, map[string]string{"role": "user", "content": req.Prompt})

	body := map[string]interface{}{
		"model":       req.ModelName,
		"messages":    messages,
		"max_tokens":  req.MaxTokens,
		"temperature": req.Temperature,
		"top_p":       req.TopP,
		"stream":      true,
	}

	data, _ := json.Marshal(body)

	httpReq, _ := http.NewRequest("POST", req.APIEndpoint, bytes.NewReader(data))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		onChunk(StreamChunk{Error: fmt.Sprintf("request failed: %v", err), Done: true})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		onChunk(StreamChunk{Error: fmt.Sprintf("API error (%d): %s", resp.StatusCode, string(body)), Done: true})
		return
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		payload := strings.TrimPrefix(line, "data: ")
		if payload == "[DONE]" {
			onChunk(StreamChunk{Done: true})
			return
		}

		var chunk map[string]interface{}
		if err := json.Unmarshal([]byte(payload), &chunk); err != nil {
			continue
		}

		choices, _ := chunk["choices"].([]interface{})
		if len(choices) == 0 {
			continue
		}
		choice, _ := choices[0].(map[string]interface{})
		delta, _ := choice["delta"].(map[string]interface{})
		content, _ := delta["content"].(string)
		if content != "" {
			onChunk(StreamChunk{Content: content})
		}
	}
	onChunk(StreamChunk{Done: true})
}

func (s *AIProxyService) streamClaude(req AICallRequest, apiKey string, onChunk func(StreamChunk)) {
	messages := []map[string]string{}
	for _, msg := range req.ConversationHistory {
		messages = append(messages, map[string]string{"role": msg.Role, "content": msg.Content})
	}
	messages = append(messages, map[string]string{"role": "user", "content": req.Prompt})

	body := map[string]interface{}{
		"model":       req.ModelName,
		"max_tokens":  req.MaxTokens,
		"temperature": req.Temperature,
		"top_p":       req.TopP,
		"messages":    messages,
		"stream":      true,
	}
	if req.SystemPrompt != "" {
		body["system"] = req.SystemPrompt
	}

	data, _ := json.Marshal(body)

	httpReq, _ := http.NewRequest("POST", req.APIEndpoint, bytes.NewReader(data))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", apiKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		onChunk(StreamChunk{Error: fmt.Sprintf("request failed: %v", err), Done: true})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		onChunk(StreamChunk{Error: fmt.Sprintf("API error (%d): %s", resp.StatusCode, string(body)), Done: true})
		return
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		payload := strings.TrimPrefix(line, "data: ")

		var event map[string]interface{}
		if err := json.Unmarshal([]byte(payload), &event); err != nil {
			continue
		}

		eventType, _ := event["type"].(string)
		switch eventType {
		case "content_block_delta":
			delta, _ := event["delta"].(map[string]interface{})
			text, _ := delta["text"].(string)
			if text != "" {
				onChunk(StreamChunk{Content: text})
			}
		case "message_stop":
			onChunk(StreamChunk{Done: true})
			return
		}
	}
	onChunk(StreamChunk{Done: true})
}
