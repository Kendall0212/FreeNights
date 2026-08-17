import { initials } from "../lib/colours";

interface Props {
  name: string;
  colour: string;
  size?: number;
  dim?: boolean;
}

export default function Avatar({ name, colour, size = 28, dim = false }: Props) {
  return (
    <span
      title={name}
      className="inline-flex items-center justify-center rounded-full font-mono font-bold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: colour,
        opacity: dim ? 0.35 : 1,
      }}
    >
      {initials(name)}
    </span>
  );
}
