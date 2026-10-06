"use server";

import { revalidatePath } from "next/cache";
import {
  endAdminSession,
  isAdmin,
  passwordMatches,
  startAdminSession,
} from "@/lib/admin-auth";
import { isStatus, setRegistrationStatus } from "@/lib/registrations";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // slow down guessing
    return { error: "That password isn't right." };
  }
  await startAdminSession();
  revalidatePath("/admin");
  return {};
}

export async function logout() {
  await endAdminSession();
  revalidatePath("/admin");
}

export async function updateStatus(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Not signed in.");
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!isStatus(status)) throw new Error("Unknown status.");
  await setRegistrationStatus(id, status);
  revalidatePath("/admin");
}
