import { handleOrderSession } from "@/services/order";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { log, warn, error } from '@/lib/log';

export default async function ({ params }: { params: { session_id: string } }) {
  try {
    handleOrderSession(params.session_id);
  } catch (e) {
    log("handle order session failed: "+ e);
    toast.error("handle order failed");
  }

  redirect("/");
}
