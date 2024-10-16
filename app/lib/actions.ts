"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid", "canceled", "overdue"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true, id: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  const dueDate = new Date();
  dueDate.setDate(new Date().getDate() + 14);

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date, due_date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${dueDate.toISOString().split("T")[0]})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Invoice." + `${error}`,
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    const currentInvoice = await sql`
      SELECT status FROM invoices WHERE id = ${id}
    `;

    const oldStatus = currentInvoice?.rows[0]?.status;

    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    if (oldStatus !== status) {
      await sql`
        INSERT INTO invoice_audit_logs (invoice_id, old_status, new_status, changed_by, action)
        VALUES (${id}, ${oldStatus}, ${status}, ${customerId}, 'status_change')
      `;
    }
  } catch (error) {
    console.error("Database Error: Failed to Update Invoice.", error);
    return { message: `Database Error: Failed to Update Invoice. ${error}` };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function cancelInvoice(id: string) {
  // throw new Error('Failed to Cancel Invoice');

  try {
    await sql`UPDATE invoices
    SET status = 'canceled'
    WHERE id = ${id}`;
    revalidatePath("/dashboard/invoices");
    return { message: "Canceled Invoice" };
  } catch (error) {
    return { message: "Database Error: Failed to Cancel Invoice." };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
export async function updateInvoiceStatus(
  id: string,
  status: string,
  customerId: string
) {
  try {
    const currentInvoice = await sql`
      SELECT status FROM invoices WHERE id = ${id}
    `;

    const oldStatus = currentInvoice?.rows[0]?.status;

    await sql`
      UPDATE invoices
      SET status = ${status}
      WHERE id = ${id}
    `;

    if (oldStatus !== status) {
      await sql`
        INSERT INTO invoice_audit_logs (invoice_id, old_status, new_status, changed_by, action)
        VALUES (${id}, ${oldStatus}, ${status}, ${customerId}, 'status_change')
      `;
    }
    revalidatePath("/dashboard/invoices");
  } catch (error) {
    return { message: "Database Error: Failed to Update Invoice Status." };
  }
}

export async function restoreInvoiceStatus(logId: number) {
  try {
    const log = await sql`
      SELECT invoice_id, old_status
      FROM invoice_audit_logs
      WHERE id = ${logId}
    `;

    if (!log || !log.rows.length) {
      throw new Error("Log not found");
    }

    const { invoice_id, old_status } = log.rows[0];

    await sql`
      UPDATE invoices
      SET status = ${old_status}
      WHERE id = ${invoice_id}
    `;

    await sql`
      INSERT INTO invoice_audit_logs (invoice_id, old_status, new_status, changed_by, action)
      VALUES (${invoice_id}, ${old_status}, ${old_status}, 'system', 'restored')
    `;
  } catch (error) {
    console.error("Error restoring invoice status:", error);
    throw new Error("Failed to restore invoice status." + `${error}`);
  }
}
