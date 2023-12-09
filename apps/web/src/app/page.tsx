import Link from "next/link";
async function getData() {
  const res = await new Promise((resolve) => {
    resolve({ datra: "asd" });
  });
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  return res;
}

export default async function Page() {
  const data = (await getData()) as string;

  return (
    <main>
      <Link href="/blog/first-post">Dashboard</Link>
      {JSON.stringify(data)}
    </main>
  );
}
