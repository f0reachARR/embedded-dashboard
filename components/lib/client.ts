import type { AppType } from "../..";
import { hc } from "hono/client";

export const client = hc<AppType>("http://localhost:3000");
