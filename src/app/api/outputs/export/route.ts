import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/time";

const toDate = (value: string | null, fallback: Date) => {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const buildMarkdown = (
  entries: {
    date: Date;
    outputContent: string;
    outputType: string | null;
    blockName: string;
  }[],
) => {
  const lines = ["# Goal Artifacts", ""];

  entries.forEach((entry) => {
    lines.push(`## ${entry.date.toDateString()}`);
    lines.push(`- Block: ${entry.blockName || "Goal artifact"}`);
    lines.push(`- Type: ${entry.outputType ?? "text"}`);
    lines.push("- Artifact:");
    lines.push(`  - ${entry.outputContent.replace(/\n/g, " ")}`);
    lines.push("");
  });

  return lines.join("\n");
};

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "md";
  const now = startOfDay(new Date());
  const start = toDate(url.searchParams.get("start"), now);
  const end = toDate(url.searchParams.get("end"), now);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeGoalId: true },
  });

  const artifacts = await prisma.goalArtifact.findMany({
    where: {
      userId: session.user.id,
      goalId: user?.activeGoalId ?? undefined,
      date: { gte: startOfDay(start), lte: startOfDay(end) },
    },
    include: { block: true },
    orderBy: { date: "asc" },
  });

  const entries = artifacts.map((artifact) => ({
    date: artifact.date,
    outputContent: artifact.content ?? artifact.fileUrl ?? "",
    outputType: artifact.type,
    blockName: artifact.block?.name ?? "Goal artifact",
  }));

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    doc.fontSize(18).text("Goal Artifacts", { underline: true });
    doc.moveDown();

    entries.forEach((entry) => {
      doc.fontSize(12).text(entry.date.toDateString(), { underline: true });
      doc.text(`Block: ${entry.blockName}`);
      doc.text(`Type: ${entry.outputType ?? "text"}`);
      doc.text(entry.outputContent);
      doc.moveDown();
    });

    doc.end();

    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=goal-artifacts.pdf",
      },
    });
  }

  const markdown = buildMarkdown(entries);
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": "attachment; filename=goal-artifacts.md",
    },
  });
}
