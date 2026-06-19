interface NumericInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  step?: number | "any";
  hint?: string;
}

export function NumericInput({
  id,
  label,
  value,
  onChange,
  max,
  min = 0,
  step = "any",
  hint,
}: NumericInputProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        inputMode={step === "any" ? "decimal" : "numeric"}
        aria-describedby={hintId}
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange(Number.isNaN(next) ? 0 : next);
        }}
      />
      {hint && (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}
