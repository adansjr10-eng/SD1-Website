import type { SupabaseClient } from "@supabase/supabase-js";
import { explainBackendError } from "./backend-config";
export type SmokeCheck = { label: string; passed: boolean; detail: string };
export type SmokeReport = {
  passed: boolean;
  checks: SmokeCheck[];
  cleanupIssues: string[];
};
function requireCondition(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function requireSuccess(error: { code?: string; message?: string } | null) {
  if (error) throw new Error(explainBackendError(error));
}
/** A real, renderable PDF. Offsets are byte-correct because all content is ASCII. */
export function testPdf() {
  const stream =
    "BT /F1 12 Tf 36 80 Td (RAIL LAB temporary storage verification) Tj ET\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 360 144] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const start = pdf.length;
  pdf +=
    "xref\n0 6\n0000000000 65535 f \n" +
    offsets
      .slice(1)
      .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
      .join("");
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
export function testImage() {
  return Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=",
    ),
    (c) => c.charCodeAt(0),
  );
}
/** Uses existing user authorization. Never modifies existing research or publishes fixtures publicly. */
export async function runAdminSmokeTest(
  client: SupabaseClient,
  anonymous: SupabaseClient,
  onProgress?: (checks: SmokeCheck[]) => void,
): Promise<SmokeReport> {
  const checks: SmokeCheck[] = [];
  const cleanupIssues: string[] = [];
  let stage = "Validate administrator session",
    entryId = "";
  const runId = crypto.randomUUID();
  const files: { path: string; id?: string }[] = [];
  function pass(detail: string) {
    checks.push({ label: stage, passed: true, detail });
    onProgress?.([...checks]);
  }
  try {
    const user = await client.auth.getUser();
    requireSuccess(user.error);
    requireCondition(
      user.data.user,
      "Sign in with an authorized team account first.",
    );
    const membership = await client
      .from("members")
      .select("role")
      .eq("user_id", user.data.user.id)
      .single();
    requireSuccess(membership.error);
    requireCondition(
      membership.data && ["admin", "editor"].includes(membership.data.role),
      "Editor or admin membership is required.",
    );
    pass("Supabase validated your session and authorized membership.");
    stage = "Verify private storage and policy configuration";
    const status = await client.rpc("research_backend_status");
    requireSuccess(status.error);
    requireCondition(
      status.data &&
        [
          "tables_ready",
          "policies_present",
          "bucket_exists",
          "bucket_private",
          "upload_limit_ok",
          "images_allowed",
          "pdf_allowed",
        ].every((k) => status.data[k] === true),
      "Configuration is incomplete. Run Check connection and review supabase/verify.sql.",
    );
    pass(
      "Required policy names, RLS, private research-files bucket, 25 MB limit, and image/PDF formats are configured.",
    );
    stage = "Create and edit a temporary tester";
    const insert = await client
      .from("entries")
      .insert({
        kind: "tester",
        title: `STORAGE VERIFICATION ${runId}`,
        status: "draft",
        visibility: "team",
        summary: "Temporary verification fixture. Not engineering data.",
      })
      .select("id")
      .single();
    requireSuccess(insert.error);
    requireCondition(insert.data?.id, "The test entry was not returned.");
    entryId = insert.data.id;
    const updated = await client
      .from("entries")
      .update({
        specs: { rpm: 500, load: 10 },
        body: "Temporary verification notes. Not equipment specifications.",
      })
      .eq("id", entryId)
      .select("id")
      .single();
    requireSuccess(updated.error);
    const saved = await client
      .from("entries")
      .select("specs,body,status,visibility")
      .eq("id", entryId)
      .single();
    requireSuccess(saved.error);
    requireCondition(
      saved.data?.specs.rpm === 500 &&
        saved.data.specs.load === 10 &&
        saved.data.body ===
          "Temporary verification notes. Not equipment specifications." &&
        saved.data.status === "draft" &&
        saved.data.visibility === "team",
      "Tester data did not persist correctly.",
    );
    pass(
      "A new database request returned the saved notes and numeric specifications.",
    );
    stage = "Check team-only publication";
    const publish = await client
      .from("entries")
      .update({ status: "published" })
      .eq("id", entryId)
      .select("id")
      .single();
    requireSuccess(publish.error);
    const hidden = await anonymous
      .from("entries")
      .select("id")
      .eq("id", entryId);
    requireSuccess(hidden.error);
    requireCondition(
      hidden.data?.length === 0,
      "Anonymous access exposed a team-only record.",
    );
    pass(
      "The entry can be published for the team and remains hidden from anonymous readers.",
    );
    for (const file of [
      { name: "verification.png", mime: "image/png", bytes: testImage() },
      { name: "verification.pdf", mime: "application/pdf", bytes: testPdf() },
    ]) {
      stage = `Upload and re-download ${file.mime === "image/png" ? "image" : "PDF"}`;
      const path = `${runId}/${file.name}`;
      const upload = await client.storage
        .from("research-files")
        .upload(path, file.bytes, { contentType: file.mime });
      requireSuccess(upload.error);
      const record: { path: string; id?: string } = { path };
      files.push(record);
      const metadata = await client
        .from("resources")
        .insert({
          entry_id: entryId,
          path,
          name: file.name,
          mime: file.mime,
          size: file.bytes.length,
          caption: "Temporary verification attachment",
          status: "draft",
          visibility: "team",
        })
        .select("id")
        .single();
      requireSuccess(metadata.error);
      requireCondition(metadata.data?.id, "Attachment metadata was not saved.");
      record.id = metadata.data.id;
      const persisted = await client
        .from("resources")
        .select("id,path,caption")
        .eq("id", record.id)
        .single();
      requireSuccess(persisted.error);
      requireCondition(
        persisted.data?.path === path &&
          persisted.data.caption === "Temporary verification attachment",
        "Attachment information did not persist.",
      );
      const download = await client.storage
        .from("research-files")
        .download(path);
      requireSuccess(download.error);
      requireCondition(download.data, "Stored file could not be downloaded.");
      const bytes = new Uint8Array(await download.data.arrayBuffer());
      requireCondition(
        bytes.length === file.bytes.length &&
          bytes.every((value, i) => value === file.bytes[i]),
        "Downloaded bytes differ from the uploaded file.",
      );
      const privateRead = await anonymous
        .from("resources")
        .select("id")
        .eq("id", record.id);
      requireSuccess(privateRead.error);
      requireCondition(
        privateRead.data?.length === 0,
        "Anonymous access exposed private attachment metadata.",
      );
      const denied = await anonymous.storage
        .from("research-files")
        .download(path);
      const denial = denied.error as {
        status?: number;
        statusCode?: string;
      } | null;
      requireCondition(
        denial &&
          ["401", "403", "404"].includes(
            String(denial.statusCode ?? denial.status),
          ),
        "Anonymous file access was not conclusively denied by storage. Check the private bucket policy and retry.",
      );
      const signed = await client.storage
        .from("research-files")
        .createSignedUrl(path, 30);
      requireSuccess(signed.error);
      requireCondition(
        signed.data?.signedUrl,
        "The authorized file preview link was not created.",
      );
      pass(
        "Metadata and file bytes persisted in Supabase; anonymous access was denied and an authorized preview link was created.",
      );
    }
  } catch (error) {
    checks.push({
      label: stage,
      passed: false,
      detail: explainBackendError(error as Error),
    });
    onProgress?.([...checks]);
  } finally {
    for (const file of files) {
      try {
        const removed = await client.storage
          .from("research-files")
          .remove([file.path]);
        requireSuccess(removed.error);
        requireCondition(
          removed.data?.some((object) => object.name === file.path),
          "Storage did not confirm deletion of the verification object.",
        );
        if (file.id) {
          const metadata = await client
            .from("resources")
            .delete()
            .eq("id", file.id)
            .select("id")
            .single();
          requireSuccess(metadata.error);
        }
      } catch {
        cleanupIssues.push(
          `Remove verification file ${file.path}${file.id ? ` and attachment ${file.id}` : ""}.`,
        );
      }
    }
    if (entryId) {
      try {
        const removed = await client
          .from("entries")
          .delete()
          .eq("id", entryId)
          .select("id")
          .single();
        requireSuccess(removed.error);
      } catch {
        cleanupIssues.push(
          `Remove verification entry ${entryId} after its attachments.`,
        );
      }
    }
    if (entryId || files.length) {
      checks.push({
        label: "Remove temporary verification data",
        passed: cleanupIssues.length === 0,
        detail: cleanupIssues.length
          ? cleanupIssues.join(" ")
          : "This run’s test attachments and tester entry were deleted. Existing research was not modified.",
      });
      onProgress?.([...checks]);
    }
  }
  return {
    passed:
      checks.length > 0 &&
      checks.every((c) => c.passed) &&
      cleanupIssues.length === 0,
    checks,
    cleanupIssues,
  };
}
