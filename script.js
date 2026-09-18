"use strict";

// Referencias a los elementos principales de la interfaz.
const temperatureInput = document.querySelector("#temperature-value");
const fromUnit = document.querySelector("#from-unit");
const toUnit = document.querySelector("#to-unit");
const swapButton = document.querySelector("#swap-button");
const clearButton = document.querySelector("#clear-button");
const inputMessage = document.querySelector("#input-message");
const resultPanel = document.querySelector("#result-panel");
const resultValue = document.querySelector("#result-value");
const conversionDetail = document.querySelector("#conversion-detail");
const indicatorLabel = document.querySelector("#indicator-label");
const scaleMarker = document.querySelector("#scale-marker");

const UNIT_SYMBOLS = { C: "°C", F: "°F", K: "K" };
const UNIT_NAMES = { C: "Celsius", F: "Fahrenheit", K: "Kelvin" };

/** Acepta punto o coma decimal y valida el contenido completo. */
function parseTemperature(rawValue) {
  const normalized = rawValue.trim().replace(",", ".");
  if (normalized === "") return { valid: false, empty: true };
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    return { valid: false, empty: false };
  }
  const value = Number(normalized);
  return { valid: Number.isFinite(value), empty: false, value };
}

/** Convierte primero a Celsius y luego a la unidad de destino. */
function convertTemperature(value, source, target) {
  let celsius;
  switch (source) {
    case "F": celsius = (value - 32) * 5 / 9; break;
    case "K": celsius = value - 273.15; break;
    default: celsius = value;
  }

  switch (target) {
    case "F": return celsius * 9 / 5 + 32;
    case "K": return celsius + 273.15;
    default: return celsius;
  }
}

/** Obtiene Celsius para validar el cero absoluto y definir el indicador térmico. */
function toCelsius(value, unit) {
  if (unit === "F") return (value - 32) * 5 / 9;
  if (unit === "K") return value - 273.15;
  return value;
}

/** Formatea el resultado evitando decimales innecesarios y valores -0. */
function formatNumber(value) {
  const safeValue = Math.abs(value) < 1e-10 ? 0 : value;
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(safeValue);
}

function showMessage(text, isError = false) {
  inputMessage.textContent = text;
  inputMessage.classList.toggle("error", isError);
  temperatureInput.classList.toggle("invalid", isError);
  temperatureInput.setAttribute("aria-invalid", String(isError));
}

function resetResult() {
  resultValue.textContent = "--";
  conversionDetail.textContent = "El resultado aparecerá aquí";
  indicatorLabel.textContent = "Esperando temperatura";
  resultPanel.className = "result-panel neutral";
  scaleMarker.style.left = "50%";
}

/** Actualiza color, etiqueta y posición del indicador según la temperatura en Celsius. */
function updateThermalIndicator(celsius) {
  let category;
  let label;

  if (celsius < 10) {
    category = "cold";
    label = "Temperatura fría";
  } else if (celsius <= 28) {
    category = "mild";
    label = "Temperatura templada";
  } else {
    category = "hot";
    label = "Temperatura caliente";
  }

  // Escala visual de -50 °C a 50 °C, limitada entre 2 % y 98 %.
  const markerPosition = Math.min(98, Math.max(2, ((celsius + 50) / 100) * 100));
  indicatorLabel.textContent = label;
  resultPanel.className = `result-panel ${category}`;
  scaleMarker.style.left = `${markerPosition}%`;
}

function animateResult() {
  resultPanel.classList.remove("animate");
  void resultPanel.offsetWidth;
  resultPanel.classList.add("animate");
}

function performConversion() {
  const parsed = parseTemperature(temperatureInput.value);

  if (!parsed.valid) {
    resetResult();
    showMessage(
      parsed.empty ? "Ingresa una temperatura para realizar la conversión." : "Escribe un valor numérico válido, por ejemplo 25 o -3,5.",
      !parsed.empty
    );
    return;
  }

  const celsius = toCelsius(parsed.value, fromUnit.value);
  if (celsius < -273.15) {
    resetResult();
    showMessage("La temperatura no puede ser inferior al cero absoluto (-273,15 °C).", true);
    return;
  }

  const converted = convertTemperature(parsed.value, fromUnit.value, toUnit.value);
  resultValue.textContent = `${formatNumber(converted)} ${UNIT_SYMBOLS[toUnit.value]}`;
  conversionDetail.textContent = `${formatNumber(parsed.value)} ${UNIT_SYMBOLS[fromUnit.value]} equivalen a ${formatNumber(converted)} ${UNIT_SYMBOLS[toUnit.value]}`;
  showMessage(`Conversión de ${UNIT_NAMES[fromUnit.value]} a ${UNIT_NAMES[toUnit.value]}.`);
  updateThermalIndicator(celsius);
  animateResult();
}

// Conversión automática al escribir o cambiar cualquier unidad.
temperatureInput.addEventListener("input", performConversion);
fromUnit.addEventListener("change", performConversion);
toUnit.addEventListener("change", performConversion);

swapButton.addEventListener("click", () => {
  [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
  performConversion();
  swapButton.setAttribute("aria-label", `Unidades intercambiadas: ${UNIT_NAMES[fromUnit.value]} a ${UNIT_NAMES[toUnit.value]}`);
});

clearButton.addEventListener("click", () => {
  temperatureInput.value = "";
  fromUnit.value = "C";
  toUnit.value = "F";
  showMessage("Ingresa un valor para comenzar.");
  resetResult();
  temperatureInput.focus();
});

// Estado inicial.
resetResult();
