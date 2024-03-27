import Covers from "@/components/covers";
import Hero from "@/components/hero";
import Input from "@/components/input";
import {initEnv} from "@/services/core"
export default function () {
  initEnv();
  return (
    <div className="w-full px-6">
      <Hero />
      <Input />
      {/* <Covers /> */}
    </div>
  );
}
