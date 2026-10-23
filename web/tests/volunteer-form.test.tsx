import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VolunteerForm } from "@/components/forms/volunteer-form";

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  window.scrollTo = vi.fn();
});

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), "Asha");
  await user.type(screen.getByLabelText(/last name/i), "Nair");
  await user.type(screen.getByLabelText(/mobile number/i), "+966501234567");
  await user.type(screen.getByLabelText(/email address/i), "asha@example.com");
  await user.click(screen.getByRole("checkbox", { name: /i agree/i }));
}
const submit = () => screen.getByRole("button", { name: /register as a volunteer|submitting/i });

describe("VolunteerForm", () => {
  it("shows required-field errors and does not call the API", async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);
    await user.click(submit());
    expect(await screen.findAllByText(/this field is required/i)).not.toHaveLength(0);
    expect(screen.getByText(/must accept the declaration/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates email and phone formats inline", async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);
    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.type(screen.getByLabelText(/mobile number/i), "abc");
    await user.click(submit());
    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/valid phone number/i)).toBeInTheDocument();
  });

  it("shows loading, blocks double submit, then shows the reference from the backend", async () => {
    const user = userEvent.setup();
    let release!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (release = r)));
    render(<VolunteerForm />);
    await fillRequired(user);
    await user.dblClick(submit());
    await waitFor(() => expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("reference")).not.toBeInTheDocument(); // no success before backend confirms
    release(new Response(JSON.stringify({ ok: true, reference: "IOF-VOL-00042" }), { status: 200 }));
    expect(await screen.findByTestId("reference")).toHaveTextContent("IOF-VOL-00042");
    expect(screen.getByText(/registration has been received successfully/i)).toBeInTheDocument();
  });

  it("sends an Idempotency-Key header", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, reference: "IOF-VOL-1" }), { status: 200 }));
    render(<VolunteerForm />);
    await fillRequired(user);
    await user.click(submit());
    await screen.findByTestId("reference");
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toMatch(/^[A-Za-z0-9-]{16,64}$/);
  });

  it("keeps entered values and reuses the same key when a retry follows a server error", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: "unavailable", message: "Our registration system is temporarily unavailable. Your details were not saved." }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, reference: "IOF-VOL-2" }), { status: 200 }));
    render(<VolunteerForm />);
    await fillRequired(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent(/not saved/i);
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Asha");
    await user.click(submit());
    await screen.findByTestId("reference");
    const keys = fetchMock.mock.calls.map((c) => c[1].headers["Idempotency-Key"]);
    expect(keys[0]).toBe(keys[1]);
  });

  it("shows a network failure without claiming success", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    render(<VolunteerForm />);
    await fillRequired(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach the server/i);
    expect(screen.queryByTestId("reference")).not.toBeInTheDocument();
  });

  it("maps server field errors onto the fields", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: false, error: "validation_error", message: "Please correct the highlighted fields.", fields: { mobile: "Enter a valid phone number." } }), { status: 422 }));
    render(<VolunteerForm />);
    await fillRequired(user);
    await user.click(submit());
    expect(await screen.findByText("Enter a valid phone number.")).toBeInTheDocument();
  });
});
