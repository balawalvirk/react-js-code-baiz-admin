interface BadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-600',
  new: 'bg-primary-100 text-primary-700',
  reviewed: 'bg-yellow-100 text-yellow-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-600',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  open: 'Open',
  closed: 'Closed',
  new: 'New',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
};

export default function StatusBadge({ status }: BadgeProps) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
  const label = statusLabels[status] || status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
