import { getCollection } from "astro:content";

export interface DocSection {
  title: string;
  prefix: string;
  items: { id: string; title: string; description?: string }[];
}

function compareDocs(a: { data: { order?: number; date?: Date } }, b: { data: { order?: number; date?: Date } }) {
  const aOrder = a.data.order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.data.order ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return (a.data.date?.valueOf() ?? 0) - (b.data.date?.valueOf() ?? 0);
}

export async function getDocSections(): Promise<DocSection[]> {
  const docs = (await getCollection("docs")).sort(compareDocs);

  const sectionDefs = [
    { title: "快速入门", prefix: "getting-started" },
    { title: "Linux 基础", prefix: "linux-" },
    { title: "Web 安全", prefix: "web-" },
    { title: "逆向工程", prefix: "reverse-" },
    { title: "密码学", prefix: "crypto-" },
    { title: "PWN", prefix: "pwn-" },
    { title: "杂项", prefix: "misc-" },
    { title: "移动安全", prefix: "mobile-" },
    { title: "渗透测试", prefix: "pentest-" },
  ];

  return sectionDefs
    .map((def) => ({
      title: def.title,
      prefix: def.prefix,
      items: docs
        .filter((d) => d.id.startsWith(def.prefix))
        .map((d) => ({ id: d.id, title: d.data.title, description: d.data.description })),
    }))
    .filter((section) => section.items.length > 0);
}
