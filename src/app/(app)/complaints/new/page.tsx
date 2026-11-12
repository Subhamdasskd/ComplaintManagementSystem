import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewComplaintForm } from "@/components/complaints/new-complaint-form";

export const metadata = { title: "Raise a complaint" };

export default function NewComplaintPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/complaints" className="btn btn-ghost -ml-2 px-2 py-1.5 text-xs">
          <ArrowLeft className="size-3.5" /> Back to complaints
        </Link>
        <p className="mono-label mt-3">New complaint</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Tell us what broke</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          The more specific you are, the faster the service desk can fix it. Priority decides your SLA window.
        </p>
      </div>

      {/* The SLA preview is anchored to the request time on the server. */}
      {/* eslint-disable-next-line react-hooks/purity -- server component: request timestamp */}
      <NewComplaintForm nowMs={Date.now()} />
    </div>
  );
}
