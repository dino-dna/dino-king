const attributions = [
  {
    song: "Chibi Ninja",
    artist: "Eric Skiff",
    source: "Free Music Archive",
    license: "CC BY",
  },
];

export const Attribution: React.FCC = () => {
  return (
    <div>
      <h2>Attributions</h2>
      <ul>
        {attributions.map((attribution, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <li key={i}>{JSON.stringify(attribution, null, 2)}</li>
        ))}
      </ul>
    </div>
  );
};
