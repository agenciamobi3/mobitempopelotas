type DataSourceCardProps = {
  name: string;
  description: string;
};

export function DataSourceCard({ name, description }: DataSourceCardProps) {
  return (
    <article className="rounded-2xl border p-5">
      <h3 className="font-semibold">{name}</h3>
      <p className="mt-2 text-sm">{description}</p>
    </article>
  );
}
