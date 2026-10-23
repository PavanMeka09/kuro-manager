package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type Config struct {
	ServerURL          string `json:"serverUrl"`
	RegistrationNumber string `json:"registrationNumber"`
	ClientAPIKey       string `json:"clientApiKey"`
}

type AuthRequest struct {
	RegistrationNumber string `json:"registrationNumber"`
	ConsumeCredits     int    `json:"consumeCredits,omitempty"`
	Reason             string `json:"reason,omitempty"`
}

type AuthResponse struct {
	Authorized       bool   `json:"authorized"`
	CreditsRemaining int    `json:"creditsRemaining"`
	Message          string `json:"message,omitempty"`
	Status           string `json:"status,omitempty"`
}

const (
	configFile = "kuro-config.json"
	defaultURL = "http://localhost:3000"
)

func loadConfig() Config {
	var cfg Config
	cfg.ServerURL = defaultURL

	data, err := os.ReadFile(configFile)
	if err == nil {
		_ = json.Unmarshal(data, &cfg)
	}
	return cfg
}

func saveConfig(cfg Config) {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err == nil {
		_ = os.WriteFile(configFile, data, 0644)
	}
}

func authorize(serverURL, regNum, apiKey string, consume int) (*AuthResponse, int, error) {
	endpoint := strings.TrimRight(serverURL, "/") + "/api/authorize"

	reqBody := AuthRequest{
		RegistrationNumber: regNum,
		ConsumeCredits:     consume,
		Reason:             "Kuro Windows Client Request",
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, 0, err
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Kuro-Client-EXE/1.0")
	if apiKey != "" {
		req.Header.Set("x-kuro-api-key", apiKey)
	}

	start := time.Now()
	resp, err := client.Do(req)
	latency := int(time.Since(start).Milliseconds())

	if err != nil {
		return nil, latency, fmt.Errorf("Network error connecting to %s: %v", endpoint, err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, latency, fmt.Errorf("Failed to read server response: %v", err)
	}

	var authResp AuthResponse
	if err := json.Unmarshal(bodyBytes, &authResp); err != nil {
		return nil, latency, fmt.Errorf("Invalid JSON from server (HTTP %d): %s", resp.StatusCode, string(bodyBytes))
	}

	return &authResp, latency, nil
}

func main() {
	cfg := loadConfig()

	serverFlag := flag.String("server", "", "Kuro Manager server URL (e.g. http://localhost:3000)")
	keyFlag := flag.String("key", "", "Registration Number (e.g. KURO-1001)")
	consumeFlag := flag.Int("consume", 0, "Number of credits to deduct (default: 0 for query only)")
	apiKeyFlag := flag.String("api-key", "", "Optional client secret key if required by server")
	flag.Parse()

	serverURL := *serverFlag
	regNumber := *keyFlag
	consume := *consumeFlag
	apiKey := *apiKeyFlag

	if serverURL == "" {
		serverURL = cfg.ServerURL
	}
	if regNumber == "" {
		regNumber = cfg.RegistrationNumber
	}
	if apiKey == "" {
		apiKey = cfg.ClientAPIKey
	}

	reader := bufio.NewReader(os.Stdin)

	// If no flags provided, run interactive prompt
	if *keyFlag == "" {
		fmt.Println("==================================================")
		fmt.Println("              KURO MANAGER CLIENT                 ")
		fmt.Println("         EXE Desktop Authorization Bridge         ")
		fmt.Println("==================================================")
		fmt.Println()

		fmt.Printf("Enter Server URL [%s]: ", serverURL)
		inputURL, _ := reader.ReadString('\n')
		inputURL = strings.TrimSpace(inputURL)
		if inputURL != "" {
			serverURL = inputURL
		}

		fmt.Printf("Enter Registration Number [%s]: ", regNumber)
		inputKey, _ := reader.ReadString('\n')
		inputKey = strings.TrimSpace(inputKey)
		if inputKey != "" {
			regNumber = inputKey
		}

		if regNumber == "" {
			fmt.Println("\n[ERROR] Registration number cannot be empty.")
			return
		}

		fmt.Print("Enter Credits to consume (0 to check balance only) [0]: ")
		inputConsume, _ := reader.ReadString('\n')
		inputConsume = strings.TrimSpace(inputConsume)
		if inputConsume != "" {
			fmt.Sscanf(inputConsume, "%d", &consume)
		}

		// Save preferences
		cfg.ServerURL = serverURL
		cfg.RegistrationNumber = regNumber
		cfg.ClientAPIKey = apiKey
		saveConfig(cfg)
	}

	fmt.Printf("\n[INFO] Contacting %s/api/authorize...\n", serverURL)
	fmt.Printf("[INFO] Verifying registration: %s\n\n", regNumber)

	resp, latency, err := authorize(serverURL, regNumber, apiKey, consume)
	if err != nil {
		fmt.Printf("[FAILURE] %v\n", err)
		return
	}

	fmt.Println("----------------- RESULT -----------------")
	if resp.Authorized {
		fmt.Printf("STATUS:             AUTHORIZED (HTTP 200)\n")
		fmt.Printf("REGISTRATION:       %s\n", regNumber)
		fmt.Printf("CREDITS REMAINING:  %d\n", resp.CreditsRemaining)
		fmt.Printf("LATENCY:            %d ms\n", latency)
		fmt.Println("------------------------------------------")
		fmt.Println("SUCCESS: Client validated and ready for execution.")
	} else {
		fmt.Printf("STATUS:             DENIED / REJECTED\n")
		fmt.Printf("REGISTRATION:       %s\n", regNumber)
		fmt.Printf("MESSAGE:            %s\n", resp.Message)
		if resp.CreditsRemaining > 0 {
			fmt.Printf("CREDITS REMAINING:  %d\n", resp.CreditsRemaining)
		}
		fmt.Printf("LATENCY:            %d ms\n", latency)
		fmt.Println("------------------------------------------")
		fmt.Println("ACCESS DENIED: Please contact administrator.")
	}
}
