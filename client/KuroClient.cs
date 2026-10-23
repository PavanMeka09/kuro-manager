using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace KuroClientApp
{
    public class KuroClient
    {
        private readonly string _serverUrl;
        private readonly string _apiKey;
        private readonly HttpClient _httpClient;

        public KuroClient(string serverUrl = "http://localhost:3000", string apiKey = "")
        {
            _serverUrl = serverUrl.TrimEnd('/');
            _apiKey = apiKey;
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        }

        public async Task<AuthResult> AuthorizeAsync(string registrationNumber, int consumeCredits = 0)
        {
            var endpoint = $"{_serverUrl}/api/authorize";
            var payload = new
            {
                registrationNumber = registrationNumber,
                consumeCredits = consumeCredits,
                reason = "C# .NET EXE Client Execution"
            };

            var json = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            if (!string.IsNullOrEmpty(_apiKey))
            {
                request.Headers.Add("x-kuro-api-key", _apiKey);
            }

            try
            {
                using var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<AuthResult>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return result ?? new AuthResult { Authorized = false, Message = "Null response from server" };
            }
            catch (Exception ex)
            {
                return new AuthResult { Authorized = false, Message = $"Connection error: {ex.Message}" };
            }
        }
    }

    public class AuthResult
    {
        [JsonPropertyName("authorized")]
        public bool Authorized { get; set; }

        [JsonPropertyName("creditsRemaining")]
        public int CreditsRemaining { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; }
    }

    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("=================================");
            Console.WriteLine("   KURO .NET EXE CLIENT SAMPLE   ");
            Console.WriteLine("=================================");

            var client = new KuroClient("http://localhost:3000");
            var result = await client.AuthorizeAsync("KURO-1001");

            if (result.Authorized)
            {
                Console.WriteLine($"[AUTHORIZED] Credits remaining: {result.CreditsRemaining}");
            }
            else
            {
                Console.WriteLine($"[REJECTED] {result.Message}");
            }
        }
    }
}
