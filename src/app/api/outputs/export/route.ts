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
  const lines = ["# Execution OS Outputs", ""];

  entries.forEach((entry) => {
    lines.push(`## ${entry.date.toDateString()}`);
    lines.push(`- Block: ${entry.blockName || "Output"}`);
    lines.push(`- Type: ${entry.outputType ?? "text"}`);
    lines.push("- Output:");
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

  const outputs = await prisma.dailyCompletion.findMany({
    where: {
      userId: session.user.id,
      outputContent: { not: null },
      date: { gte: startOfDay(start), lte: startOfDay(end) },
    },
    orderBy: { date: "asc" },
  });

  const wins = await prisma.dailyWin.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startOfDay(start), lte: startOfDay(end) },
    },
  });

  const blockIds = wins
    .map((win) => (win.satisfiedBy.startsWith("block:") ? win.satisfiedBy.split(":")[1] : ""))
    .filter(Boolean);

  const blocks = await prisma.scheduleBlock.findMany({
    where: { id: { in: blockIds } },
  });

  const blockMap = new Map(blocks.map((block) => [block.id, block.name]));
  const winMap = new Map(wins.map((win) => [win.date.toISOString(), win]));

  const entries = outputs.map((output) => {
    const win = winMap.get(output.date.toISOString());
    let blockName = "Output";
    if (win?.satisfiedBy.startsWith("block:")) {
      const blockId = win.satisfiedBy.split(":")[1];
      blockName = blockMap.get(blockId) ?? "Output";
    }
    return {
      date: output.date,
      outputContent: output.outputContent ?? "",
      outputType: output.outputType,
      blockName,
    };
  });

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    doc.fontSize(18).text("Execution OS Outputs", { underline: true });
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

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=execution-outputs.pdf",
      },
    });
  }

  const markdown = buildMarkdown(entries);
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": "attachment; filename=execution-outputs.md",
    },
  });
}
