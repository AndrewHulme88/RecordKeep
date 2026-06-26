import { notFound } from "next/navigation";
import { getRecordById } from "@/lib/records";
import EditRecordForm from "./EditRecordForm";

type EditRecordPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditRecordPage({
    params,
}: EditRecordPageProps) {
    const { id } = await params;
    const record = await getRecordById(id);

    if (!record) {
        notFound();
    }

    return <EditRecordForm record={record} />;
}