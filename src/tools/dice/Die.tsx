// 3×3 网格中点的位置索引，只有 d6 用传统点阵
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

type Props = { value: number; sides: number; rolling?: boolean }

export function Die({ value, sides, rolling }: Props) {
  const pips = sides === 6 ? PIPS[value] : undefined

  return (
    <div
      className={`flex aspect-square items-center justify-center rounded-2xl border border-amber-400/25 bg-gradient-to-br from-surface-2 to-surface shadow-lg transition-transform ${
        rolling ? 'animate-pulse' : ''
      }`}
    >
      {pips ? (
        <div className="grid size-3/5 grid-cols-3 grid-rows-3 gap-0.5">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className={`m-auto size-2 rounded-full sm:size-2.5 ${
                pips.includes(i) ? 'bg-amber-300' : ''
              }`}
            />
          ))}
        </div>
      ) : (
        <span className="font-mono text-3xl font-bold tabular-nums text-amber-300 sm:text-4xl">
          {value}
        </span>
      )}
    </div>
  )
}
