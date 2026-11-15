import "../styles/AssessmentDetails.css";

function formatPowerDate(value) {
  const text = String(value ?? "");
  if (!/^\d{8}$/.test(text)) return text;
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

function formatConfidence(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value);
  return `${pct}%`;
}

export default function AssessmentDetails({
  supported,
  message,
  provenance,
  moisture,
  crops,
}) {
  const cropList = Array.isArray(crops) ? crops : [];
  const parameters = Array.isArray(provenance?.parameters)
    ? provenance.parameters.filter(Boolean)
    : [];
  const range = provenance?.dateRange;
  const hasProvenance = Boolean(
    provenance && (provenance.source || parameters.length || range?.start),
  );

  if (
    supported !== false &&
    !hasProvenance &&
    !moisture?.summary &&
    cropList.length === 0
  ) {
    return null;
  }

  return (
    <section className="assessment-details">
      {supported === false && (
        <p className="region-notice" role="status">
          Outside supported region (Ghana).{" "}
          {message ||
            "FieldShift agroecological zones and crop recommendations cover Ghana only."}
        </p>
      )}

      {moisture?.summary && (
        <p className="moisture-note">{moisture.summary}</p>
      )}

      {hasProvenance && (
        <p className="provenance-note">
          <span>Provenance: {provenance.source || "NASA POWER"}</span>
          {parameters.length > 0 && (
            <span> · Parameters: {parameters.join(", ")}</span>
          )}
          {range?.start && (
            <span>
              {" "}
              · {formatPowerDate(range.start)}
              {range.end ? `–${formatPowerDate(range.end)}` : ""}
            </span>
          )}
          {provenance.community && (
            <span> · Community {provenance.community}</span>
          )}
        </p>
      )}

      {cropList.length > 0 && (
        <ul className="crop-reason-list">
          {cropList.map((crop) => {
            const confidence = formatConfidence(crop?.confidence);
            return (
              <li key={crop?.name || crop?.reason}>
                <strong>{crop?.name || "Crop"}</strong>
                {confidence && <span> · {confidence} confidence</span>}
                {crop?.reason && <p>{crop.reason}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
