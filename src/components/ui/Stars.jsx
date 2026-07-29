import { MdStar, MdStarBorder } from 'react-icons/md'

export default function Stars({ rating, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i =>
        i <= rating
          ? <MdStar key={i} size={size} className="text-yellow-400" />
          : <MdStarBorder key={i} size={size} className="text-gray-300" />
      )}
    </span>
  )
}
