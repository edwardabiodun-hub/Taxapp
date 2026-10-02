import { Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExportArtifact, ExportPackage } from "@/domain/exports";

interface ExportPanelProps {
  readonly exportPackage: ExportPackage;
  readonly onDownload?: (artifact: ExportArtifact) => void;
}

const labels = { pdf: "PDF", csv: "CSV", xlsx: "XLSX" } as const;

export function downloadExportArtifact(artifact: ExportArtifact): void {
  const url = URL.createObjectURL(artifact.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = artifact.fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

const ExportPanel = ({ exportPackage, onDownload }: ExportPanelProps) => {
  const download = (artifact: ExportArtifact) => {
    if (onDownload) {
      onDownload(artifact);
      return;
    }
    downloadExportArtifact(artifact);
  };

  return (
    <Card aria-label="Export package" className="mt-5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Download tax package</CardTitle>
            <CardDescription className="mt-1">
              {exportPackage.metadata.jurisdiction} · {exportPackage.metadata.taxYear} · {exportPackage.metadata.calculationLabel}
            </CardDescription>
          </div>
          <span className="rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-warning">
            Not submitted
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          These files are for review or manual upload. Downloading does not file a return or confirm acceptance by a tax authority.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {exportPackage.artifacts.map((artifact) => (
            <Button
              key={artifact.format}
              type="button"
              variant="outline"
              aria-label={`Download ${labels[artifact.format]}`}
              onClick={() => download(artifact)}
              className="justify-start"
            >
              {artifact.format === "pdf" ? <FileText /> : artifact.format === "csv" ? <Table2 /> : <FileSpreadsheet />}
              Download {labels[artifact.format]}
              <Download className="ml-auto" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportPanel;
