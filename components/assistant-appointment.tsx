"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentForm } from "@/components/appointment-form";
import { brasiliaDay } from "@/lib/appointments";
import { formatDate } from "@/lib/models";

type AppointmentRequest = { clientName: string; startsAt: string };

export function AssistantAppointment({ onBack, locked, onLockChange, request }: { onBack: () => void; locked: boolean; onLockChange: (value: boolean) => void; request?: AppointmentRequest }) {
  const [day] = useState(() => brasiliaDay());
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <div className="space-y-5 py-5">
    <Button variant="ghost" className="h-11 px-0" disabled={locked} onClick={onBack}><ArrowLeft className="size-4" />Voltar às consultas</Button>
    <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-offset-2">{request ? "Conferir agendamento" : "Agendar atendimento"}</h2>
    {request && <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950">
      <p>Entendi: agendar <strong>{request.clientName}</strong> para <strong>{formatDate(request.startsAt)} às {request.startsAt.slice(11)}</strong>, horário de Brasília.</p>
      <p className="mt-1">Confira o cliente. Escolha o serviço ou assunto e confirme a duração antes de revisar o horário.</p>
    </div>}
    <AppointmentForm appointment={null} day={day} initialCustomerName={request?.clientName} initialStartAt={request?.startsAt} reviewBeforeSave onBusy={onLockChange} onCancel={onBack}
      onSaved={appointment => window.location.assign(`/agenda?data=${appointment.startsAt.slice(0, 10)}`)} />
  </div>;
}
