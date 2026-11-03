type ToolFunction = (
  args: Record<string, unknown>
) => Promise<string>;

async function getWeather(
  args: Record<string, unknown>
): Promise<string> {
  if (
    typeof args.city !== "string" ||
    !args.city.trim()
  ) {
    throw new Error("A valid city is required");
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is missing");
  }

  const url = new URL(
    "https://api.openweathermap.org/data/2.5/weather"
  );

  url.searchParams.set("q", args.city);
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Weather API error: ${response.status}`
    );
  }

  const data = await response.json();

  const result = {
    city: data.name,
    temperature: data.main.temp,
    humidity: data.main.humidity,
    condition: data.weather[0].description,
  };

  return JSON.stringify(result);
}

async function getCurrentTime(
  args: Record<string, unknown>
): Promise<string> {
  if (
    typeof args.timezone !== "string" ||
    !args.timezone.trim()
  ) {
    throw new Error("A valid timezone is required");
  }

  const now = new Date();

  const currentTime = new Intl.DateTimeFormat("en-US", {
    timeZone: args.timezone,
    dateStyle: "full",
    timeStyle: "long",
  }).format(now);

  const result = {
    timezone: args.timezone,
    currentTime,
  };

  return JSON.stringify(result);
}

const tools: Record<string, ToolFunction> = {
  get_weather: getWeather,
  get_current_time: getCurrentTime,
};

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = tools[name];

  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return tool(args);
}
