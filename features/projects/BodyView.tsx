import { getTranslations } from "next-intl/server";
import { safeUrl, type Body, type FieldSpec } from "./schema";

/** Read-only view. Links are shown as text with their host and never embedded or fetched. */
export async function BodyView({ fields, body }: { fields: readonly FieldSpec[]; body: Body }) {
  const tf = await getTranslations("project.fields");
  return (
    <dl className="space-y-2">
      {fields.map((f) => {
        const v = body?.[f.key];
        const items = Array.isArray(v) ? v.filter(Boolean) : [];
        if (!v || (Array.isArray(v) && !items.length)) return null;
        return (
          <div key={f.key}>
            <dt className="text-sm font-semibold">{tf(f.key as "title")}</dt>
            <dd>
              {f.type === "links" ? (
                <ul>
                  {items.map((u, i) =>
                    safeUrl.safeParse(u).success ? (
                      <li key={i}>
                        <a className="link break-all" href={u} target="_blank" rel="noopener noreferrer nofollow">{new URL(u).hostname}</a>
                        <span className="ml-1 break-all text-xs text-muted">{u}</span>
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : Array.isArray(v) ? (
                <ol className="list-decimal pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ol>
              ) : (
                <p className="whitespace-pre-wrap">{v}</p>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
