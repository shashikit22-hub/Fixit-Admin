import { statusColors, statusDotColors } from '../../constants/status'
import Badge from './Badge'

export default function StatusBadge({ status }) {
  return (
    <Badge className={statusColors[status] || 'bg-gray-100 text-gray-700'} dot={statusDotColors[status]}>
      {status === 'InProgress' ? 'In Progress' : status}
    </Badge>
  )
}
