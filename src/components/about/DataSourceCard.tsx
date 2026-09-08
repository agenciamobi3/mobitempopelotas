type DataSourceCardProps = {
  name: string;
  description: string;
  role?: string;
};

export function DataSourceCard({ name, description, role }: DataSourceCardProps) {
  return (
    <article className="about-source-row">
      <div>
        {role ? <span>{role}</span> : null}
        <h3>{name}</h3>
      </div>
      <p>{description}</p>
    </article>
  );
}
