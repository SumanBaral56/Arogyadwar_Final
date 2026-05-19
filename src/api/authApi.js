const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export async function apiPostJson(path, body) {
  const res = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = (data && data.message) || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.details = data && data.details;
    throw err;
  }

  return data;
}

/** @param {"email"|"phone"} contactMethod */
export function buildLoginPayload(contactMethod, identifier, password) {
  if (contactMethod === "email") {
    return { contactMethod: "email", email: identifier.trim(), password };
  }
  const phone = String(identifier).replace(/[^0-9]/g, "");
  return { contactMethod: "phone", phone, password };
}

export function buildSignupPayload(fullName, contactMethod, email, phone, password) {
  if (contactMethod === "email") {
    return {
      fullName: fullName.trim(),
      contactMethod: "email",
      email: email.trim(),
      password,
    };
  }
  return {
    fullName: fullName.trim(),
    contactMethod: "phone",
    phone: String(phone).replace(/[^0-9]/g, ""),
    password,
  };
}
