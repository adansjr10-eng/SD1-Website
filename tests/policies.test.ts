import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("database policies isolate drafts, team records, linked attachments, and writer permissions", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant select,insert,update,delete on storage.objects to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(
      readFileSync("supabase/schema.sql", "utf8").replace(
        "create extension if not exists pgcrypto;",
        "",
      ),
    );
    await db.exec(readFileSync("supabase/admin-diagnostics.sql", "utf8"));
    await db.exec(readFileSync("supabase/verify.sql", "utf8"));
    const editor = "11111111-1111-4111-8111-111111111111",
      viewer = "22222222-2222-4222-8222-222222222222";
    await db.query("insert into auth.users values ($1),($2)", [editor, viewer]);
    await db.query(
      "insert into public.members values ($1,'editor'),($2,'viewer')",
      [editor, viewer],
    );
    const ids = [
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    ];
    await db.query(
      "insert into entries(id,kind,title,status,visibility) values($1,'tester','Public rig','published','public'),($2,'tester','Team rig','published','team'),($3,'tester','Draft rig','draft','public')",
      ids,
    );
    const paths = [
      "11111111-1111-4111-8111-111111111111/public.pdf",
      "22222222-2222-4222-8222-222222222222/team.pdf",
      "33333333-3333-4333-8333-333333333333/draft.pdf",
    ];
    for (let i = 0; i < 3; i++) {
      await db.query(
        "insert into resources(entry_id,name,path,mime,size,status,visibility) values($1,$2,$3,'application/pdf',100,'published','public')",
        [ids[i], ["public.pdf", "team.pdf", "draft.pdf"][i], paths[i]],
      );
      await db.query(
        "insert into storage.objects(bucket_id,name) values('research-files',$1)",
        [paths[i]],
      );
    }
    await db.exec("set role anon");
    await assert.rejects(db.query("select public.research_backend_status()"));
    assert.equal((await db.query("select * from entries")).rows.length, 1);
    assert.equal((await db.query("select * from resources")).rows.length, 1);
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      1,
    );
    await assert.rejects(
      db.exec(
        "insert into entries(kind,title) values('tester','Unauthorized')",
      ),
    );
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      viewer,
    ]);
    await db.exec("set role authenticated");
    assert.equal((await db.query("select * from entries")).rows.length, 2);
    assert.equal((await db.query("select * from resources")).rows.length, 2);
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      2,
    );
    assert.equal((await db.query("select * from members")).rows.length, 1);
    await assert.rejects(db.query("select public.research_backend_status()"));
    assert.equal(
      (
        await db.query(
          "update entries set title='Unauthorized edit' returning id",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query("delete from entries returning id")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("delete from storage.objects returning name")).rows
        .length,
      0,
    );
    await assert.rejects(
      db.exec(
        "insert into resources(name,path,mime,size) values('bad.pdf','44444444-4444-4444-8444-444444444444/bad.pdf','application/pdf',100)",
      ),
    );
    await assert.rejects(
      db.exec(
        "insert into storage.objects(bucket_id,name) values('research-files','44444444-4444-4444-8444-444444444444/viewer.pdf')",
      ),
    );
    await assert.rejects(
      db.exec(
        "insert into entries(kind,title) values('tester','Unauthorized')",
      ),
    );
    await assert.rejects(
      db.query("update members set role='admin' where user_id=$1", [viewer]),
    );
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      editor,
    ]);
    await db.exec("set role authenticated");
    assert.equal((await db.query("select * from entries")).rows.length, 3);
    assert.equal((await db.query("select * from resources")).rows.length, 3);
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      3,
    );
    const diagnostic = await db.query<{ status: Record<string, boolean> }>(
      "select public.research_backend_status() as status",
    );
    assert.ok(Object.values(diagnostic.rows[0].status).every(Boolean));
    const created = await db.query<{ id: string }>(
      "insert into entries(kind,title) values('tester','Created by editor') returning id",
    );
    const createdId = created.rows[0].id;
    await db.query(
      "update entries set title='Edited by editor',specs='{\"rpm\":500,\"load\":20}',body='Saved research' where id=$1",
      [createdId],
    );
    const saved = await db.query<{
      title: string;
      specs: { rpm: number; load: number };
      body: string;
    }>("select title,specs,body from entries where id=$1", [createdId]);
    assert.equal(saved.rows[0].title, "Edited by editor");
    assert.deepEqual(saved.rows[0].specs, { rpm: 500, load: 20 });
    assert.equal(saved.rows[0].body, "Saved research");
    assert.equal(
      (
        await db.query("delete from entries where id=$1 returning id", [
          createdId,
        ])
      ).rows.length,
      1,
    );
    await assert.rejects(
      db.exec(
        "insert into entries(kind,title,specs) values('tester','Invalid load','{\"load\":-1}')",
      ),
    );
    await assert.rejects(
      db.exec(
        'insert into entries(kind,title,sources) values(\'tester\',\'Unsafe source\',\'[{"label":"Bad","url":"javascript:alert(1)"}]\')',
      ),
    );
    await assert.rejects(db.query("delete from entries where id=$1", [ids[1]]));
    await assert.rejects(
      db.exec(
        "insert into storage.objects(bucket_id,name) values('research-files','bad.html')",
      ),
    );
    await db.exec(
      "insert into storage.objects(bucket_id,name) values('research-files','44444444-4444-4444-8444-444444444444/allowed.pdf')",
    );
  } finally {
    await db.close();
  }
});
