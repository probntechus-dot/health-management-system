"use server";

export type DemoRequestState = {
  success: boolean;
  message: string;
} | null;

export async function submitDemoRequest(
  _prevState: DemoRequestState,
  formData: FormData
): Promise<DemoRequestState> {
  const name       = (formData.get("name")        as string)?.trim();
  const email      = (formData.get("email")       as string)?.trim();
  const phone      = (formData.get("phone")       as string)?.trim();
  const clinicName = (formData.get("clinicName")  as string)?.trim();
  const city       = (formData.get("city")        as string)?.trim();
  const doctorCount = formData.get("doctorCount") as string;
  const message    = (formData.get("message")     as string)?.trim();

  if (!name || !email || !phone || !clinicName || !city) {
    return { success: false, message: "Please fill in all required fields." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  // TODO: Wire up notification — e.g. Resend / Nodemailer / DB insert
  // Example DB insert:
  //   await db`INSERT INTO demo_requests (name, email, phone, clinic_name, city, doctor_count, message)
  //            VALUES (${name}, ${email}, ${phone}, ${clinicName}, ${city}, ${doctorCount}, ${message})`
  console.log("[Demo Request]", { name, email, phone, clinicName, city, doctorCount, message });

  return {
    success: true,
    message:
      "Thank you! We'll reach out within 24 hours to schedule your personalised demo.",
  };
}
