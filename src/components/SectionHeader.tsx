export function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="section-header">
      <span className="section-label">{label}</span>
      <h2 className="section-title">{title}</h2>
    </div>
  );
}
