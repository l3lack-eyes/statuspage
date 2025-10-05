// IP Country Checker logic
document.addEventListener("DOMContentLoaded", () => {
  const formElement = document.getElementById("ipForm");
  const inputElement = document.getElementById("ipInput");
  const useMyIpButton = document.getElementById("useMyIpBtn");

  formElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    const raw = inputElement.value.trim();
    await checkIp(raw || undefined);
  });

  useMyIpButton.addEventListener("click", async () => {
    inputElement.value = "";
    await checkIp(undefined);
  });

  // Auto-detect on first load for convenience
  checkIp(undefined);
});

async function checkIp(ipAddress) {
  renderLoading(ipAddress);
  try {
    const result = await getCountryByIp(ipAddress);
    renderResult(result);
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  }
}

async function getCountryByIp(ipAddress) {
  try {
    return await queryIpApi(ipAddress);
  } catch (_) {
    // Fallback provider
    return await queryIpWhoIs(ipAddress);
  }
}

async function queryIpApi(ipAddress) {
  const url = ipAddress
    ? `https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`
    : "https://ipapi.co/json/";
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`ipapi.co request failed (${response.status})`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.reason || data.message || "ipapi.co returned an error");
  }
  return {
    ip: data.ip,
    countryName: data.country_name,
    countryCode: data.country,
    provider: "ipapi.co",
  };
}

async function queryIpWhoIs(ipAddress) {
  const url = ipAddress
    ? `https://ipwho.is/${encodeURIComponent(ipAddress)}`
    : "https://ipwho.is/";
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`ipwho.is request failed (${response.status})`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "ipwho.is returned an error");
  }
  return {
    ip: data.ip,
    countryName: data.country,
    countryCode: data.country_code,
    provider: "ipwho.is",
  };
}

function renderLoading(ipAddress) {
  const result = document.getElementById("result");
  const target = ipAddress ? `IP ${ipAddress}` : "your IP";
  result.innerHTML = `<div class="resultMeta">Checking ${escapeHtml(target)}…</div>`;
}

function renderResult(details) {
  const result = document.getElementById("result");
  const flag = countryCodeToFlagEmoji(details.countryCode);
  result.innerHTML = `
    <div class="resultHeader">
      <div class="resultFlag">${flag}</div>
      <div class="resultTitle">${escapeHtml(details.countryName)} (${escapeHtml(
    details.countryCode
  )})</div>
    </div>
    <div class="resultMeta">IP: ${escapeHtml(details.ip)} • Source: ${escapeHtml(
    details.provider
  )}</div>
  `;
}

function renderError(message) {
  const result = document.getElementById("result");
  result.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function countryCodeToFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return "🌐";
  }
  const base = 127397; // Unicode regional indicator symbol offset
  const code = countryCode.toUpperCase();
  const first = String.fromCodePoint(base + code.charCodeAt(0));
  const second = String.fromCodePoint(base + code.charCodeAt(1));
  return first + second;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
