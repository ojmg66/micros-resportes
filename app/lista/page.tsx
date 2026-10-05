import ReporteForm from "@/components/reportes/ReporteForm";

export default function CreateReportePage() {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold">Nuevo producto</h1>

                <p className="text-sm text-muted-foreground">Crea un nuevo producto</p>
            </div>

            <ReporteForm />
        </div>
    );
}
