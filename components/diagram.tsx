export default function Diagram({
  variant = 0,
  hero = false,
}: {
  variant?: number;
  hero?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 580 280"
      fill="none"
      aria-label="Illustrative bearing test rig schematic; not an engineering drawing"
      role="img"
      className={hero ? "hero-diagram" : "rig-diagram"}
    >
      <defs>
        <pattern
          id={`grid-${variant}-${hero}`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 24 0 L 0 0 0 24" stroke="currentColor" opacity=".08" />
        </pattern>
        <linearGradient id={`metal-${variant}`} x2="1" y2="1">
          <stop stopColor="#dae5ea" />
          <stop offset=".5" stopColor="#819aa9" />
          <stop offset="1" stopColor="#ccdae2" />
        </linearGradient>
      </defs>
      <rect width="580" height="280" fill={`url(#grid-${variant}-${hero})`} />
      <g transform={variant === 2 ? "translate(0,-5)" : ""}>
        <path d="M77 227H495L521 239H100Z" fill="#3d5d71" stroke="#a6c2d0" />
        <path d="M100 239V253H521V239M100 253L77 241V227" stroke="#7496ab" />
        <path
          d="M124 222V126L157 109H427L459 126V222"
          stroke="#81a1b6"
          strokeWidth="9"
        />
        <path
          d="M124 128H459M156 110V213M427 110V213"
          stroke="#c7d9e2"
          strokeWidth="3"
        />
        <path d="M164 214H425V225H164Z" fill="#7993a4" />
        <path d="M251 75H336V108H251Z" fill="#698ca2" stroke="#b4ccd9" />
        <path d="M273 108V144H313V108" fill="#a9becb" stroke="#d8e2e9" />
        <path
          d="M236 151H347L365 168V192H220V166Z"
          fill="#638399"
          stroke="#bad0dc"
        />
        <path d="M207 171H392V187H207Z" fill={`url(#metal-${variant})`} />
        <ellipse
          cx="287"
          cy="179"
          rx="34"
          ry="43"
          fill="#2c4e66"
          stroke="#c3d6e1"
          strokeWidth="5"
        />
        <ellipse
          cx="287"
          cy="179"
          rx="22"
          ry="29"
          fill="#7c97aa"
          stroke="#c3d6e1"
          strokeWidth="3"
        />
        <ellipse
          cx="287"
          cy="179"
          rx="10"
          ry="17"
          fill="#17394f"
          stroke="#c5d9e4"
        />
        <path
          d="M317 150L341 140M321 157L345 147M320 202L344 192M315 208L339 198"
          stroke="#abc4d3"
          strokeWidth="5"
        />
        <path d="M158 181H198V219H158Z" fill="#496a80" stroke="#b0c8d6" />
        <ellipse cx="178" cy="181" rx="20" ry="8" fill="#92adbd" />
        <path
          d="M174 190V208M182 190V208M166 190V208M190 190V208"
          stroke="#9eb8c8"
        />
        <path d="M379 189V211M402 189V211" stroke="#b6cedb" strokeWidth="4" />
        <path d="M361 76H401V103H361Z" stroke="#6f9eb8" />
        <path d="M381 103V137L364 148" stroke="#71b4b5" strokeDasharray="4 4" />
        <path
          d="M90 88H226M90 83V93M226 83V93M465 155H528M523 150L528 155L523 160"
          stroke="#5f8caa"
          opacity=".7"
        />
        {hero && (
          <>
            <text
              x="91"
              y="76"
              fill="#83a7bc"
              fontSize="9"
              fontFamily="monospace"
            >
              CONTROLLED ROTATION
            </text>
            <text
              x="351"
              y="58"
              fill="#83a7bc"
              fontSize="9"
              fontFamily="monospace"
            >
              VERTICAL LOAD
            </text>
            <path d="M294 37V64M289 58L294 64L299 58" stroke="#6ac0bc" />
            <text
              x="365"
              y="264"
              fill="#83a7bc"
              fontSize="8"
              fontFamily="monospace"
            >
              CONCEPT SCHEMATIC · NOT TO SCALE
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
