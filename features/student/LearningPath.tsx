// Student learning path: the next activity as a focal panel, and the class's
// published modules/surveys as an ordered list. Everything shown is derived
// from real assignment + attempt data; nothing is invented or unlocked here.
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Motif } from "@/components/Motif";
import { RichText, StatusBadge, When } from "@/components/ui";
import { itemHref, type StudentItem } from "@/lib/db/student";
import type { Locale } from "@/lib/validation/content";

type Action = "start" | "continue" | "revise" | "view";
export function actionFor(status: StudentItem["status"]): Action {
  if (status === "not_started") return "start";
  if (status === "draft") return "continue";
  if (status === "needs_revision") return "revise";
  return "view";
}

function SurveyMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="10" y="6" width="28" height="36" rx="2" />
      <path d="M16 16h4M24 16h8M16 25h4M24 25h8M16 34h4M24 34h6" />
    </svg>
  );
}

export function ItemMotif({ item, size }: { item: StudentItem; size: number }) {
  return item.lesson ? <Motif kind={item.lesson.kind} size={size} /> : <SurveyMark size={size} />;
}

export async function NextUp({ item, className, timezone, locale }: { item: StudentItem; className?: string; timezone: string; locale: Locale }) {
  const t = await getTranslations("student");
  const lesson = item.lesson;
  return (
    <div className="grid gap-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <div className="recess relative grid aspect-square w-28 place-items-center text-brand sm:w-full">
        <ItemMotif item={item} size={72} />
        {lesson && <span className="plate absolute left-2 top-2">{t("modulePlate", { n: String(lesson.module).padStart(2, "0") })}</span>}
      </div>
      <div className="min-w-0 space-y-3">
        <div className="space-y-1">
          {className && <p className="meta">{className}</p>}
          <h3 className="h1">{lesson ? lesson.title[locale] : item.survey?.title[locale]}</h3>
        </div>
        {lesson && <p className="max-w-[60ch] text-ink/90"><RichText text={lesson.objective[locale]} /></p>}
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {lesson && (
            <div className="flex gap-1.5"><dt className="text-muted">{t("duration")}</dt><dd>{t("minutes", { min: lesson.minutes.explain + lesson.minutes.practice })}</dd></div>
          )}
          {item.survey && (
            <div className="flex gap-1.5"><dt className="text-muted">{t("duration")}</dt><dd>{t("minutes", { min: item.survey.minutes })}</dd></div>
          )}
          {item.dueAt && (
            <div className="flex gap-1.5"><dt className="text-muted">{t("due")}</dt><dd><When iso={item.dueAt} tz={timezone} locale={locale} /></dd></div>
          )}
        </dl>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link className="btn btn-primary" href={itemHref(item)}>{t(`action.${actionFor(item.status)}`)}</Link>
          <StatusBadge status={item.status} />
        </div>
      </div>
    </div>
  );
}

export async function PathList({ items, timezone, locale }: { items: StudentItem[]; timezone: string; locale: Locale }) {
  const t = await getTranslations("student");
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-[3px] border border-line bg-panel">
      {items.map((i) => {
        const title = i.lesson ? i.lesson.title[locale] : i.survey?.title[locale];
        return (
          <li key={i.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-3 sm:grid-cols-[3.25rem_2.25rem_minmax(0,1fr)_auto_auto] sm:px-4">
            <span className="font-mono text-sm text-warn sm:text-base" aria-hidden={!i.lesson}>
              {i.lesson ? String(i.lesson.module).padStart(2, "0") : "—"}
            </span>
            <span className="hidden text-muted sm:block"><ItemMotif item={i} size={30} /></span>
            <div className="min-w-0">
              <Link href={itemHref(i)} className="relative block w-fit max-w-full font-semibold text-ink hover:text-brand">
                {i.lesson && <span className="sr-only">{t("modulePlate", { n: String(i.lesson.module) })}: </span>}
                {title}
              </Link>
              {i.lesson ? (
                <p className="truncate text-sm text-muted">{i.lesson.summary[locale]}</p>
              ) : (
                <p className="text-sm text-muted">{t("surveyLabel")}</p>
              )}
              {i.dueAt && <p className="meta text-xs">{t("due")} <When iso={i.dueAt} tz={timezone} locale={locale} /></p>}
            </div>
            <span className="col-start-2 sm:col-start-auto"><StatusBadge status={i.status} /></span>
            <Link href={itemHref(i)} className="btn btn-sm col-start-2 justify-self-start sm:col-start-auto sm:justify-self-end" aria-label={`${t(`action.${actionFor(i.status)}`)}: ${title}`}>
              {t(`action.${actionFor(i.status)}`)}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
