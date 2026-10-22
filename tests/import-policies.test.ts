import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
test("additive import is repeatable, role guarded, private, atomic, and preserves edits/deletions", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema public,auth,storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
    );
    await db.exec(
      readFileSync("supabase/schema.sql", "utf8").replace(
        "create extension if not exists pgcrypto;",
        "",
      ),
    );
    const editor = "11111111-1111-4111-8111-111111111111",
      viewer = "22222222-2222-4222-8222-222222222222";
    await db.query("insert into auth.users values ($1),($2)", [editor, viewer]);
    await db.query("insert into members values($1,'admin'),($2,'viewer')", [
      editor,
      viewer,
    ]);
    await db.exec(
      "insert into entries(kind,title,body) values('project','Existing user work','Keep exactly this text')",
    );
    const migration = readFileSync(
      "supabase/migrations/202610_project_content.sql",
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    assert.equal(
      (
        await db.query<{ body: string }>(
          "select body from entries where title='Existing user work'",
        )
      ).rows[0].body,
      "Keep exactly this text",
    );
    assert.equal(
      (
        await db.query<{ public: boolean }>(
          "select public from storage.buckets where id='research-files'",
        )
      ).rows[0].public,
      false,
    );
    const item = {
      import_key: "pbt:test-import",
      kind: "project",
      title: "Owner draft",
      status: "published",
      visibility: "public",
      review_state: "pending",
      section: "engineering",
      provenance: [
        {
          document: "Owner brief",
          date: "2026-10",
          locator: "Design direction",
        },
      ],
      details: {
        rows: [{ label: "Load", value: "Unknown", state: "pending" }],
      },
    };
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select public.import_project_drafts($1)", [
        JSON.stringify([item]),
      ]),
    );
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      viewer,
    ]);
    await db.exec("set role authenticated");
    await assert.rejects(
      db.query("select public.import_project_drafts($1)", [
        JSON.stringify([item]),
      ]),
    );
    assert.equal(
      (await db.query("select * from content_import_items")).rows.length,
      0,
    );
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      editor,
    ]);
    await db.exec("set role authenticated");
    const first = await db.query<{
      result: { inserted: number; skipped: number };
    }>("select public.import_project_drafts($1) result", [
      JSON.stringify([item]),
    ]);
    assert.equal(first.rows[0].result.inserted, 1);
    const saved = await db.query<{
      id: string;
      status: string;
      visibility: string;
    }>("select id,status,visibility from entries where title='Owner draft'");
    assert.equal(saved.rows[0].status, "draft");
    assert.equal(saved.rows[0].visibility, "team");
    const id = saved.rows[0].id;
    await db.query(
      "update entries set title='Administrator edit' where id=$1",
      [id],
    );
    const again = await db.query<{
      result: { inserted: number; skipped: number };
    }>("select public.import_project_drafts($1) result", [
      JSON.stringify([item]),
    ]);
    assert.equal(again.rows[0].result.inserted, 0);
    assert.equal(again.rows[0].result.skipped, 1);
    assert.equal(
      (
        await db.query(
          "select id from entries where title='Administrator edit'",
        )
      ).rows.length,
      1,
    );
    await db.query("delete from entries where id=$1", [id]);
    await db.query("select public.import_project_drafts($1)", [
      JSON.stringify([item]),
    ]);
    assert.equal(
      (await db.query("select id from entries where title='Owner draft'")).rows
        .length,
      0,
    );
    const count = (await db.query("select * from content_import_items")).rows
      .length;
    await assert.rejects(
      db.query("select public.import_project_drafts($1)", [
        JSON.stringify([
          { ...item, import_key: "pbt:atomic-first" },
          { ...item, import_key: "pbt:atomic-bad", title: "" },
        ]),
      ]),
    );
    assert.equal(
      (await db.query("select * from content_import_items")).rows.length,
      count,
    );
    await assert.rejects(db.exec("delete from content_import_items"));
    await db.exec(
      "insert into storage.objects(bucket_id,name) values('research-files','33333333-3333-4333-8333-333333333333/slides.pptx')",
    );
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub','',false)");
    await db.exec("set role anon");
    assert.equal(
      (await db.query("select id from entries where section='engineering'"))
        .rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
