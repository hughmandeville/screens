import { Rotator } from "./Rotator";
import { LoginGate } from "./LoginGate";

export default function Home() {
  return (
    <LoginGate>
      <Rotator />
    </LoginGate>
  );
}
