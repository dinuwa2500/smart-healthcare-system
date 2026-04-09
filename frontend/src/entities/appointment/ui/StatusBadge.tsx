import { Badge } from '../../../shared/ui/Badge';
import type { AppointmentStatus } from '../model';

const MAP: Record<AppointmentStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' }> = {
  pending:            { label: 'Pending',    variant: 'warning' },
  confirmed:          { label: 'Confirmed',  variant: 'success' },
  completed:          { label: 'Completed',  variant: 'info'    },
  cancelled_patient:  { label: 'Cancelled',  variant: 'danger'  },
  cancelled_doctor:   { label: 'Cancelled',  variant: 'danger'  },
  no_show:            { label: 'No Show',    variant: 'default' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, variant } = MAP[status] ?? { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}
